<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div v-if="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Checking URL...</p>
    </div>
    
    <div v-else-if="error" class="text-center max-w-md">
      <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-2">{{ errorTitle }}</h2>
        <p>{{ error }}</p>
      </div>
      <button 
        @click="goHome" 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go Home
      </button>
    </div>

    <div v-else-if="isDangerous" class="text-center max-w-md">
      <div class="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 px-6 py-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-2">⚠️ Dangerous</h2>
        <p>This URL has been flagged as potentially dangerous and will not redirect.</p>
      </div>
      <button 
        @click="goHome" 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Go Home
      </button>
    </div>

    <div v-else class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Redirecting...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const errorTitle = ref('');
const isDangerous = ref(false);

// Get slug from route params
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;

const goHome = () => {
  router.push('/');
};

onMounted(async () => {
  if (!slug) {
    error.value = 'No URL slug provided';
    errorTitle.value = 'Invalid URL';
    loading.value = false;
    return;
  }

  try {
    // Call the external API endpoint as specified in requirements  
    const response = await $fetch(`https://devh.in/api/app/urlshortener/url/${slug}`);
    
    if (response.is_safe === true) {
      // Redirect to original URL if safe
      if (process.client) {
        window.location.href = response.original_url;
      }
    } else {
      // Show dangerous message if not safe
      isDangerous.value = true;
    }
    
  } catch (fetchError: any) {
    console.error('Error fetching URL data:', fetchError);
    
    if (fetchError.statusCode === 404 || fetchError.status === 404) {
      error.value = 'URL not found';
      errorTitle.value = 'URL Not Found';
    } else {
      error.value = 'An error occurred while processing the URL';
      errorTitle.value = 'Error';
    }
  } finally {
    loading.value = false;
  }
});

// Set page title
useHead({
  title: `Redirecting... | s.devh.in`
});
</script>