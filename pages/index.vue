<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
    <div class="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      <h1 class="text-3xl font-bold text-center text-gray-800 dark:text-white">Shorten Your URL</h1>

      <form @submit.prevent="shortenUrl" class="space-y-6">
        <div>
          <label for="originalUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter URL</label>
          <input
            id="originalUrl"
            v-model="originalUrl"
            type="url"
            required
            class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="https://example.com"
          />
        </div>

        <div class="flex items-center">
          <input
            id="protectWithPin"
            v-model="protectWithPin"
            type="checkbox"
            class="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
          />
          <label for="protectWithPin" class="ml-2 block text-sm text-gray-900 dark:text-gray-200">Protect with PIN</label>
        </div>

        <div v-if="protectWithPin">
          <label for="pin" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter PIN (4-6 digits)</label>
          <input
            id="pin"
            v-model="pin"
            type="password"
            minlength="4"
            maxlength="6"
            pattern="\d{4,6}"
            class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="1234"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-150"
        >
          <span v-if="loading">Shortening...</span>
          <span v-else>Short</span>
        </button>
      </form>

      <div v-if="error" class="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
        <p>{{ error }}</p>
      </div>

      <div v-if="shortenedUrl" class="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-300 dark:border-green-600 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">URL Shortened!</h2>
        <div class="flex items-center justify-between mb-3">
          <a :href="shortenedUrl" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline truncate">{{ shortenedUrl }}</a>
          <button @click="copyToClipboard" class="ml-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <!-- lucide:copy -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
          </button>
        </div>
        <div class="flex justify-center">
          <!-- Placeholder for QR Code -->
          <div ref="qrCodeEl" class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">QR Code</div>
        </div>
      </div>
       <!-- Toast notifications will appear here -->
       <Toaster />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useFetch } from '#app';
import QRCodeStyling from 'qr-code-styling'; // We'll need to install this
import { Toaster, toast } from 'vue-sonner';

const originalUrl = ref('');
const protectWithPin = ref(false);
const pin = ref('');
const shortenedUrl = ref('');
const error = ref('');
const loading = ref(false);
const qrCodeEl = ref<HTMLElement | null>(null);

const qrCodeInstance = ref<QRCodeStyling | null>(null);

async function shortenUrl() {
  error.value = '';
  shortenedUrl.value = '';
  loading.value = true;

  if (protectWithPin.value && (pin.value.length < 4 || pin.value.length > 6 || !/^\d+$/.test(pin.value))) {
    error.value = 'PIN must be 4 to 6 digits.';
    loading.value = false;
    return;
  }

  try {
    const { data, error: fetchError } = await useFetch('/api/shorten', {
      method: 'POST',
      body: {
        originalUrl: originalUrl.value,
        pin: protectWithPin.value ? pin.value : undefined,
      },
    });

    if (fetchError.value) {
      error.value = fetchError.value.data?.error || fetchError.value.message || 'Failed to shorten URL.';
    } else if (data.value) {
      // @ts-ignore
      shortenedUrl.value = data.value.shortUrl;
      if (qrCodeEl.value) {
        if (!qrCodeInstance.value) {
            qrCodeInstance.value = new QRCodeStyling({
                width: 128,
                height: 128,
                // @ts-ignore
                data: data.value.shortUrl,
                image: '/favicon.ico', // Optional: Add a logo to the QR code
                dotsOptions: {
                    color: '#4267b2', // Example color
                    type: 'rounded'
                },
                backgroundOptions: {
                    color: '#e9ebee', // Example background
                },
                cornersSquareOptions: {
                    type: 'extra-rounded',
                    color: '#4267b2',
                },
                cornersDotOptions: {
                    type: 'dot',
                    color: '#4267b2',
                }
            });
            qrCodeInstance.value.append(qrCodeEl.value);
        } else {
            // @ts-ignore
            qrCodeInstance.value.update({ data: data.value.shortUrl });
        }
      }
      toast.success('URL shortened successfully!');
    }
  } catch (e: any) {
    error.value = e.message || 'An unexpected error occurred.';
  } finally {
    loading.value = false;
  }
}

async function copyToClipboard() {
  if (shortenedUrl.value) {
    try {
      await navigator.clipboard.writeText(shortenedUrl.value);
      toast.info('Short URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL.');
      console.error('Failed to copy: ', err);
    }
  }
}
</script>

<style scoped>
/* Add any page-specific styles here */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* Example focus style */
}
</style>