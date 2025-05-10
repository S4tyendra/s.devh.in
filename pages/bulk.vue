<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Bulk URL Shortener</h1>
    <p class="mb-4 text-gray-600 dark:text-gray-300">
      Enter up to 50 URLs, one per line. Each will be shortened individually.
    </p>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <form @submit.prevent="processBulkShorten" class="space-y-6">
        <div>
          <label for="bulkUrls" class="block text-sm font-medium text-gray-700 dark:text-gray-300">URLs (one per line):</label>
          <textarea
            id="bulkUrls"
            v-model="urlsInput"
            rows="10"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="https://example.com/page1&#10;https://another-example.org/resource&#10;..."
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ urlCount }} / 50 URLs entered.</p>
        </div>

        <button
          type="submit"
          :disabled="loading || urlCount === 0 || urlCount > 50"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-150"
        >
          <span v-if="loading">Processing...</span>
          <span v-else>Shorten All</span>
        </button>
      </form>
    </div>

    <div v-if="results.length > 0" class="mt-8">
      <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Results:</h2>
      <div class="space-y-3">
        <div
          v-for="(result, index) in results"
          :key="index"
          class="p-4 rounded-md shadow"
          :class="{
            'bg-green-50 dark:bg-green-900 border border-green-300 dark:border-green-600': result.success,
            'bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-600': !result.success
          }"
        >
          <p class="font-medium text-sm truncate text-gray-700 dark:text-gray-200">Original: {{ result.originalUrl }}</p>
          <div v-if="result.success" class="mt-1">
            <a :href="result.shortUrl" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              {{ result.shortUrl }}
            </a>
          </div>
          <p v-else class="text-red-700 dark:text-red-200 text-sm mt-1">Error: {{ result.error }}</p>
        </div>
      </div>
    </div>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFetch } from '#app';
import { Toaster, toast } from 'vue-sonner';

const urlsInput = ref('');
const results = ref<Array<{ originalUrl: string; shortUrl?: string; success: boolean; error?: string }>>([]);
const loading = ref(false);

const parsedUrls = computed(() => {
  return urlsInput.value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
});

const urlCount = computed(() => parsedUrls.value.length);

async function processBulkShorten() {
  if (urlCount.value === 0 || urlCount.value > 50) {
    toast.error(`Please enter between 1 and 50 URLs. You entered ${urlCount.value}.`);
    return;
  }

  loading.value = true;
  results.value = [];
  let successCount = 0;
  let errorCount = 0;

  // Process URLs sequentially to avoid overwhelming the server or hitting rate limits quickly.
  // For a more robust solution, consider batching or a queue system on the backend.
  for (const originalUrl of parsedUrls.value) {
    try {
      // Re-use the existing /api/shorten endpoint
      const { data, error: fetchError } = await useFetch('/api/shorten', {
        method: 'POST',
        body: { originalUrl }, // No PIN protection for bulk for simplicity now
      });

      if (fetchError.value) {
        results.value.push({ originalUrl, success: false, error: fetchError.value.data?.statusMessage || fetchError.value.message || 'Unknown error' });
        errorCount++;
      } else if (data.value) {
        // @ts-ignore
        results.value.push({ originalUrl, shortUrl: data.value.shortUrl, success: true });
        successCount++;
      }
    } catch (e: any) {
      results.value.push({ originalUrl, success: false, error: e.message || 'Client-side error' });
      errorCount++;
    }
  }

  loading.value = false;
  if (successCount > 0) {
    toast.success(`${successCount} URL(s) shortened successfully.`);
  }
  if (errorCount > 0) {
    toast.error(`${errorCount} URL(s) failed to shorten.`);
  }
  if (successCount === 0 && errorCount === 0) {
    toast.info("No URLs were processed.");
  }
}
</script>

<style scoped>
/* Add any page-specific styles if needed */
</style>