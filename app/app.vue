<template>
  <div class="flex min-h-screen flex-col bg-background font-sans text-foreground">
    <AppHeader />
    <NuxtRouteAnnouncer />
    <div class="flex-1">
      <NuxtPage />
    </div>
    <AppFooter />
  </div>
</template>
