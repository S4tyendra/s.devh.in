<template>
  <div class="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-6xl">
      <Transition name="fade-y" appear>
        <div class="text-center mb-8 sm:mb-12">
          <div class="inline-block blur-load">
            <div class="flex items-center justify-center mb-2">
              <Flag class="h-8 w-8 sm:h-10 sm:w-10 text-destructive mr-2 animate-pulse-slow" />
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">
                Report <span class="text-destructive">URL</span>
              </h1>
            </div>
            <p class="text-muted-foreground text-sm sm:text-base">Help us keep the platform safe by reporting malicious URLs</p>
            <div class="flex items-center justify-center space-x-4 mt-4">
              <NuxtLink to="/" class="text-sm text-primary hover:underline flex items-center">
                <ArrowLeft class="h-4 w-4 mr-1" />
                Back to Shortener
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Basic Auth for Admin Actions -->
      <Transition name="fade-y-delayed" appear>
        <div v-if="!isAdmin && showAdminLogin">
          <Card class="border-2 border-yellow-500/20 shadow-lg">
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>Login to manage reported URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <form @submit.prevent="attemptAdminLogin" class="space-y-4">
                <div class="space-y-2">
                  <Label for="adminUser">Username</Label>
                  <Input id="adminUser" v-model="adminCredentials.user" type="text" required />
                </div>
                <div class="space-y-2">
                  <Label for="adminPass">Password</Label>
                  <Input id="adminPass" v-model="adminCredentials.password" type="password" required />
                </div>
                <Button type="submit" :disabled="adminLoginLoading" class="w-full">
                  <Loader2 v-if="adminLoginLoading" class="h-4 w-4 mr-2 animate-spin" />
                  <span v-else>Login as Admin</span>
                </Button>
                <p v-if="adminLoginError" class="text-xs text-destructive">{{ adminLoginError }}</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </Transition>

      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <Button v-if="!isAdmin && !showAdminLogin" @click="showAdminLogin = true" variant="outline" size="sm">
            <ShieldAlert class="h-4 w-4 mr-2" />
            Admin Login
          </Button>
          <Button v-if="isAdmin" @click="logoutAdmin" variant="outline" size="sm">
            <LogOut class="h-4 w-4 mr-2" />
            Logout Admin
          </Button>
        </div>
        <Button @click="openNewReportDialog">
          <Flag class="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <!-- List of Reported URLs -->
      <Transition name="fade-y-delayed" appear>
        <div v-if="loadingReports" class="text-center py-8 blur-load">
          <Loader2 class="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p class="text-muted-foreground mt-2">Loading reported URLs...</p>
        </div>
        <div v-else-if="reportedUrls.length === 0" class="text-center py-8 blur-load">
          <Ban class="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p class="text-muted-foreground">No URLs reported yet.</p>
        </div>
        <div v-else class="space-y-4">
          <Card v-for="report in reportedUrls" :key="report._id" 
            class="border-2 transition-all duration-200 hover:shadow-md"
            :class="{
              'border-yellow-500/20': report.status === 'pending',
              'border-green-500/20': report.status === 'approved',
              'border-destructive/20': report.status === 'blocked'
            }">
            <CardHeader>
              <div class="flex justify-between items-start">
                <div class="space-y-1">
                  <CardTitle class="text-lg flex items-center space-x-2">
                    <Link class="h-4 w-4 text-primary" />
                    <span class="font-mono">/{{ report._id }}</span>
                  </CardTitle>
                  <CardDescription class="truncate">
                    Original: {{ report.originalUrl }}
                  </CardDescription>
                </div>
                <div class="text-right">
                  <Badge variant="outline"
                    :class="{
                      'border-yellow-500 text-yellow-500': report.status === 'pending',
                      'border-green-500 text-green-500': report.status === 'approved',
                      'border-destructive text-destructive': report.status === 'blocked'
                    }">
                    {{ report.status || 'N/A' }}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <p class="text-sm text-muted-foreground">
                  Reported: {{ new Date(report.reports[0].reportedAt).toLocaleString() }}
                </p>
                <p v-if="report.reports[0].reason" class="text-sm border-l-2 border-muted pl-3">
                  {{ report.reports[0].reason }}
                </p>
                <div v-if="isAdmin" class="pt-4">
                  <Label>Update Status</Label>
                  <Select v-model="report.newStatus" @update:modelValue="(newVal) => updateReportStatus(report._id, newVal)">
                    <SelectTrigger :class="{
                      'border-yellow-500/50': report.status === 'pending',
                      'border-green-500/50': report.status === 'approved',
                      'border-destructive/50': report.status === 'blocked'
                    }">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approve URL</SelectItem>
                      <SelectItem value="blocked">Block URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Transition>

      <!-- New Report Dialog -->
      <Dialog :open="isNewReportDialogOpen" @update:open="isNewReportDialogOpen = $event">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report a URL</DialogTitle>
            <DialogDescription>
              Enter the short URL slug you wish to report. We'll check its destination.
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <Label for="reportSlug">Short URL Slug</Label>
              <div class="relative">
                <Input 
                  id="reportSlug" 
                  v-model="newReport.slug" 
                  @blur="checkSlugDestination"
                  :disabled="slugCheck.loading"
                  class="pr-10"
                  required 
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 v-if="slugCheck.loading" class="h-4 w-4 animate-spin text-muted-foreground" />
                  <CheckCircle2 v-else-if="slugCheck.destination" class="h-4 w-4 text-green-500" />
                  <XCircle v-else-if="slugCheck.error" class="h-4 w-4 text-destructive" />
                </div>
              </div>
              <Transition name="slide-fade">
                <div v-if="slugCheck.destination || slugCheck.error" class="text-xs mt-1"
                  :class="{ 'text-green-500': slugCheck.destination, 'text-destructive': slugCheck.error }">
                  {{ slugCheck.destination || slugCheck.error }}
                </div>
              </Transition>
            </div>
            <div class="space-y-2">
              <Label for="reportReason">Reason for reporting</Label>
              <Textarea 
                id="reportReason" 
                v-model="newReport.reason" 
                placeholder="Please describe why you're reporting this URL..."
                rows="3" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="isNewReportDialogOpen = false">Cancel</Button>
            <Button @click="submitReport" :disabled="reportSubmitLoading || !slugCheck.destination">
              <Loader2 v-if="reportSubmitLoading" class="h-4 w-4 mr-2 animate-spin" />
              <span v-else>Submit Report</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useFetch, useCookie } from '#app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'vue-sonner';
