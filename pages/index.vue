<template>
  <div class="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-6xl">
      <Transition name="fade-y" appear>
        <div class="text-center mb-8 sm:mb-12">
          <div class="inline-block blur-load">
            <div class="flex items-center justify-center mb-2">
              <Sparkles class="h-8 w-8 sm:h-10 sm:w-10 text-primary mr-2 animate-pulse-slow" />
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
                DevH <span class="text-primary">MiNi</span>
              </h1>
            </div>
            <p class="text-muted-foreground text-sm sm:text-base">Shorten URLs with style and security</p>
            <div class="flex items-center justify-center space-x-4 mt-4">
              <NuxtLink to="/bulk" class="text-sm text-primary hover:underline flex items-center">
                <Files class="h-4 w-4 mr-1" />
                Bulk Shortening
              </NuxtLink>
              <NuxtLink to="/report" class="text-sm text-destructive hover:underline flex items-center">
                <Flag class="h-4 w-4 mr-1" />
                Report URL
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div class="md:col-span-2">
          <Transition name="fade-y-delayed" appear>
            <Tabs :model-value="activeTab" @update:model-value="setActiveTab" class="w-full">
              <TabsList class="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="shorten" :disabled="loading"> Shorten URL </TabsTrigger>
                <TabsTrigger value="success" :disabled="!isSuccess"> Your Link </TabsTrigger>
              </TabsList>

              <TabsContent value="shorten" class="space-y-4">
                <Card class="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle>Create Shortened URL</CardTitle>
                    <CardDescription> Enter a long URL to create a short, memorable link </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form @submit.prevent="submitUrl" class="space-y-6" v-auto-animate>
                      <div class="space-y-2">
                        <Label for="url">URL to shorten</Label>
                        <div class="relative">
                          <Input ref="inputUrlRef" id="url" type="text"
                            placeholder="https://example.com/very/long/url/that/needs/shortening" v-model="originalUrl"
                            class="pr-10 border dark:border-teal-900 border-teal-500" :disabled="loading" required />
                          <Link
                            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        </div>
                      </div>

                      <!-- PIN protection has been removed as per requirements -->

                      <Button type="submit" class="w-full" :disabled="loading">
                        <span v-if="loading" class="flex items-center justify-center">
                          <RefreshCw class="h-4 w-4 mr-2 animate-spin" />
                          Shortening...
                        </span>
                        <span v-else class="dark:text-white">Shorten URL</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="success" class="space-y-4">
                <Transition name="fade-y" mode="out-in">
                  <div v-if="isSuccess">
                    <Card class="border-2 border-primary/20 shadow-lg overflow-hidden">
                      <div class="absolute top-0 right-0 left-0 h-1.5 bg-primary/20 overflow-hidden">
                        <div class="h-full bg-primary animate-progress-bar"></div>
                      </div>
                      <CardHeader class="pb-2">
                        <div class="flex justify-between items-center">
                          <CardTitle class="text-xl">Your Shortened URL</CardTitle>
                          <Button variant="ghost" size="icon" class="h-8 w-8 p-0" @click="resetForm">
                            <RefreshCw class="h-4 w-4" />
                            <span class="sr-only">Create new link</span>
                          </Button>
                        </div>
                        <CardDescription>
                          Your link is ready to share
                          <!-- PIN protection removed -->
                        </CardDescription>
                      </CardHeader>
                      <CardContent class="space-y-4">
                        <div class="relative">
                          <div
                            class="relative overflow-hidden rounded-md border bg-muted p-3 transition-transform hover:scale-[1.01]">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center space-x-2">
                                <div class="flex-shrink-0 rounded-full bg-primary/10 p-1">
                                  <Link class="h-4 w-4 text-primary" />
                                </div>
                                <a :href="shortenedUrl" target="_blank" class="font-medium text-primary hover:underline"
                                  @click.prevent="openShortUrl">
                                  {{ displayShortUrl }}
                                </a>
                              </div>
                              <Button variant="ghost" size="icon"
                                class="h-8 w-8 p-0 transition-transform hover:scale-110" @click="handleCopyToClipboard">
                                <Check v-if="copied" class="h-4 w-4 text-green-500" />
                                <Copy v-else class="h-4 w-4" />
                                <span class="sr-only">{{ copied ? 'Copied' : 'Copy URL' }}</span>
                              </Button>
                            </div>
                            <div class="mt-2 text-xs text-muted-foreground truncate">Original: {{ lastOriginalUrl }}
                            </div>
                          </div>
                        </div>
                        <div class="flex justify-between space-x-2">
                          <Button variant="outline" size="sm" class="flex-1" @click="qrVisible = !qrVisible">
                            <QrCode class="h-4 w-4 mr-2" />
                            {{ qrVisible ? 'Hide QR Code' : 'Show QR Code' }}
                          </Button>
                          <Button variant="outline" size="sm" class="flex-1" @click="openShortUrl">
                            <ExternalLink class="h-4 w-4 mr-2" />
                            Open Link
                          </Button>
                        </div>
                        <Transition name="slide-fade">
                          <div v-if="qrVisible" class="flex justify-center p-4 bg-card rounded-md border mt-2">
                            <div class="relative w-40 h-40 sm:w-48 sm:h-48">
                              <div class="absolute inset-0 flex items-center justify-center">
                                <div ref="qrCodeEl"
                                  class="w-36 h-36 sm:w-44 sm:h-44 bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
                                  QR Loading...
                                </div>
                              </div>
                              <!-- Optional: Logo inside QR -->
                              <!-- <div class="absolute inset-0 flex items-center justify-center">
                                <div class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
                                  <div class="text-primary font-bold text-xs">SL</div>
                                </div>
                              </div> -->
                            </div>
                          </div>
                        </Transition>
                      </CardContent>
                      <CardFooter class="flex flex-col space-y-2">
                        <div class="text-xs text-muted-foreground w-full text-center">
                          This link is locally generated for now.
                        </div>
                        <!-- PIN protection display removed -->
                      </CardFooter>
                    </Card>
                  </div>
                </Transition>
              </TabsContent>
            </Tabs>
          </Transition>

          <Transition name="fade-y" appear>
            <div v-if="isMobile" class="mt-6 sm:mt-8">
              <HistorySection />
            </div>
          </Transition>
        </div>

        <Transition name="fade-x" appear>
          <div v-if="!isMobile" class="md:col-span-1">
            <HistorySection />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import { useFetch, useNuxtApp } from '#app';
