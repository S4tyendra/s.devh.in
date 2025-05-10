<template>
  <div class="min-h-screen bg-gradient-to-br from-background to-muted font-sans antialiased">
    <!-- Navbar placeholder -->
    <!-- <Navbar /> -->
    <main class="flex-grow"> <!-- Allow content to take space -->
      <slot />
    </main>
    <Toaster richColors closeButton position="top-right" />
    <!-- Footer placeholder -->
    <!-- <Footer /> -->
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner';
// import Navbar from '@/components/layout/Navbar.vue'; // Example
// import Footer from '@/components/layout/Footer.vue'; // Example
</script>

<style>
/* Global styles if necessary, or use assets/css/main.css */
body {
  /* background-color: hsl(var(--background));
  color: hsl(var(--foreground)); */
}
</style>
