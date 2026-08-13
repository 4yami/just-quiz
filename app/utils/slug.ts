import type { Quiz } from '~/types/quiz';

export const getQuizUrl = (quiz: Quiz): string => {
  const slug = (quiz.title || 'quiz')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'quiz';

  // Safeguard against undefined if quiz.id is empty or split yields empty array
  const shortId = quiz.id ? (quiz.id.split('-')[0] ?? '') : '';
  return `/quiz/${slug}-${shortId}`;
};

export const extractShortId = (slugParam: string): string => {
  const parts = slugParam.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Use nullish coalescing to guarantee a string return
  return lastPart ?? slugParam;
};