import QRCodeStyling from 'qr-code-styling';
import { toast } from 'vue-sonner';
import { vAutoAnimate } from '@formkit/auto-animate/vue'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Replaced by toast for general errors

import { Sparkles, Link, QrCode, ExternalLink, RefreshCw, Copy, Check, Files, Flag } from 'lucide-vue-next';
import HistorySection from '@/components/HistorySection.vue';
import { useMobile } from '~/composables/useMobile';
import { useEventBus } from '~/composables/useEventBus';
import { addShortenedUrlEntry, type ShortenedUrl } from '~/lib/indexed-db';

const shortUrlDomain = 's.devh.in/'; // Configurable domain for display

const originalUrl = ref('');
const loading = ref(false);
const error = ref(''); // For form-specific errors not covered by toast.

const isSuccess = ref(false);
const shortenedUrl = ref(''); // This will store the full URL from API if API provides domain
const displayShortUrl = ref(''); // This will store just the slug or slug + stel.lk/
const copied = ref(false);
const qrVisible = ref(false);
const activeTab = ref('shorten');

const inputUrlRef = ref<InstanceType<typeof Input> | null>(null);
const qrCodeEl = ref<HTMLElement | null>(null);
const qrCodeInstance = ref<QRCodeStyling | null>(null);

const isMobile = useMobile();
const eventBus = useEventBus();

// To show details of the *last* submission on the success card
const lastOriginalUrl = ref('');


onMounted(() => {
  nextTick(() => {
    // @ts-ignore
    if (inputUrlRef.value?.$el) inputUrlRef.value?.$el.focus();
    // else if (inputUrlRef.value) (inputUrlRef.value as unknown as HTMLInputElement).focus(); // Fallback for different component structures
  });
});

watch(copied, (isCopied) => {
  if (isCopied) {
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
});

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};

