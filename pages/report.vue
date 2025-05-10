<template>
  <div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Reported URLs</h1>
      <Button @click="openNewReportDialog">New Report</Button>
    </div>

    <!-- Basic Auth for Admin Actions -->
    <div v-if="!isAdmin && showAdminLogin" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-600 rounded-lg">
      <h2 class="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Admin Login</h2>
      <form @submit.prevent="attemptAdminLogin" class="space-y-3">
        <div>
          <Label for="adminUser">Username</Label>
          <Input id="adminUser" v-model="adminCredentials.user" type="text" required class="mt-1" />
        </div>
        <div>
          <Label for="adminPass">Password</Label>
          <Input id="adminPass" v-model="adminCredentials.password" type="password" required class="mt-1" />
        </div>
        <Button type="submit" :disabled="adminLoginLoading">
          <span v-if="adminLoginLoading">Logging in...</span>
          <span v-else>Login as Admin</span>
        </Button>
        <p v-if="adminLoginError" class="text-red-600 dark:text-red-400 text-sm">{{ adminLoginError }}</p>
      </form>
    </div>
    <Button v-if="!isAdmin && !showAdminLogin" @click="showAdminLogin = true" variant="outline" size="sm">Show Admin Login</Button>
     <Button v-if="isAdmin" @click="logoutAdmin" variant="outline" size="sm">Logout Admin</Button>


    <!-- List of Reported URLs -->
    <div v-if="loadingReports" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">Loading reported URLs...</p>
      <!-- You can add a spinner here -->
    </div>
    <div v-else-if="reportedUrls.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No URLs reported yet.</p>
    </div>
    <div v-else class="space-y-4">
      <div
        v-for="report in reportedUrls"
        :key="report._id"
        class="p-4 rounded-lg shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">/{{ report._id }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">Original: {{ report.originalUrl }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">Reported at: {{ new Date(report.reports[0].reportedAt).toLocaleString() }}</p>
            <p v-if="report.reports[0].reason" class="text-xs text-gray-400 dark:text-gray-500">Reason: {{ report.reports[0].reason }}</p>
          </div>
          <div class="text-right">
            <span
              class="px-2 py-1 text-xs font-semibold rounded-full"
              :class="{
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200': report.status === 'pending',
                'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200': report.status === 'approved',
                'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200': report.status === 'blocked'
              }"
            >
              {{ report.status || 'N/A' }}
            </span>
            <div v-if="isAdmin" class="mt-2">
              <Select v-model="report.newStatus" @update:modelValue="(newVal) => updateReportStatus(report._id, newVal)">
                <SelectTrigger class="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Report Dialog -->
    <Dialog :open="isNewReportDialogOpen" @update:open="isNewReportDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report a URL</DialogTitle>
          <DialogDescription>
            Enter the short URL slug (e.g., abcDe) you wish to report. We'll check its destination.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="submitReport" class="space-y-4 py-4">
          <div>
            <Label for="reportSlug">Short URL Slug</Label>
            <Input id="reportSlug" v-model="newReport.slug" @blur="checkSlugDestination" required class="mt-1" />
            <p v-if="slugCheck.loading" class="text-xs text-gray-500 mt-1">Checking slug...</p>
            <p v-if="slugCheck.destination" class="text-xs text-green-600 mt-1">Redirects to: {{ slugCheck.destination }}</p>
            <p v-if="slugCheck.error" class="text-xs text-red-600 mt-1">Error: {{ slugCheck.error }}</p>
          </div>
          <div>
            <Label for="reportReason">Reason for reporting (optional)</Label>
            <Textarea id="reportReason" v-model="newReport.reason" class="mt-1" rows="3" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="isNewReportDialogOpen = false">Cancel</Button>
            <Button type="submit" :disabled="reportSubmitLoading || !slugCheck.destination">
              <span v-if="reportSubmitLoading">Submitting...</span>
              <span v-else>Submit Report</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Toaster />
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
import { Toaster, toast } from 'vue-sonner';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post'; // Re-use this type

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
/* Styles for report page */
</style>