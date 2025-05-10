<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <header class="p-4 shadow-md bg-white dark:bg-gray-800">
      <nav class="container mx-auto flex justify-between items-center">
        <NuxtLink to="/" class="text-xl font-bold text-blue-600 dark:text-blue-400">Shorty</NuxtLink>
        <div class="space-x-4">
          <NuxtLink to="/" class="hover:text-blue-500">Home</NuxtLink>
          <NuxtLink to="/bulk" class="hover:text-blue-500">Bulk Shorten</NuxtLink>
          <NuxtLink to="/report" class="hover:text-blue-500">Report</NuxtLink>
        </div>
      </nav>
    </header>
    <main class="container mx-auto p-4">
      <slot />
    </main>
    <footer class="text-center p-4 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-8">
      &copy; {{ new Date().getFullYear() }} Shorty. All rights reserved.
    </footer>
  </div>
</template>

<style scoped>
/* .router-link-exact-active {
  @apply text-blue-600 dark:text-blue-400 font-semibold;
} */
</style>