import {
  Flag,
  ArrowLeft,
  Link,
  Loader2,
  Ban,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-vue-next';

interface ReportedUrl extends ShortenedUrlDocument {
  newStatus?: 'pending' | 'approved' | 'blocked'; // For admin UI to change status
}

const reportedUrls = ref<ReportedUrl[]>([]);
const loadingReports = ref(true);
const isNewReportDialogOpen = ref(false);
const newReport = ref({ slug: '', reason: '' });
const reportSubmitLoading = ref(false);

const slugCheck = ref({ loading: false, destination: '', error: '' });

const isAdmin = useCookie<boolean>('isAdmin');
const showAdminLogin = ref(false);
const adminCredentials = ref({ user: '', password: ''});
const adminLoginError = ref('');
const adminLoginLoading = ref(false);


const fetchReportedUrls = async () => {
  loadingReports.value = true;
  try {
    const { data, error } = await useFetch<ReportedUrl[]>('/api/reports');
    if (error.value) {
      toast.error(error.value.data?.statusMessage || 'Failed to load reported URLs.');
      reportedUrls.value = [];
    } else if (data.value) {
      reportedUrls.value = data.value.map(url => ({ ...url, newStatus: url.status }));
    }
  } catch (e: any) {
    toast.error(e.message || 'An unexpected error occurred while fetching reports.');
    reportedUrls.value = [];
  } finally {
    loadingReports.value = false;
  }
};

const attemptAdminLogin = async () => {
  adminLoginLoading.value = true;
  adminLoginError.value = '';
  try {
    const { data, error } = await useFetch('/api/admin/login', {
      method: 'POST',
      body: adminCredentials.value,
    });
    if (error.value) {
      adminLoginError.value = error.value.data?.statusMessage || 'Login failed.';
      isAdmin.value = false;
    } else {
      // @ts-ignore
      if (data.value?.success) {
        isAdmin.value = true;
        showAdminLogin.value = false;
        toast.success('Logged in as admin.');
        fetchReportedUrls(); // Refresh reports as admin status might show more/allow edits
      } else {
        // @ts-ignore
        adminLoginError.value = data.value?.message || 'Login failed.';
        isAdmin.value = false;
      }
    }
  } catch (e) {
    adminLoginError.value = 'An unexpected error occurred.';
    isAdmin.value = false;
  } finally {
    adminLoginLoading.value = false;
  }
};

const logoutAdmin = () => {
  isAdmin.value = false;
  toast.info('Logged out from admin.');
  fetchReportedUrls(); // Refresh
};

const openNewReportDialog = () => {
  newReport.value = { slug: '', reason: '' };
  slugCheck.value = { loading: false, destination: '', error: '' };
  isNewReportDialogOpen.value = true;
};

const checkSlugDestination = async () => {
  if (!newReport.value.slug) {
    slugCheck.value = { loading: false, destination: '', error: 'Slug is required.' };
    return;
  }
  slugCheck.value = { loading: true, destination: '', error: '' };
  try {
    // We use the existing /:shortId route handler to get info or redirect
    // A HEAD request can check existence and get headers without full body
    // Or a GET and look at the response.
    // For simplicity, let's assume we make a GET and see where it *would* go.
    // This is tricky client-side due to CORS if redirecting to external sites.
    // A backend endpoint /api/check-slug/:slug would be more robust.
    // For now, simulate by trying to fetch info which tells us if it's valid.
    const { data, error } = await useFetch<{ originalUrl?: string, protected?: boolean }>(`/api/p/${newReport.value.slug}/info`);

    if (error.value) {
        // Try the main redirect endpoint if info endpoint fails (e.g. not PIN protected)
        const res = await fetch(`/${newReport.value.slug}`, { method: 'HEAD', redirect: 'manual' });
        if (res.ok || res.status === 302 || res.status === 307) {
            const location = res.headers.get('Location');
            if (location) {
                 // if it's a local /p/slug, it's pin protected.
                if (location.startsWith(`/p/${newReport.value.slug}`)) {
                    slugCheck.value = { loading: false, destination: `PIN Protected Link`, error: '' };
                } else {
                    slugCheck.value = { loading: false, destination: location, error: '' };
                }
            } else if (res.url && res.url !== window.location.origin + `/${newReport.value.slug}`) {
                 // If the final URL after internal redirects is different, it's the destination
                slugCheck.value = { loading: false, destination: res.url, error: '' };
            }
            else {
                 slugCheck.value = { loading: false, destination: '', error: 'Slug found, but destination unclear or same page.' };
            }
        } else {
            slugCheck.value = { loading: false, destination: '', error: error.value?.data?.statusMessage || `Slug not found or invalid (Status: ${res.status})` };
        }
    } else if (data.value) {
      // The /info endpoint returns { protected: boolean }. We need originalUrl.
      // This simulation is imperfect. A dedicated backend for this is better.
      // For now, if /info succeeds, assume it's valid but don't know original URL without another call.
      // Let's assume for now it's valid and the backend will re-verify.
      slugCheck.value = { loading: false, destination: `Valid slug (destination backend verified)`, error: '' };
    }
  } catch (e: any) {
    slugCheck.value = { loading: false, destination: '', error: 'Error checking slug: ' + e.message };
  }
};

const submitReport = async () => {
  if (!newReport.value.slug || !slugCheck.value.destination) { // Require destination check success
    toast.error('Please enter a valid slug and verify its destination.');
    return;
  }
  reportSubmitLoading.value = true;
  try {
    const { data, error } = await useFetch('/api/reports', {
      method: 'POST',
      body: {
        slug: newReport.value.slug,
        reason: newReport.value.reason,
      },
    });
    if (error.value) {
      toast.error(error.value.data?.statusMessage || 'Failed to submit report.');
    } else {
      // @ts-ignore
      toast.success(data.value?.message || 'Report submitted successfully. It will be reviewed.');
      isNewReportDialogOpen.value = false;
      fetchReportedUrls(); // Refresh list
    }
  } catch (e: any) {
    toast.error(e.message || 'An unexpected error occurred.');
  } finally {
    reportSubmitLoading.value = false;
  }
};

const updateReportStatus = async (slug: string, newStatus: 'pending' | 'approved' | 'blocked') => {
  if (!isAdmin.value) {
    toast.error("You must be an admin to change status.");
    // Revert UI if optimistic update was done
    const url = reportedUrls.value.find(r => r._id === slug);
    if (url) url.newStatus = url.status;
    return;
  }
  try {
    const { data, error } = await useFetch(`/api/reports/${slug}/status`, {
      method: 'PUT',
      body: { status: newStatus },
       headers: {
        // Basic auth would typically be handled by browser popup or a dedicated auth flow.
        // Sending raw credentials like this is not ideal for production without HTTPS.
        // For this example, we rely on the cookie 'isAdmin' being set after /api/admin/login
        // The backend /api/reports/:slug/status should verify admin rights.
      }
    });
    if (error.value) {
      toast.error(error.value.data?.statusMessage || 'Failed to update status.');
      const url = reportedUrls.value.find(r => r._id === slug);
      if (url) url.newStatus = url.status; // Revert
    } else {
      // @ts-ignore
      toast.success(data.value?.message || `Status for /${slug} updated to ${newStatus}.`);
      const url = reportedUrls.value.find(r => r._id === slug);
      if (url) url.status = newStatus; // Commit change
    }
  } catch (e: any) {
    toast.error(e.message || 'An unexpected error occurred.');
    const url = reportedUrls.value.find(r => r._id === slug);
    if (url) url.newStatus = url.status; // Revert
  }
};

onMounted(() => {
  fetchReportedUrls();
  if(isAdmin.value === undefined) isAdmin.value = false; // Initialize if not set
});

// Watch for slug changes to auto-clear check results
watch(() => newReport.value.slug, () => {
    if (!isNewReportDialogOpen.value) return; // only if dialog is open
    slugCheck.value = { loading: false, destination: '', error: '' };
});

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

/* Slide fade animation */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-5px);
  opacity: 0;
}
</style>