const normalizeUrl = (url: string): string => {
  if (!url) return url;
  return url.match(/^https?:\/\//) ? url : `https://${url}`;
};

const submitUrl = async () => {
  error.value = '';

  if (!originalUrl.value) {
    toast.error('Please enter a URL', { description: 'You need to provide a URL to shorten.' });
    // @ts-ignore
    if (inputUrlRef.value?.$el) inputUrlRef.value?.$el.focus();
    return;
  }

  const normalizedUrl = normalizeUrl(originalUrl.value);
  
  // PIN protection has been removed as per requirements

  loading.value = true;
  isSuccess.value = false; // Reset success state

  try {
    const { data: apiResponse, error: fetchError } = await useFetch('/api/shorten', {
      method: 'POST',
      body: {
        originalUrl: normalizedUrl,
        // PIN field removed
      },
    });

    if (fetchError.value || !apiResponse.value) {
      const errorMessage = fetchError.value?.data?.error || fetchError.value?.message || 'Failed to shorten URL.';
      toast.error('Shortening Failed', { description: errorMessage });
      error.value = errorMessage; // Can be used for inline error display if needed
      loading.value = false;
      return;
    }

    // @ts-ignore
    const newShortUrlSlug = apiResponse.value.shortId || apiResponse.value.shortUrl.split('/').pop(); // Adapt based on actual API response
    // @ts-ignore
    const fullShortenedUrl = apiResponse.value.shortUrl || `${window.location.origin}/${newShortUrlSlug}`;


    shortenedUrl.value = fullShortenedUrl;
    displayShortUrl.value = `${shortUrlDomain}${newShortUrlSlug}`; // For display

    lastOriginalUrl.value = originalUrl.value;
    // PIN-related state removed

    // Save to IndexedDB
    await addShortenedUrlEntry({
      originalUrl: originalUrl.value,
      shortUrl: newShortUrlSlug, // Save only slug to IndexedDB? Or full short URL? Example saves slug.
      isProtected: false, // No longer protected
      pin: undefined, // No PIN
      createdAt: Date.now(),
    });

    eventBus.emit('urlShortened'); // Notify history component

    isSuccess.value = true;
    activeTab.value = 'success';
    toast.success('URL shortened successfully!', { description: 'Your new link is ready.' });

    // Clear form for next use after a brief delay to allow tab switch
    setTimeout(() => {
      originalUrl.value = '';
      // PIN-related clearing removed
      if (qrCodeEl.value) generateQrCode(fullShortenedUrl);
    }, 100);


  } catch (e: any) {
    console.error("Error in submitUrl:", e);
    toast.error('An unexpected error occurred.', { description: e.message });
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const generateQrCode = (urlToEncode: string) => {
  if (!qrCodeEl.value || !urlToEncode) return;
  qrCodeEl.value.innerHTML = ''; // Clear previous

  // Determine colors from CSS variables
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  // const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
  // Use background for QR for better contrast on different themes.
  const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();


  qrCodeInstance.value = new QRCodeStyling({
    width: qrCodeEl.value.clientWidth > 150 ? 176 : 144, // responsive QR
    height: qrCodeEl.value.clientWidth > 150 ? 176 : 144,
    data: urlToEncode,
    image: '/favicon.ico', // Ensure this exists in public/
    dotsOptions: { color: `hsl(${primaryColor})`, type: 'rounded' },
    backgroundOptions: { color: `hsl(${bgColor})` }, // Use card or background
    cornersSquareOptions: { color: `hsl(${primaryColor})`, type: 'extra-rounded' },
    cornersDotOptions: { color: `hsl(${primaryColor})`, type: 'dot' },
    qrOptions: { errorCorrectionLevel: 'H' }
  });
  qrCodeInstance.value.append(qrCodeEl.value);
};


watch(qrVisible, (isVisible) => {
  if (isVisible && shortenedUrl.value && qrCodeEl.value) {
    nextTick(() => {
      generateQrCode(shortenedUrl.value);
    });
  }
});


const handleCopyToClipboard = () => {
  if (!shortenedUrl.value) return;
  navigator.clipboard.writeText(shortenedUrl.value) // Copy the full URL
    .then(() => {
      copied.value = true;
      toast.info('Short URL copied to clipboard!');
    })
    .catch(err => {
      toast.error('Failed to copy URL.');
      console.error('Failed to copy: ', err);
    });
};

const openShortUrl = () => {
  if (shortenedUrl.value) {
    window.open(shortenedUrl.value, '_blank');
  }
}

const resetForm = () => {
  originalUrl.value = '';
  // PIN-related state removed
  error.value = '';
  isSuccess.value = false;
  shortenedUrl.value = '';
  displayShortUrl.value = '';
  qrVisible.value = false;
  activeTab.value = 'shorten';
  copied.value = false;
  lastOriginalUrl.value = '';
  // PIN-related state removed

  nextTick(() => {
    // @ts-ignore
    if (inputUrlRef.value?.$el) inputUrlRef.value?.$el.focus();
  });
};

</script>

<style scoped>
/* General page transitions */
.fade-y-enter-active,
.fade-y-leave-active,
.fade-y-delayed-enter-active,
.fade-y-delayed-leave-active,
.fade-x-enter-active,
.fade-x-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-y-enter-from,
.fade-y-leave-to,
.fade-y-delayed-enter-from,
.fade-y-delayed-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-x-enter-from,
.fade-x-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-y-delayed-enter-active {
  transition-delay: 0.1s;
}

/* PIN-related animations removed */


/* Sparkles animation */
.animate-pulse-slow {
  animation: pulse-slow 2s infinite ease-in-out;
}

@keyframes pulse-slow {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Progress bar for success card */
.animate-progress-bar {
  animation: progress-bar-fill 1.5s ease-out forwards;
}

@keyframes progress-bar-fill {
  from {
    width: 0%;
  }

  to {
    width: 100%;
  }
}

/* Blur load animation */
.blur-load {
  animation: blur-load 0.6s ease-out forwards;
}

@keyframes blur-load {
  0% {
    filter: blur(8px);
    opacity: 0;
    transform: scale(0.96);
  }
  100% {
    filter: blur(0);
    opacity: 1;
    transform: scale(1);
  }
}
</style>