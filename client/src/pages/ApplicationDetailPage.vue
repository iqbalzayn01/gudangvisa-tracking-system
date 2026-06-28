<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  getApplicationById,
  updateApplicationStatus,
  updateBiometricSchedule,
  toggleChecklistItem,
} from '../api/applications.api';
import {
  getDocumentsByApplication,
  getUploadUrl,
  uploadFileToStorage,
  addDocument,
  deleteDocument,
  verifyDocument,
} from '../api/documents.api';
import { useAuthStore } from '../stores/auth.store';
import { useApplicationStore } from '../stores/application.store';
import { useNotificationStore } from '../stores/notification.store';
import type {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  BiometricStatus,
  DocumentType,
} from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import PriorityBadge from '../components/PriorityBadge.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import FileUpload from '../components/FileUpload.vue';
import {
  formatDate,
  formatDateTime,
  expiryState,
  expiryClasses,
  daysUntil,
  biometricStatusLabel,
} from '../utils/formatters';
import {
  STATUS_GROUPS,
  DOCUMENT_TYPE_OPTIONS,
  applicationStatusLabel,
  documentTypeLabel,
  documentStatusLabel,
  documentStatusClass,
  visaTypeLabel,
} from '../utils/labels';
import { copyToClipboard } from '../utils/clipboard';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const applicationStore = useApplicationStore();
const notify = useNotificationStore();

const application = ref<Application | null>(null);
const documents = ref<ApplicationDocument[]>([]);
const isLoading = ref(true);

// An application that is completed or cancelled is locked (matches backend).
const isClosed = computed(
  () =>
    application.value?.currentStatus === 'completed' ||
    application.value?.currentStatus === 'cancelled',
);

const statusGroups = STATUS_GROUPS;
const documentTypeOptions = DOCUMENT_TYPE_OPTIONS;

// ── Status update state ──────────────────────────────────────────────────────
const showStatusForm = ref(false);
const newStatus = ref<ApplicationStatus>('document_verification');
const statusDescription = ref('');
const visibleToClient = ref(true);
const isUpdating = ref(false);

// ── Document upload state ────────────────────────────────────────────────────
const showDocForm = ref(false);
const docName = ref('');
const documentType = ref<DocumentType>('passport');
const issuedDate = ref('');
const expiryDate = ref('');
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const uploadProgress = ref('');

// ── Document verification state ──────────────────────────────────────────────
const rejectingId = ref<string | null>(null);
const rejectionReason = ref('');
const verifyingId = ref<string | null>(null);

// ── Biometric state ──────────────────────────────────────────────────────────
const biometricStatuses: BiometricStatus[] = [
  'not_scheduled',
  'scheduled',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
];
const showBiometricForm = ref(false);
const bioStatus = ref<BiometricStatus>('scheduled');
const bioDate = ref('');
const bioTime = ref('');
const bioLocation = ref('');
const bioAssistantName = ref('');
const bioAssistantPhone = ref('');
const isSavingBio = ref(false);

// ── Checklist state ──────────────────────────────────────────────────────────
const togglingIndex = ref<number | null>(null);
const checklistProgress = computed(() => {
  const items = application.value?.checklist ?? [];
  const done = items.filter((i) => i.isChecked).length;
  return { done, total: items.length };
});

onMounted(loadApplication);

async function loadApplication(): Promise<void> {
  isLoading.value = true;
  try {
    const id = route.params.id as string;
    application.value = await getApplicationById(id);
    documents.value = await getDocumentsByApplication(id);
    syncBiometricForm();
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to load application',
    );
    router.push('/applications');
  } finally {
    isLoading.value = false;
  }
}

function syncBiometricForm(): void {
  const a = application.value;
  if (!a) return;
  bioStatus.value =
    a.biometricStatus && a.biometricStatus !== 'not_scheduled'
      ? a.biometricStatus
      : 'scheduled';
  bioDate.value = a.biometricDate ?? '';
  bioTime.value = a.biometricTime ?? '';
  bioLocation.value = a.biometricLocation ?? '';
  bioAssistantName.value = a.fieldAssistantName ?? '';
  bioAssistantPhone.value = a.fieldAssistantPhone ?? '';
}

