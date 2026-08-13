// app/composables/useGoogleDrive.ts
// Google Drive integration via Google Identity Services (browser-only OAuth).
// Only the client ID is used — no client secret. Scope is drive.file (app-created files only).

import type { Quiz } from '~/types/quiz';

type GsiTokenClient = {
  callback: (response: any) => void;
  requestAccessToken: () => void;
};

interface WindowWithGoogle extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: any) => void;
        }) => GsiTokenClient;
        revoke: (accessToken: string, done: () => void) => void;
      };
    };
  };
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'JustQuiz';
const COMBINED_FILE_NAME = 'justquiz-all-quizzes.json';
const FOLDER_ID_KEY = 'justquiz_drive_folder_id';
const TOKEN_KEY = 'justquiz_drive_token';
const TOKEN_EXPIRES_AT_KEY = 'justquiz_drive_token_expires_at';

// Treat tokens as expired 60s before their actual expiry to avoid boundary races
const EXPIRY_GRACE_MS = 60_000;

// Get the public client ID from Nuxt runtime config (set via NUXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID)
const getClientId = (): string => {
  const config = useRuntimeConfig();
  return (config.public.googleDriveClientId as string) || '';
};

const isGoogleLoaded = (): boolean => {
  return Boolean((window as WindowWithGoogle).google?.accounts?.oauth2);
};

const loadGsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleLoaded()) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
};

