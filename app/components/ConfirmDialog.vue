<!-- app/components/ConfirmDialog.vue -->
<script setup lang="ts">
const props = defineProps<{
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}>();

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div class="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :class="danger ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-accent/10 text-accent'">
          <AppIcon v-if="danger" name="lucide:trash-2" class="h-5 w-5" />
          <AppIcon v-else name="lucide:info" class="h-5 w-5" />
        </span>
        <h2 class="font-display text-lg text-foreground">{{ title }}</h2>
      </div>

      <p class="text-sm leading-relaxed text-muted-foreground">{{ message }}</p>

      <div class="flex justify-end gap-3 pt-2">
        <button @click="$emit('cancel')" class="btn-outline">
          {{ cancelLabel || 'Cancel' }}
        </button>
        <button @click="$emit('confirm')"
          :class="danger ? 'btn-danger' : 'btn-primary'">
          {{ confirmLabel || 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>