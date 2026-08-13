<!-- app/components/AppIcon.vue -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    strokeWidth?: number;
  }>(),
  {
    size: 20,
    strokeWidth: 2,
  }
);
</script>

<template>
  <Icon :name="name" :size="size" :attributes="{ 'stroke-width': strokeWidth }" />
</template>