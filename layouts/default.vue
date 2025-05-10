<template>
  <div :class="['min-h-screen font-sans antialiased', { 'dark': isDark }]">
    <div class="min-h-screen bg-gradient-to-br dark:from-purple-950 dark:to-teal-950 from-purple-200 to-teal-300 transition-colors duration-300">
      <!-- Navbar -->
      <header
        class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class=" flex h-16 w-full items-center justify-between px-4 md:px-12 xl:px-28">
          <!-- Logo & Brand -->
          <div class="flex items-center space-x-2">
            <Link class="h-6 w-6 text-primary" />
            <span class="font-bold text-xl">StellarLink</span>
          </div>

          <!-- Right Side Actions -->
          <div class="flex items-center space-x-4">
            <!-- Dark Mode Toggle -->
            <Button variant="outline" size="icon" @click="toggleTheme" class="size-9">
              <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="h-4 w-4 transition-transform dark:rotate-0 dark:scale-100">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
              <span class="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow container mx-auto">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 py-6">
          <div class="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
            <div class="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer"
                class="font-medium underline underline-offset-4">your-username</a>.
              The source code is available on <a href="https://github.com/your-username/short-devh" target="_blank"
                rel="noopener noreferrer" class="font-medium underline underline-offset-4">GitHub</a>.
            </div>
            <div class="flex items-center space-x-1">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/your-username/short-devh" target="_blank" rel="noopener noreferrer">
                  <Github class="h-4 w-4" />
                  <span class="sr-only">GitHub</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <!-- Toast Notifications -->
      <Toaster richColors closeButton position="top-right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Toaster } from 'vue-sonner';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon, Github, Link } from 'lucide-vue-next';

const isMenuOpen = ref(false);
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  // Check for saved theme preference or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>
