<template>
  <Card :class="['border-2 shadow-lg transition-all duration-300', isCollapsed ? 'h-auto' : 'h-full']">
    <CardHeader class="pb-2 flex flex-row items-center justify-between">
      <CardTitle class="text-xl flex items-center">
        <Clock class="h-5 w-5 mr-2 text-primary" />
        History
      </CardTitle>
      <div class="flex items-center space-x-1">
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="isCollapsed = !isCollapsed">
          <Transition name="rotate" mode="out-in">
            <ExternalLink v-if="isCollapsed" :key="'expand'" class="h-4 w-4" />
            <X v-else :key="'collapse'" class="h-4 w-4" />
          </Transition>
          <span class="sr-only">{{ isCollapsed ? 'Expand' : 'Collapse' }}</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0" :disabled="history.length === 0">
              <Trash2 class="h-4 w-4 text-muted-foreground hover:text-destructive" />
              <span class="sr-only">Clear history</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your shortened URLs from this device. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction @click="handleClearAll"
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardHeader>

    <Transition name="slide-fade-content">
      <div v-if="!isCollapsed">
        <CardContent class="pt-2">
          <div v-if="isLoading" class="flex justify-center items-center py-8">
            <RefreshCw class="h-6 w-6 text-primary/50 animate-spin" />
          </div>
          <div v-else-if="history.length > 0">
            <ScrollArea class="h-[400px] pr-4">
              <div class="space-y-3" v-auto-animate>
                <template v-for="(item, index) in history" :key="item.id">
                  <div class="p-3 rounded-md border dark:bg-teal-900/30 bg-teal-200/30 hover:bg-accent/50 transition-colors border-teal-600/30">
                    <div class="flex justify-between items-start mb-1">
                      <div class="font-medium text-primary truncate max-w-[70%]">
                        <!-- Assuming a prefix like your example, adjust if needed -->
                        {{ shortUrlPrefix }}{{ item.shortUrl }}
                      </div>
                      <div class="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" class="h-6 w-6 p-0"
                          @click="() => item.id && copyToClipboard(item.shortUrl, item.id)">
                          <Check v-if="copiedId === item.id" class="h-3 w-3 text-green-500" />
                          <Copy v-else class="h-3 w-3" />
                          <span class="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>
                    <div class="text-xs text-muted-foreground truncate mb-2">{{ normalizeUrl(item.originalUrl) }}</div>
                    <div class="flex justify-between items-center">
                      <div class="text-xs text-muted-foreground">{{ formatDate(item.createdAt) }}</div>
                      <Badge v-if="item.isProtected" variant="outline" class="text-xs px-2 py-0 h-5 border border-teal-600/30 bg-purple-600/20">
                        PIN: {{ item.pin }}
                      </Badge>
                    </div>
                  </div>
                  <Separator v-if="index < history.length -1" class="mt-3" />
                </template>
              </div>
            </ScrollArea>
          </div>
          <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <ArchiveX class="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p class="text-muted-foreground">No shortened URLs yet</p>
            <p class="text-xs text-muted-foreground mt-1">
              Your history will appear here after you shorten a URL
            </p>
          </div>
        </CardContent>
      </div>
    </Transition>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Copy, Trash2, Clock, ExternalLink, X, ArchiveX, RefreshCw, Check } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'vue-sonner';
import { vAutoAnimate } from '@formkit/auto-animate/vue';

import type { ShortenedUrl } from '~/lib/indexed-db';
import { getAllShortenedUrls, deleteShortenedUrlEntry, clearAllShortenedUrls as dbClearAll } from '~/lib/indexed-db';
import { useMobile } from '~/composables/useMobile';

const shortUrlPrefix = ref('s.devh.in/'); // Placeholder, adjust as per your actual short URL structure

const history = ref<ShortenedUrl[]>([]);
const isLoading = ref(true);
const copiedId = ref<number | null>(null);
const isCollapsed = ref(false);
const isMobile = useMobile();

const loadHistory = async () => {
  try {
    isLoading.value = true;
    const urls = await getAllShortenedUrls();
    history.value = urls;
  } catch (error) {
    console.error("Failed to load history:", error);
    toast.error("Error loading history", {
      description: "Could not load your URL history.",
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadHistory();
  if (isMobile.value) {
    isCollapsed.value = true;
  }
});

watch(isMobile, (newVal) => {
  isCollapsed.value = newVal;
});


const normalizeUrl = (url: string): string => {
  if (!url) return url;
  return url.match(/^https?:\/\//) ? url : `https://${url}`;
};

const copyToClipboard = (shortUrl: string, id: number) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    const fullUrl = `${shortUrlPrefix.value}${shortUrl}`;
    const normalizedUrl = normalizeUrl(fullUrl);
    navigator.clipboard.writeText(normalizedUrl);
    setCopiedId(id);
    toast.success("Copied to clipboard!", {
      description: "Your shortened URL is ready to share.",
    });

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  } else {
    toast.error("Clipboard API not available.");
  }
};

const setCopiedId = (id: number | null) => {
  copiedId.value = id;
}

const handleDelete = async (id: number) => {
  try {
    await deleteShortenedUrlEntry(id);
    // history.value = history.value.filter((item) => item.id !== id); // auto-animate handles this
    await loadHistory(); // Re-fetch to ensure UI updates correctly with auto-animate
    toast.info("URL deleted", {
      description: "The URL has been removed from your history.",
    });
  } catch (error) {
    console.error("Failed to delete URL:", error);
    toast.error("Error deleting URL", {
      description: "Could not delete the URL from your history.",
    });
  }
};

const handleClearAll = async () => {
  try {
    await dbClearAll();
    // history.value = []; // auto-animate handles this
    await loadHistory(); // Re-fetch to ensure UI updates correctly with auto-animate
    toast.info("History cleared", {
      description: "All URLs have been removed from your history.",
    });
  } catch (error) {
    console.error("Failed to clear history:", error);
    toast.error("Error clearing history", {
      description: "Could not clear your URL history.",
    });
  }
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Event bus or alternative for cross-component communication to refresh history
// For Nuxt 3, you can use useState for simple global state or Pinia for more complex state.
// This is a placeholder for now if direct prop drilling or events are not sufficient.
const eventBus = useEventBus();

onMounted(() => {
  eventBus.on('urlShortened', loadHistory);
});

onUnmounted(() => {
  eventBus.off('urlShortened', loadHistory);
});


</script>

<style scoped>
.rotate-enter-active,
.rotate-leave-active {
  transition: transform 0.3s ease;
}
.rotate-enter-from,
.rotate-leave-to {
  transform: rotate(-180deg);
}

.slide-fade-content-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-content-leave-active {
  transition: all 0.3s cubic-bezier(1,0.5,0.8,1);
}
.slide-fade-content-enter-from,
.slide-fade-content-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0; /* For a smoother collapse/expand */
}
.slide-fade-content-enter-to,
.slide-fade-content-leave-from {
  max-height: 1000px; /* Adjust if content can be very tall */
}
</style>