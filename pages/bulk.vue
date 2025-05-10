<template>
  <div class="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-6xl">
      <Transition name="fade-y" appear>
        <div class="text-center mb-8 sm:mb-12">
          <div class="inline-block blur-load">
            <div class="flex items-center justify-center mb-2">
              <Files class="h-8 w-8 sm:h-10 sm:w-10 text-primary mr-2 animate-pulse-slow" />
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Bulk <span class="text-primary">Shortener</span>
              </h1>
            </div>
            <p class="text-muted-foreground text-sm sm:text-base">Enter up to 50 URLs, one per line</p>
            <div class="flex items-center justify-center space-x-4 mt-4">
              <NuxtLink to="/" class="text-sm text-primary hover:underline flex items-center">
                <ArrowLeft class="h-4 w-4 mr-1" />
                Back to Shortener
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade-y-delayed" appear>
        <Card class="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Bulk URL Shortening</CardTitle>
            <CardDescription>Enter multiple URLs to shorten them all at once</CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="processBulkShorten" class="space-y-6" v-auto-animate>
              <div class="space-y-2">
                <Label for="bulkUrls">URLs (one per line)</Label>
                <Textarea
                  id="bulkUrls"
                  v-model="urlsInput"
                  rows="10"
                  :placeholder="'https://example.com/page1\nhttps://another-example.org/resource\n...'"
                  class="font-mono text-sm border dark:border-teal-900 border-teal-500"
                  :disabled="loading"
                />
                <p class="text-xs text-muted-foreground">{{ urlCount }} / 50 URLs entered</p>
              </div>

              <Button type="submit" class="w-full" :disabled="loading || urlCount === 0 || urlCount > 50">
                <span v-if="loading" class="flex items-center justify-center">
                  <RefreshCw class="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </span>
                <span v-else class="dark:text-white">Shorten All URLs</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </Transition>

      <Transition name="fade-y-delayed" appear>
        <div v-if="results.length > 0" class="mt-8 space-y-4">
          <Card class="border-2 shadow-lg">
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Successfully shortened URLs will appear here
                  </CardDescription>
                </div>
                <div class="flex items-center space-x-2">
                  <Button variant="outline" size="sm" @click="copyAllLinks" :disabled="!hasSuccessfulLinks">
                    <Copy class="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button variant="outline" size="sm" @click="downloadJson" :disabled="!results.length">
                    <Download class="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="(result, index) in results" :key="index"
                class="relative overflow-hidden rounded-md border bg-muted p-3 transition-transform hover:scale-[1.01]"
                :class="{ 'border-green-500/20': result.success, 'border-destructive/20': !result.success }">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2 overflow-hidden">
                    <div class="flex-shrink-0 rounded-full p-1"
                      :class="{ 'bg-green-500/10': result.success, 'bg-destructive/10': !result.success }">
                      <Link v-if="result.success" class="h-4 w-4 text-green-500" />
                      <AlertTriangle v-else class="h-4 w-4 text-destructive" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm">
                        <a v-if="result.success" :href="result.shortUrl" target="_blank"
                          class="font-medium text-primary hover:underline">
                          {{ result.shortUrl }}
                        </a>
                        <p v-else class="font-medium text-destructive">
                          Error: {{ result.error }}
                        </p>
                      </div>
                      <p class="text-xs text-muted-foreground truncate">
                        Original: {{ result.originalUrl }}
                      </p>
                    </div>
                  </div>
                  <Button v-if="result.success" variant="ghost" size="icon" class="h-8 w-8 p-0"
                    @click="copyToClipboard(result.shortUrl)">
                    <Check v-if="copiedUrls[index]" class="h-4 w-4 text-green-500" />
                    <Copy v-else class="h-4 w-4" />
                    <span class="sr-only">{{ copiedUrls[index] ? 'Copied' : 'Copy URL' }}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFetch } from '#app';
import { toast } from 'vue-sonner';
import { vAutoAnimate } from '@formkit/auto-animate/vue'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Files,
  ArrowLeft,
  Link,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Download
} from 'lucide-vue-next';

const urlsInput = ref('');
const results = ref<Array<{ originalUrl: string; shortUrl?: string; success: boolean; error?: string }>>([]);
const loading = ref(false);
const copiedUrls = ref<{ [key: number]: boolean }>({});

const hasSuccessfulLinks = computed(() => results.value.some(result => result.success));

const parsedUrls = computed(() => {
  return urlsInput.value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
});

const urlCount = computed(() => parsedUrls.value.length);

function copyToClipboard(url?: string) {
  if (!url) return;
  navigator.clipboard.writeText(url)
    .then(() => {
      const index = results.value.findIndex(r => r.shortUrl === url);
      if (index !== -1) {
        copiedUrls.value[index] = true;
        setTimeout(() => {
          copiedUrls.value[index] = false;
        }, 2000);
      }
      toast.success('URL copied to clipboard');
    })
    .catch(() => {
      toast.error('Failed to copy URL');
    });
}

function copyAllLinks() {
  const successfulUrls = results.value
    .filter(result => result.success && result.shortUrl)
    .map(result => result.shortUrl)
    .join('\n');

  if (!successfulUrls) {
    toast.error('No successful URLs to copy');
    return;
  }

  navigator.clipboard.writeText(successfulUrls)
    .then(() => {
      toast.success('All URLs copied to clipboard');
    })
    .catch(() => {
      toast.error('Failed to copy URLs');
    });
}

function downloadJson() {
  const data = {
    timestamp: new Date().toISOString(),
    total: results.value.length,
    successful: results.value.filter(r => r.success).length,
    failed: results.value.filter(r => !r.success).length,
    urls: results.value.map(result => ({
      originalUrl: result.originalUrl,
      shortUrl: result.shortUrl || null,
      success: result.success,
      error: result.error || null
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shortened-urls-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  
  toast.success('JSON file downloaded');
}

async function processBulkShorten() {
  if (urlCount.value === 0 || urlCount.value > 50) {
    toast.error('Invalid URL count', { 
      description: `Please enter between 1 and 50 URLs. You entered ${urlCount.value}.`
    });
    return;
  }

  loading.value = true;
  results.value = [];
  copiedUrls.value = {};
  let successCount = 0;
  let errorCount = 0;

  for (const originalUrl of parsedUrls.value) {
    try {
      const { data, error: fetchError } = await useFetch('/api/shorten', {
        method: 'POST',
        body: { originalUrl }
      });

      if (fetchError.value) {
        results.value.push({
          originalUrl,
          success: false,
          error: fetchError.value.data?.statusMessage || fetchError.value.message || 'Unknown error'
        });
        errorCount++;
      } else if (data.value) {
        // @ts-ignore
        results.value.push({ originalUrl, shortUrl: data.value.shortUrl, success: true });
        successCount++;
      }
    } catch (e: any) {
      results.value.push({
        originalUrl,
        success: false,
        error: e.message || 'Client-side error'
      });
      errorCount++;
    }
  }

  loading.value = false;
  if (successCount > 0) {
    toast.success(`Success`, { description: `${successCount} URL(s) shortened successfully.` });
  }
  if (errorCount > 0) {
    toast.error(`Errors`, { description: `${errorCount} URL(s) failed to shorten.` });
  }
}
</script>

<style scoped>
/* Transitions */
.fade-y-enter-active,
.fade-y-leave-active,
.fade-y-delayed-enter-active,
.fade-y-delayed-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-y-enter-from,
.fade-y-leave-to,
.fade-y-delayed-enter-from,
.fade-y-delayed-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-y-delayed-enter-active {
  transition-delay: 0.1s;
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