// ── Status update ────────────────────────────────────────────────────────────
async function handleStatusUpdate(): Promise<void> {
  if (!application.value || !statusDescription.value.trim()) return;
  isUpdating.value = true;
  try {
    await updateApplicationStatus(application.value.id, {
      status: newStatus.value,
      descriptionPublic: statusDescription.value.trim(),
      isVisibleToClient: visibleToClient.value,
    });
    applicationStore.updateStatusLocal(application.value.id, newStatus.value);
    notify.success('Status updated');
    showStatusForm.value = false;
    statusDescription.value = '';
    visibleToClient.value = true;
    await loadApplication();
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to update status',
    );
  } finally {
    isUpdating.value = false;
  }
}

// ── Document upload ──────────────────────────────────────────────────────────
async function handleDocUpload(): Promise<void> {
  if (!application.value || !selectedFile.value || !docName.value.trim()) return;
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
      applicationId: application.value.id,
      docName: docName.value.trim(),
      documentType: documentType.value,
      storagePath,
      issuedDate: issuedDate.value || undefined,
      expiryDate: expiryDate.value || undefined,
    });
    documents.value.unshift(doc);
    notify.success('Document uploaded');
    showDocForm.value = false;
    docName.value = '';
    documentType.value = 'passport';
    issuedDate.value = '';
    expiryDate.value = '';
    selectedFile.value = null;
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Upload failed');
  } finally {
    isUploading.value = false;
    uploadProgress.value = '';
  }
}

// ── Document verification ────────────────────────────────────────────────────
async function approveDoc(doc: ApplicationDocument): Promise<void> {
  verifyingId.value = doc.id;
  try {
    const updated = await verifyDocument(doc.id, { status: 'verified' });
    replaceDoc(updated);
    notify.success('Document verified');
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to verify');
  } finally {
    verifyingId.value = null;
  }
}

async function confirmReject(): Promise<void> {
  if (!rejectingId.value || !rejectionReason.value.trim()) return;
  const id = rejectingId.value;
  verifyingId.value = id;
  try {
    const updated = await verifyDocument(id, {
      status: 'rejected',
      rejectionReason: rejectionReason.value.trim(),
    });
    replaceDoc(updated);
    notify.success('Document rejected');
    rejectingId.value = null;
    rejectionReason.value = '';
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to reject');
  } finally {
    verifyingId.value = null;
  }
}

