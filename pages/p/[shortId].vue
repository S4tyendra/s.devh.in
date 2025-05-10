<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
    <div class="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      <h1 class="text-2xl font-bold text-center text-gray-800 dark:text-white">Enter PIN</h1>
      <p class="text-sm text-center text-gray-600 dark:text-gray-400">This URL is protected. Please enter the PIN to continue.</p>

      <form @submit.prevent="verifyPin" class="space-y-4">
        <div>
          <label for="pinInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN (4-6 digits)</label>
          <input
            id="pinInput"
            v-model="pin"
            type="password"
            required
            minlength="4"
            maxlength="6"
            pattern="\d{4,6}"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter PIN"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-150"
        >
          <span v-if="loading">Verifying...</span>
          <span v-else>Unlock</span>
        </button>
      </form>

      <div v-if="error" class="mt-3 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
        <p>{{ error }}</p>
      </div>
    </div>
     <Toaster />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFetch } from '#app';
import { Toaster, toast } from 'vue-sonner';

const route = useRoute();
const router = useRouter();
const shortId = Array.isArray(route.params.shortId) ? route.params.shortId[0] : route.params.shortId;
const pin = ref('');
const error = ref('');
const loading = ref(false);

// Prefetch information about the short link to confirm it exists and is PIN protected
const { data: linkInfo, error: fetchLinkError } = await useFetch(`/api/p/${shortId}/info`);

if (fetchLinkError.value || (linkInfo.value && !(linkInfo.value as any).protected)) {
  // If not found, error, or not actually PIN protected, redirect or show error
  if (process.client) {
    if (fetchLinkError.value) {
        toast.error(fetchLinkError.value.data?.statusMessage || 'Link not found or invalid.');
    } else {
        toast.info('This link is not PIN protected or is invalid.');
    }
    router.replace('/'); // Redirect to home
  }
}


async function verifyPin() {
  error.value = '';
  loading.value = true;

  if (pin.value.length < 4 || pin.value.length > 6 || !/^\d+$/.test(pin.value)) {
    error.value = 'PIN must be 4 to 6 digits.';
    loading.value = false;
    return;
  }

  try {
    const { data, error: verifyError } = await useFetch(`/api/p/${shortId}/verify`, {
      method: 'POST',
      body: { pin: pin.value },
    });

    if (verifyError.value) {
      error.value = verifyError.value.data?.message || 'Invalid PIN or error verifying.';
      toast.error(error.value);
    } else if (data.value) {
      // @ts-ignore
      const originalUrl = data.value.originalUrl;
      if (originalUrl) {
        toast.success('PIN verified! Redirecting...');
        // Perform client-side redirect
        if (process.client) {
          window.location.href = originalUrl;
        }
      } else {
        error.value = 'Could not retrieve original URL.';
        toast.error(error.value);
      }
    }
  } catch (e: any) {
    error.value = e.message || 'An unexpected error occurred.';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>