<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTicketById, updateTicketStatus } from '../api/tickets.api';
import { getDocumentsByTicket, getUploadUrl, uploadFileToStorage, addDocument, deleteDocument } from '../api/documents.api';
import { useAuthStore } from '../stores/auth.store';
import { useTicketStore } from '../stores/ticket.store';
import { useNotificationStore } from '../stores/notification.store';
import type { TrackingTicket, TicketDocument, DocStatus, DocType } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import FileUpload from '../components/FileUpload.vue';
import { formatDateTime } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ticketStore = useTicketStore();
const notify = useNotificationStore();

const ticket = ref<TrackingTicket | null>(null);
const documents = ref<TicketDocument[]>([]);
const isLoading = ref(true);

// Status update state
const showStatusForm = ref(false);
const newStatus = ref<DocStatus>('IN_REVIEW');
const descPublic = ref('');
const descInternal = ref('');
const isUpdating = ref(false);

// Document upload state
const showDocForm = ref(false);
const docName = ref('');
const docType = ref<DocType>('VISA');
const docIsPublic = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const uploadProgress = ref('');

const statusOptions: DocStatus[] = ['RECEIVED', 'IN_REVIEW', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'COMPLETED'];
const docTypes: DocType[] = ['VISA', 'KITAS', 'PASSPORT'];

onMounted(loadTicket);

async function loadTicket(): Promise<void> {
  isLoading.value = true;
  try {
    const id = route.params.id as string;
    ticket.value = await getTicketById(id);
    documents.value = await getDocumentsByTicket(id);
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to load ticket');
    router.push('/tickets');
  } finally {
    isLoading.value = false;
  }
}

async function handleStatusUpdate(): Promise<void> {
  if (!ticket.value || !descPublic.value.trim()) return;
  isUpdating.value = true;
  try {
    await updateTicketStatus(ticket.value.id, {
      statusName: newStatus.value,
      descriptionPublic: descPublic.value.trim(),
      descriptionInternal: descInternal.value.trim() || undefined,
    });
    ticketStore.updateStatusLocal(ticket.value.id, newStatus.value);
    notify.success('Status updated');
    showStatusForm.value = false;
    descPublic.value = '';
    descInternal.value = '';
    await loadTicket();
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to update status');
  } finally {
    isUpdating.value = false;
  }
}

async function handleDocUpload(): Promise<void> {
  if (!ticket.value || !selectedFile.value || !docName.value.trim()) return;
  isUploading.value = true;
  try {
    uploadProgress.value = 'Requesting upload URL…';
    const { signedUrl, storagePath } = await getUploadUrl({
      fileName: selectedFile.value.name,
      contentType: selectedFile.value.type,
      fileSize: selectedFile.value.size,
    });
    uploadProgress.value = 'Uploading file…';
    await uploadFileToStorage(signedUrl, selectedFile.value);
    uploadProgress.value = 'Saving record…';
    const doc = await addDocument({
      ticketId: ticket.value.id,
      docName: docName.value.trim(),
      docType: docType.value,
      isPublic: docIsPublic.value,
      storagePath,
    });
    documents.value.unshift(doc);
    notify.success('Document uploaded');
    showDocForm.value = false;
    docName.value = '';
    selectedFile.value = null;
    docIsPublic.value = false;
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    isUploading.value = false;
    uploadProgress.value = '';
  }
}