function replaceDoc(updated: ApplicationDocument): void {
  // The verify endpoint returns the row without a fresh signed download URL;
  // keep the existing one so the link still works.
  documents.value = documents.value.map((d) =>
    d.id === updated.id
      ? { ...updated, fileDownloadUrl: d.fileDownloadUrl }
      : d,
  );
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

// ── Checklist ────────────────────────────────────────────────────────────────
async function handleChecklistToggle(
  index: number,
  isChecked: boolean,
): Promise<void> {
  if (!application.value) return;
  togglingIndex.value = index;
  try {
    const result = await toggleChecklistItem(
      application.value.id,
      index,
      isChecked,
    );
    application.value.checklist = result.checklist;
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to update');
  } finally {
    togglingIndex.value = null;
  }
}

// ── Biometric ────────────────────────────────────────────────────────────────
async function handleBiometricSave(): Promise<void> {
  if (!application.value) return;
  isSavingBio.value = true;
  try {
    await updateBiometricSchedule(application.value.id, {
      biometricStatus: bioStatus.value,
      biometricDate: bioDate.value || undefined,
      biometricTime: bioTime.value || undefined,
      biometricLocation: bioLocation.value || undefined,
      fieldAssistantName: bioAssistantName.value || undefined,
      fieldAssistantPhone: bioAssistantPhone.value || undefined,
    });
    notify.success('Biometric schedule saved');
    showBiometricForm.value = false;
    await loadApplication();
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to save');
  } finally {
    isSavingBio.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <Button
      variant="ghost"
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors mb-6 cursor-pointer h-auto"
      @click="router.push('/applications')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Back to Applications
    </Button>

    <LoadingSpinner v-if="isLoading" />

    <template v-if="application">
      <!-- Header -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-start gap-3 flex-wrap mb-4">
          <div>
            <div class="flex items-center gap-2">
              <code
                class="text-lg text-red-400 bg-red-500/10 px-3 py-1 rounded-lg font-mono font-bold"
                >{{ application.trackingCode }}</code
              >
              <Button
                variant="ghost"
                class="p-1.5 rounded-md text-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer h-auto"
                title="Copy Code"
                @click="
                  copyToClipboard(
                    application.trackingCode,
                    'Reference number copied to clipboard',
                  )
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path
                    d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                  ></path>
                </svg>
              </Button>
            </div>
            <h1 class="text-xl font-bold text-heading mt-3">
              {{ application.client?.name ?? 'Unknown Client' }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <PriorityBadge :priority="application.priority ?? 'medium'" />
            <StatusBadge :status="application.currentStatus" />
          </div>
        </div>
        <div class="flex gap-6 flex-wrap text-sm">
          <div>
            <span class="text-subtle">Visa Type:</span>
            <span class="text-heading font-medium ml-1">{{
              visaTypeLabel(application.visaType)
            }}</span>
          </div>
          <div>
            <span class="text-subtle">Handler:</span>
            <span class="text-heading font-medium ml-1">{{
              application.handler?.fullName ?? '—'
            }}</span>
          </div>
          <div>
            <span class="text-subtle">Created:</span>
            <span class="text-heading font-medium ml-1">{{
              formatDateTime(application.createdAt)
            }}</span>
          </div>
        </div>
        <!-- Progress -->
        <div class="mt-4 flex items-center gap-3">
          <div class="flex-1 h-1.5 rounded-full bg-panel-light overflow-hidden">
            <div
              class="h-full rounded-full bg-red-500 transition-all"
              :style="{ width: `${application.progress ?? 0}%` }"
            ></div>
          </div>
          <span class="text-xs font-semibold text-subtle"
            >{{ application.progress ?? 0 }}%</span
          >
        </div>
      </div>

      <!-- Status Update -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">Update Status</h2>
          <Button
            variant="ghost"
            v-if="!showStatusForm && !isClosed"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
            @click="showStatusForm = true"
          >
            Update
          </Button>
        </div>

        <!-- Closed notice -->
        <div
          v-if="isClosed"
          class="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-emerald-400 shrink-0"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p class="text-sm text-emerald-300">
            This application is {{ application.currentStatus }}. No further status
            updates are allowed.
          </p>
        </div>

        <!-- Status update form -->
        <div v-if="showStatusForm && !isClosed" class="flex flex-col gap-3">
          <select
            v-model="newStatus"
            class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500"
          >
            <optgroup
              v-for="group in statusGroups"
              :key="group.label"
              :label="group.label"
            >
              <option v-for="s in group.statuses" :key="s" :value="s">
                {{ applicationStatusLabel(s) }}
              </option>
            </optgroup>
          </select>
          <input
            v-model="statusDescription"
            type="text"
            class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
            placeholder="Description (required) *"
            required
          />
          <label
            class="flex items-center gap-2 text-sm text-body cursor-pointer"
          >
            <input
              v-model="visibleToClient"
              type="checkbox"
              class="accent-red-500"
            />
            Visible to client (uncheck for an internal-only note)
          </label>
          <div class="flex gap-2 justify-end">
            <Button
              variant="ghost"
              class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
              @click="showStatusForm = false"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
              :disabled="isUpdating || !statusDescription.trim()"
              @click="handleStatusUpdate"
            >
              {{ isUpdating ? 'Updating…' : 'Update' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Document Checklist -->
      <div
        v-if="application.checklist && application.checklist.length"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">
            Document Checklist
          </h2>
          <span class="text-xs font-semibold text-subtle">
            {{ checklistProgress.done }}/{{ checklistProgress.total }} complete
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            v-for="(item, idx) in application.checklist"
            :key="idx"
            class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-panel-light transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              class="accent-red-500 w-4 h-4"
              :checked="item.isChecked"
              :disabled="togglingIndex === idx"
              @change="
                handleChecklistToggle(
                  idx,
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />
            <span
              class="text-sm"
              :class="item.isChecked ? 'text-subtle line-through' : 'text-heading'"
              >{{ item.name }}</span
            >
            <span
              v-if="item.isChecked && item.checkedAt"
              class="ml-auto text-[11px] text-subtle"
              >{{ formatDate(item.checkedAt) }}</span
            >
          </label>
        </div>
      </div>

      <!-- Biometric Scheduling -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">
            Biometric Appointment
          </h2>
          <Button
            variant="ghost"
            v-if="!showBiometricForm"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
            @click="
              syncBiometricForm();
              showBiometricForm = true;
            "
          >
            {{
              application.biometricStatus &&
              application.biometricStatus !== 'not_scheduled'
                ? 'Edit'
                : 'Schedule'
            }}
          </Button>
        </div>

        <!-- Current schedule -->
        <div
          v-if="
            !showBiometricForm &&
            application.biometricStatus &&
            application.biometricStatus !== 'not_scheduled'
          "
          class="grid grid-cols-2 gap-3 text-sm"
        >
          <div>
            <span class="text-subtle">Status:</span>
            <span class="text-heading font-medium ml-1">{{
              biometricStatusLabel(application.biometricStatus)
            }}</span>
          </div>
          <div>
            <span class="text-subtle">Date:</span>
            <span class="text-heading font-medium ml-1"
              >{{ application.biometricDate ? formatDate(application.biometricDate) : '—'
              }}<span v-if="application.biometricTime">
                · {{ application.biometricTime }}</span
              ></span
            >
          </div>
          <div class="col-span-2">
            <span class="text-subtle">Location:</span>
            <span class="text-heading font-medium ml-1">{{
              application.biometricLocation ?? '—'
            }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-subtle">Field assistant:</span>
            <span class="text-heading font-medium ml-1"
              >{{ application.fieldAssistantName ?? '—'
              }}<span v-if="application.fieldAssistantPhone">
                · {{ application.fieldAssistantPhone }}</span
              ></span
            >
          </div>
        </div>
        <p
          v-else-if="!showBiometricForm"
          class="text-sm text-subtle"
        >
          No biometric appointment scheduled yet.
        </p>

        <!-- Biometric form -->
        <div v-if="showBiometricForm" class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading">Status</label>
              <select
                v-model="bioStatus"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500"
              >
                <option v-for="s in biometricStatuses" :key="s" :value="s">
                  {{ biometricStatusLabel(s) }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading">Date</label>
              <input
                v-model="bioDate"
                type="date"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading">Time</label>
              <input
                v-model="bioTime"
                type="time"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Location</label
              >
              <input
                v-model="bioLocation"
                type="text"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
                placeholder="e.g. Kanim Denpasar"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Field assistant</label
              >
              <input
                v-model="bioAssistantName"
                type="text"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
                placeholder="Name"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Assistant phone</label
              >
              <input
                v-model="bioAssistantPhone"
                type="text"
                class="w-full px-3 py-2 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
                placeholder="Phone"
              />
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <Button
              variant="ghost"
              class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
              @click="showBiometricForm = false"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
              :disabled="isSavingBio"
              @click="handleBiometricSave"
            >
              {{ isSavingBio ? 'Saving…' : 'Save' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Documents -->
      <div class="bg-panel border border-edge rounded-2xl p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">
            Documents ({{ documents.length }})
          </h2>
          <Button
            variant="ghost"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
            @click="showDocForm = !showDocForm"
          >
            {{ showDocForm ? 'Cancel' : 'Upload' }}
          </Button>
        </div>

        <!-- Upload form -->
        <div
          v-if="showDocForm"
          class="mb-5 p-4 rounded-xl bg-panel-light border border-edge flex flex-col gap-3"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Document Name *</label
              >
              <input
                v-model="docName"
                type="text"
                class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
                placeholder="e.g. Passport Scan"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Document Type</label
              >
              <select
                v-model="documentType"
                class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500"
              >
                <option
                  v-for="t in documentTypeOptions"
                  :key="t.value"
                  :value="t.value"
                >
                  {{ t.label }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Issued Date</label
              >
              <input
                v-model="issuedDate"
                type="date"
                class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none focus:border-red-500"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Expiry Date</label
              >
              <input
                v-model="expiryDate"
                type="date"
                class="w-full px-3 py-2 text-sm text-heading bg-dark border border-edge rounded-lg outline-none focus:border-red-500"
              />
            </div>
          </div>
          <FileUpload
            label="Upload document file"
            @select="(f: File) => (selectedFile = f)"
            @clear="selectedFile = null"
          />
          <Button
            variant="ghost"
            class="w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
            :disabled="isUploading || !docName.trim() || !selectedFile"
            @click="handleDocUpload"
          >
            <span v-if="isUploading">{{ uploadProgress }}</span>
            <span v-else>Upload Document</span>
          </Button>
        </div>

        <!-- Document list -->
        <div v-if="documents.length > 0" class="flex flex-col gap-2">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="flex flex-col gap-2 p-3 rounded-lg bg-panel-light"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                  />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-heading truncate">
                  {{ doc.docName }}
                </p>
                <p class="text-xs text-subtle">
                  {{ documentTypeLabel(doc.documentType) }}
                  <span
                    v-if="doc.expiryDate"
                    class="ml-1"
                    :class="expiryClasses(expiryState(doc.expiryDate))"
                  >
                    · Expires {{ formatDate(doc.expiryDate) }}
                    <template v-if="daysUntil(doc.expiryDate) < 0">(expired)</template>
                  </span>
                </p>
              </div>
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                  documentStatusClass(doc.status),
                ]"
                >{{ documentStatusLabel(doc.status) }}</span
              >
              <a
                v-if="doc.fileDownloadUrl"
                :href="doc.fileDownloadUrl"
                target="_blank"
                class="text-sm text-red-400 hover:underline"
                >Download</a
              >
              <Button
                variant="ghost"
                v-if="auth.isAdmin"
                class="p-1 rounded text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer h-auto rounded-full"
                title="Delete"
                @click="handleDocDelete(doc.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </Button>
            </div>

            <!-- Rejection reason -->
            <p
              v-if="doc.status === 'rejected' && doc.rejectionReason"
              class="text-xs text-rose-400 pl-13"
            >
              Rejected: {{ doc.rejectionReason }}
            </p>

            <!-- Verify / reject actions -->
            <div
              v-if="doc.status === 'pending'"
              class="flex items-center gap-2 pl-13"
            >
              <Button
                variant="ghost"
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 cursor-pointer h-auto"
                :disabled="verifyingId === doc.id"
                @click="approveDoc(doc)"
              >
                Verify
              </Button>
              <Button
                variant="ghost"
                class="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors disabled:opacity-50 cursor-pointer h-auto"
                :disabled="verifyingId === doc.id"
                @click="
                  rejectingId = doc.id;
                  rejectionReason = '';
                "
              >
                Reject
              </Button>
            </div>

            <!-- Reject reason input -->
            <div
              v-if="rejectingId === doc.id"
              class="flex items-center gap-2 pl-13"
            >
              <input
                v-model="rejectionReason"
                type="text"
                class="flex-1 px-3 py-1.5 text-xs text-heading bg-dark border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
                placeholder="Reason for rejection (required)"
              />
              <Button
                variant="ghost"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
                :disabled="!rejectionReason.trim() || verifyingId === doc.id"
                @click="confirmReject"
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-edge text-body hover:bg-panel transition-colors cursor-pointer h-auto"
                @click="
                  rejectingId = null;
                  rejectionReason = '';
                "
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-subtle text-center py-4">
          No documents attached yet.
        </p>
      </div>

      <!-- Timeline -->
      <div class="bg-panel border border-edge rounded-2xl p-6">
        <h2 class="text-base font-semibold text-heading mb-5">
          Tracking History
        </h2>
        <TrackingTimeline
          :histories="application.histories ?? []"
          :show-internal="true"
        />
      </div>
    </template>
  </div>
</template>
