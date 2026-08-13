<!-- app/components/AppFooter.vue -->
<template>
    <footer class="relative overflow-hidden bg-inverted-bg text-inverted-fg">
        <!-- Dot pattern texture -->
        <div class="dot-pattern absolute inset-0" />

        <div class="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div class="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-center">
                <p class="text-sm text-inverted-fg/60">
                    © {{ currentYear }} JustQuiz — Made for students, by a student.
                </p>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>