async function handleDocDelete(id: string): Promise<void> {
  try {
    await deleteDocument(id);
    documents.value = documents.value.filter((d) => d.id !== id);
    notify.success('Document deleted');
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to delete');
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors mb-6 cursor-pointer" @click="router.push('/tickets')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      Back to Tickets
    </button>

    <LoadingSpinner v-if="isLoading" />

    <template v-if="ticket">
      <!-- Header -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-start gap-3 flex-wrap mb-4">
          <div>
            <code class="text-lg text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg font-mono font-bold">{{ ticket.trackingCode }}</code>
            <h1 class="text-xl font-bold text-heading mt-3">{{ ticket.client?.name ?? 'Unknown Client' }}</h1>
          </div>
          <StatusBadge :status="ticket.currentStatus" />
        </div>
        <div class="flex gap-6 flex-wrap text-sm">
          <div><span class="text-subtle">Service:</span> <span class="text-heading font-medium ml-1">{{ ticket.serviceType }}</span></div>
          <div><span class="text-subtle">Handler:</span> <span class="text-heading font-medium ml-1">{{ ticket.handler?.fullName ?? '—' }}</span></div>
          <div><span class="text-subtle">Created:</span> <span class="text-heading font-medium ml-1">{{ formatDateTime(ticket.createdAt) }}</span></div>
        </div>
      </div>

      <!-- Status Update -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">Update Status</h2>
          <button v-if="!showStatusForm" class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer" @click="showStatusForm = true">Update</button>
        </div>
        <div v-if="showStatusForm" class="flex flex-col gap-3">
          <select v-model="newStatus" class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-indigo-500">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s.replace(/_/g, ' ') }}</option>
          </select>
          <input v-model="descPublic" type="text" class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-indigo-500 placeholder:text-subtle" placeholder="Public description (required) *" required />
          <input v-model="descInternal" type="text" class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-indigo-500 placeholder:text-subtle" placeholder="Internal notes (optional, staff only)" />
          <div class="flex gap-2 justify-end">
            <button class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer" @click="showStatusForm = false">Cancel</button>
            <button class="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer" :disabled="isUpdating || !descPublic.trim()" @click="handleStatusUpdate">{{ isUpdating ? 'Updating…' : 'Update' }}</button>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">Documents ({{ documents.length }})</h2>
          <button class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer" @click="showDocForm = !showDocForm">{{ showDocForm ? 'Cancel' : 'Upload' }}</button>
        </div>

        <!-- Upload form -->
        <div v-if="showDocForm" class="mb-5 p-4 rounded-xl bg-panel-light border border-edge flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading">Document Name *</label>
              <input v-model="docName" type="text" class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none focus:border-indigo-500 placeholder:text-subtle" placeholder="e.g. Passport Scan" required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading">Type</label>
              <select v-model="docType" class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-indigo-500">
                <option v-for="t in docTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-body cursor-pointer">
            <input v-model="docIsPublic" type="checkbox" class="accent-indigo-500" />
            Make visible to client (public)
          </label>
          <FileUpload label="Upload document file" @select="(f: File) => selectedFile = f" @clear="selectedFile = null" />
          <button class="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer" :disabled="isUploading || !docName.trim() || !selectedFile" @click="handleDocUpload">
            <span v-if="isUploading">{{ uploadProgress }}</span>
            <span v-else>Upload Document</span>
          </button>
        </div>

        <!-- Document list -->
        <div v-if="documents.length > 0" class="flex flex-col gap-2">
          <div v-for="doc in documents" :key="doc.id" class="flex items-center gap-3 p-3 rounded-lg bg-panel-light">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-heading truncate">{{ doc.docName }}</p>
              <p class="text-xs text-subtle">{{ doc.docType }} · {{ doc.isPublic ? 'Public' : 'Private' }}</p>
            </div>
            <a v-if="doc.fileDownloadUrl" :href="doc.fileDownloadUrl" target="_blank" class="text-sm text-indigo-400 hover:underline mr-2">Download</a>
            <button v-if="auth.isAdmin" class="p-1 rounded text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer" @click="handleDocDelete(doc.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <p v-else class="text-sm text-subtle text-center py-4">No documents attached yet.</p>
      </div>

      <!-- Timeline -->
      <div class="bg-panel border border-edge rounded-2xl p-6">
        <h2 class="text-base font-semibold text-heading mb-5">Tracking History</h2>
        <TrackingTimeline :histories="ticket.histories ?? []" :show-internal="true" />
      </div>
    </template>
  </div>
</template>