export const useGoogleDrive = () => {
  const isSignedIn = ref(false);
  const isBusy = ref(false);
  const isSaving = ref(false);
  const isLoading = ref(false);
  const token = ref('');

  const clearStoredToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
    token.value = '';
    isSignedIn.value = false;
  };

  // Read token from localStorage on init.
  // If the stored token is missing its expiry timestamp or already expired,
  // clear it so the UI honestly shows "Not signed in".
  const restoreToken = () => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY) || 0);
      if (!expiresAt || expiresAt - EXPIRY_GRACE_MS <= Date.now()) {
        clearStoredToken();
        return;
      }
      token.value = saved;
      isSignedIn.value = true;
    }
  };

  if (typeof window !== 'undefined') {
    restoreToken();
  }

  const signIn = async (): Promise<string> => {
    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Google Drive is not configured. Missing NUXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID.');
    }

    await loadGsiScript();

    return new Promise<string>((resolve, reject) => {
      const gsi = (window as WindowWithGoogle).google?.accounts?.oauth2;
      if (!gsi) {
        reject(new Error('Google Identity Services failed to initialize.'));
        return;
      }

      const tokenClient = gsi.initTokenClient({
        client_id: clientId,
        scope: DRIVE_FILE_SCOPE,
        callback: (response: any) => {
          if (response?.error) {
            reject(new Error(response.error_description || 'Sign-in was cancelled or failed.'));
            return;
          }
          if (response?.access_token) {
            token.value = response.access_token;
            const expiresInMs = Number(response.expires_in || 3600) * 1000;
            localStorage.setItem(TOKEN_KEY, response.access_token);
            localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInMs));
            isSignedIn.value = true;
            resolve(response.access_token);
          } else {
            reject(new Error('No access token returned.'));
          }
        },
      });

      tokenClient.requestAccessToken();
    });
  };

  const signOut = () => {
    if (token.value && isGoogleLoaded()) {
      (window as WindowWithGoogle).google?.accounts?.oauth2?.revoke(token.value, () => {
        clearStoredToken();
      });
    } else {
      clearStoredToken();
    }
  };

  // --- Drive API helpers (plain fetch with bearer token) ---

  const ensureToken = async (): Promise<string> => {
    if (!token.value) {
      await signIn();
    } else {
      // Proactively re-auth if the in-memory token is expired
      const expiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY) || 0);
      if (expiresAt && expiresAt - EXPIRY_GRACE_MS <= Date.now()) {
        clearStoredToken();
        await signIn();
      }
    }
    return token.value;
  };

  const fetchDrive = async (url: string, options: RequestInit = {}, retry = true): Promise<any> => {
    const accessToken = await ensureToken();

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (res.status === 401 && retry) {
      // Token expired — clear and re-auth once
      clearStoredToken();
      await signIn();
      return fetchDrive(url, options, false);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Drive API error (${res.status}): ${body}`);
    }

    if (res.status === 204) return null;
    return res.json();
  };

  const getOrCreateFolder = async (): Promise<string> => {
    // Try stored folder ID first
    const storedId = localStorage.getItem(FOLDER_ID_KEY);
    if (storedId) {
      try {
        await fetchDrive(`https://www.googleapis.com/drive/v3/files/${storedId}?fields=id,name,trashed`, {
          method: 'GET',
        });
        return storedId;
      } catch {
        // Folder might have been deleted — fall through to create
      }
    }

    // Search for existing folder by name
    const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`);
    const search = await fetchDrive(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
      { method: 'GET' }
    );

    if (search?.files?.length > 0) {
      const id = search.files[0].id as string;
      localStorage.setItem(FOLDER_ID_KEY, id);
      return id;
    }

    // Create the folder
    const created = await fetchDrive('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: FOLDER_MIME,
      }),
    });

    const folderId = created?.id as string;
    localStorage.setItem(FOLDER_ID_KEY, folderId);
    return folderId;
  };

  const uploadJsonFile = async (fileName: string, content: string, retry = true): Promise<void> => {
    // Resolve folder first — getOrCreateFolder may re-auth and replace the token,
    // so capture the access token AFTER it completes.
    const folderId = await getOrCreateFolder();
    const accessToken = await ensureToken();

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    // Reuse an existing file with the same name instead of creating a duplicate.
    const existingQuery = encodeURIComponent(
      `name='${fileName}' and '${folderId}' in parents and trashed=false`
    );
    let existingData: any = null;
    try {
      existingData = await fetchDrive(
        `https://www.googleapis.com/drive/v3/files?q=${existingQuery}&fields=files(id)`,
        { method: 'GET' }
      );
    } catch {
      // Lookup failed — fall through and let the create attempt surface any real errors
      existingData = null;
    }
    const existingId = existingData?.files?.[0]?.id as string | undefined;

    isBusy.value = true;
    isSaving.value = true;
    try {
      let res: Response;

      if (existingId) {
        // Update the existing file in place (PATCH with new content).
        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify({ mimeType: 'application/json' })], { type: 'application/json' })
        );
        form.append('file', new Blob([content], { type: 'application/json' }));

        res = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
          }
        );
      } else {
        // Create a new file.
        const form = new FormData();
        form.append(
          'metadata',
          new Blob([JSON.stringify({ name: fileName, parents: [folderId], mimeType: 'application/json' })], { type: 'application/json' })
        );
        form.append('file', new Blob([content], { type: 'application/json' }));

        res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });
      }

      if (res.status === 401 && retry) {
        // Token expired — clear and re-auth once
        clearStoredToken();
        await signIn();
        return uploadJsonFile(fileName, content, false);
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Upload failed (${res.status}): ${body}`);
      }
    } finally {
      isBusy.value = false;
      isSaving.value = false;
    }
  };

  const listDriveFiles = async (retry = true): Promise<{ id: string; name: string }[]> => {
    // Resolve folder first — getOrCreateFolder may re-auth and replace the token,
    // so capture the access token AFTER it completes.
    const folderId = await getOrCreateFolder();
    const accessToken = await ensureToken();

    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&orderBy=name`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (res.status === 401 && retry) {
      // Token expired — clear and re-auth once
      clearStoredToken();
      await signIn();
      return listDriveFiles(false);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`List failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return data?.files || [];
  };

  const downloadDriveFile = async (fileId: string, retry = true): Promise<string> => {
    const accessToken = await ensureToken();

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (res.status === 401 && retry) {
      // Token expired — clear and re-auth once
      clearStoredToken();
      await signIn();
      return downloadDriveFile(fileId, false);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Download failed (${res.status}): ${body}`);
    }

    return res.text();
  };

  const downloadAllDriveFiles = async (): Promise<{ id: string; name: string; content: string }[]> => {
    const files = await listDriveFiles();
    const results = await Promise.all(
      files.map(async (file) => {
        const content = await downloadDriveFile(file.id);
        return { id: file.id, name: file.name, content };
      })
    );
    return results;
  };

  // --- High-level operations ---

  const saveQuizToDrive = async (quiz: Quiz): Promise<void> => {
    const fileName = `${quiz.title.replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').toLowerCase() || 'quiz'}.json`;
    await uploadJsonFile(fileName, JSON.stringify(quiz, null, 2));
  };

  const saveAllToDrive = async (quizzes: Quiz[]): Promise<void> => {
    await uploadJsonFile(COMBINED_FILE_NAME, JSON.stringify(quizzes, null, 2));
  };

  // Load the single combined file (all quizzes) from Drive.
  const loadAllQuizzesFromDrive = async (): Promise<Quiz[]> => {
    isLoading.value = true;
    try {
      const folderId = await getOrCreateFolder();

      const query = encodeURIComponent(
        `name='${COMBINED_FILE_NAME}' and '${folderId}' in parents and trashed=false`
      );
      const data = await fetchDrive(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
        { method: 'GET' }
      );
      const file = data?.files?.[0];
      if (!file) return [];

      const content = await downloadDriveFile(file.id as string);
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? (parsed as Quiz[]) : [];
      } catch {
        return [];
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isSignedIn,
    isBusy,
    isSaving,
    isLoading,
    signIn,
    signOut,
    saveQuizToDrive,
    saveAllToDrive,
    loadAllQuizzesFromDrive,
    listDriveFiles,
    downloadDriveFile,
    downloadAllDriveFiles,
  };
};