<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, nextTick, watch } from 'vue';
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
import StatusStepper from '../components/StatusStepper.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import FileUpload from '../components/FileUpload.vue';
import PdfPreview from '../components/PdfPreview.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import {
  formatDate,
  formatDateTime,
  formatTime,
  expiryState,
  expiryClasses,
  daysUntil,
} from '../utils/formatters';
import {
  DOCUMENT_TYPE_OPTIONS,
  applicationStatusLabel,
  documentTypeLabel,
  documentStatusLabel,
  documentStatusClass,
  visaTypeLabel,
  biometricStatusLabel,
  forwardNextOf,
  allowedNextStatuses,
  isExceptionStatus,
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

const documentTypeOptions = DOCUMENT_TYPE_OPTIONS;

// ── Status update state ──────────────────────────────────────────────────────
const showStatusForm = ref(false);
const newStatus = ref<ApplicationStatus>('document_verification');
const statusDescription = ref('');
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

// ── Inline document preview (review before verify/reject) ────────────────────
const previewId = ref<string | null>(null);
function docExt(doc: ApplicationDocument): string {
  const src = doc.fileUrl || doc.docName || '';
  return src.split('.').pop()?.toLowerCase() ?? '';
}
function isImageDoc(doc: ApplicationDocument): boolean {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(docExt(doc));
}
function isPdfDoc(doc: ApplicationDocument): boolean {
  return docExt(doc) === 'pdf';
}
function togglePreview(id: string): void {
  previewId.value = previewId.value === id ? null : id;
}

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
const checklistComplete = computed(
  () =>
    checklistProgress.value.total > 0 &&
    checklistProgress.value.done === checklistProgress.value.total,
);

// ── Guided workflow: derived state + next-step recommendation ────────────────
const docStats = computed(() => {
  const d = documents.value;
  return {
    total: d.length,
    pending: d.filter((x) => x.status === 'pending').length,
    verified: d.filter((x) => x.status === 'verified').length,
    rejected: d.filter((x) => x.status === 'rejected').length,
  };
});
const bioScheduled = computed(
  () =>
    application.value?.biometricStatus === 'scheduled' ||
    application.value?.biometricStatus === 'rescheduled',
);
const recommendedNext = computed<ApplicationStatus | null>(() =>
  application.value ? forwardNextOf(application.value.currentStatus) : null,
);

// ── Step completion (drives the strict wizard: locks + gating) ───────────────
const documentsDone = computed(
  () =>
    docStats.value.total > 0 &&
    docStats.value.pending === 0 &&
    docStats.value.rejected === 0,
);
const checklistDone = computed(
  () => checklistProgress.value.total === 0 || checklistComplete.value,
);
const biometricDone = computed(
  () => application.value?.biometricStatus === 'completed',
);

// Biometric only becomes an active step while the case sits at that phase.
const needsBiometric = computed(
  () => application.value?.currentStatus === 'biometric_scheduled',
);

// Linear flow: the single step staff should work on right now. Steps before it
// count as done; steps after it are locked. No manual jumping between steps.
// Once the case is fully completed, every step reads as done regardless of
// how it got there (e.g. a checklist item added/left unchecked after close).
const currentStep = computed<StepTarget>(() => {
  if (application.value?.currentStatus === 'completed') return 'status';
  if (!documentsDone.value) return 'documents';
  if (!checklistDone.value) return 'checklist';
  if (needsBiometric.value && !biometricDone.value) return 'biometric';
  return 'status';
});
const STEP_ORDER: StepTarget[] = [
  'documents',
  'checklist',
  'biometric',
  'status',
];
const STEP_META: Record<StepTarget, { n: number; label: string }> = {
  documents: { n: 1, label: 'Documents' },
  checklist: { n: 2, label: 'Checklist' },
  biometric: { n: 3, label: 'Biometric' },
  status: { n: 4, label: 'Update Status' },
};
// Biometric is only part of this case's flow once it's actually relevant —
// scheduled/completed, or the case is sitting at the biometric stage. For visa
// types that never need biometrics (e.g. B211A) the step is hidden entirely.
const biometricApplies = computed(
  () =>
    needsBiometric.value ||
    biometricDone.value ||
    (application.value?.biometricStatus != null &&
      application.value.biometricStatus !== 'not_scheduled'),
);
const visibleSteps = computed<StepTarget[]>(() =>
  STEP_ORDER.filter((s) => s !== 'biometric' || biometricApplies.value),
);

type StepState = 'done' | 'current' | 'skipped' | 'locked';
// A step is only "done" (green) when its work was actually completed — never
// just because the flow moved past it. A step passed over without completion
// (e.g. biometric that wasn't required) is "skipped", not done.
function stepStateOf(step: StepTarget): StepState {
  if (application.value?.currentStatus === 'completed') return 'done';
  if (step === currentStep.value) return 'current';
  const actuallyDone: Record<StepTarget, boolean> = {
    documents: documentsDone.value,
    checklist: checklistDone.value,
    biometric: biometricDone.value,
    status: isClosed.value,
  };
  if (actuallyDone[step]) return 'done';
  const idx = STEP_ORDER.indexOf(step);
  const curIdx = STEP_ORDER.indexOf(currentStep.value);
  return idx < curIdx ? 'skipped' : 'locked';
}

type StepTarget = 'documents' | 'checklist' | 'biometric' | 'status';
interface NextAction {
  label: string;
  hint: string;
  target: StepTarget;
}

// Maps the current status + data state to the single action staff should take
// next. Drives the "Next step" card. Returns null when the case is closed.
const nextAction = computed<NextAction | null>(() => {
  const a = application.value;
  if (!a) return null;
  const s = a.currentStatus;
  const { pending, total } = docStats.value;
  const plural = (n: number) => (n > 1 ? 's' : '');

  if (s === 'completed' || s === 'cancelled') return null;
  if (s === 'on_hold')
    return {
      label: 'Case is on hold',
      hint: 'Set a new status to resume processing when ready.',
      target: 'status',
    };
  if (s === 'rejected')
    return {
      label: 'Case was rejected',
      hint: 'Review the tracking history, or set a new status to re-open it.',
      target: 'status',
    };

  if (s === 'draft' || s === 'document_collection') {
    if (total === 0)
      return {
        label: 'Upload the required documents',
        hint: 'Collect and upload each document the client must provide.',
        target: 'documents',
      };
    if (pending > 0)
      return {
        label: `Verify ${pending} pending document${plural(pending)}`,
        hint: 'Review each uploaded file and mark it verified or rejected.',
        target: 'documents',
      };
    return {
      label: 'Advance to Document Verification',
      hint: 'Documents are in — move the case forward.',
      target: 'status',
    };
  }
  if (s === 'document_verification') {
    if (pending > 0)
      return {
        label: `Verify ${pending} pending document${plural(pending)}`,
        hint: 'Review each uploaded file and mark it verified or rejected.',
        target: 'documents',
      };
    if (!checklistComplete.value)
      return {
        label: `Complete the checklist (${checklistProgress.value.done}/${checklistProgress.value.total})`,
        hint: 'Tick off every required item before submitting to immigration.',
        target: 'checklist',
      };
    return {
      label: 'Submit to Immigration',
      hint: 'All documents verified and the checklist is complete.',
      target: 'status',
    };
  }
  if (s === 'document_revision')
    return {
      label: 'Client must re-submit documents',
      hint: 'Wait for corrected files, then re-verify them.',
      target: 'documents',
    };
  if (s === 'biometric_scheduled')
    return bioScheduled.value
      ? {
          label: 'Mark biometric as Completed',
          hint: 'Update the appointment after the client attends.',
          target: 'biometric',
        }
      : {
          label: 'Schedule the biometric appointment',
          hint: 'Set the date, time, location and field assistant.',
          target: 'biometric',
        };
  if (s === 'biometric_completed')
    return {
      label: 'Advance to Immigration Processing',
      hint: 'Biometrics done — move the case forward.',
      target: 'status',
    };
  if (s === 'approved' || s === 'evisa_issued')
    return {
      label: 'Upload the final e-Visa, then mark Completed',
      hint: 'Attach the issued document and close the case.',
      target: 'documents',
    };

  const next = recommendedNext.value;
  return {
    label: next
      ? `Advance to ${applicationStatusLabel(next)}`
      : 'Advance to the next step',
    hint: 'Move the case forward once this stage is done.',
    target: 'status',
  };
});

// The only statuses selectable in the form (strict: one forward step, the
// revision branch, or an exception — nothing else).
const DOC_PHASE_STATUSES = new Set<ApplicationStatus>([
  'draft',
  'document_collection',
  'document_verification',
  'document_revision',
]);
const allowedStatuses = computed<ApplicationStatus[]>(() =>
  application.value ? allowedNextStatuses(application.value.currentStatus) : [],
);

// Hard gate: leaving the document stage requires every document verified and
// the checklist complete. Exception statuses and doc-stage moves are exempt.
const canAdvance = computed(() => {
  const target = newStatus.value;
  if (isExceptionStatus(target)) return true;
  if (DOC_PHASE_STATUSES.has(target)) return true;
  return documentsDone.value && checklistDone.value;
});
const advanceBlockReason = computed(() => {
  if (canAdvance.value) return '';
  const todo: string[] = [];
  if (!documentsDone.value) todo.push('verify every uploaded document');
  if (!checklistDone.value) todo.push('complete the checklist');
  return `Before leaving the document stage you must ${todo.join(' and ')}.`;
});

// ── Step flow ────────────────────────────────────────────────────────────────
const stepsRef = ref<HTMLElement | null>(null);

// Staff can step BACK to an already-completed step to review it (e.g. re-open
// the documents to view/verify), but can never jump FORWARD to a locked step.
// `selectedStep` overrides the auto-computed current step; null = follow it.
const selectedStep = ref<StepTarget | null>(null);
const effectiveStep = computed<StepTarget>(
  () => selectedStep.value ?? currentStep.value,
);
function selectStep(step: StepTarget): void {
  if (stepStateOf(step) === 'locked') return;
  selectedStep.value = step === currentStep.value ? null : step;
}
// When the flow advances on its own, snap back to following the current step.
watch(currentStep, () => {
  selectedStep.value = null;
});

// The "Next step" CTA opens the form for the current step and scrolls to it.
async function focusStep(): Promise<void> {
  selectedStep.value = null;
  const step = currentStep.value;
  if (step === 'documents') showDocForm.value = true;
  if (step === 'biometric') {
    syncBiometricForm();
    showBiometricForm.value = true;
  }
  if (step === 'status') openStatusForm();
  await nextTick();
  stepsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openStatusForm(): void {
  if (isClosed.value) return;
  newStatus.value =
    recommendedNext.value ??
    allowedStatuses.value[0] ??
    application.value!.currentStatus;
  showStatusForm.value = true;
}

// ── Confirmation dialog (delete document / exception status) ─────────────────
const confirmState = ref<{
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
} | null>(null);
const confirmLoading = ref(false);

function askConfirm(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void | Promise<void>,
): void {
  confirmState.value = { title, message, confirmText, onConfirm };
}
async function runConfirm(): Promise<void> {
  const action = confirmState.value?.onConfirm;
  if (!action) return;
  confirmLoading.value = true;
  try {
    await action();
    confirmState.value = null;
  } finally {
    confirmLoading.value = false;
  }
}

onMounted(loadApplication);

async function loadApplication(): Promise<void> {
  isLoading.value = true;
  try {
    const id = route.params.id as string;
    application.value = await getApplicationById(id);
    documents.value = await getDocumentsByApplication(id);
    syncBiometricForm();
    // Propagate the fresh record to the store so the applications list and the
    // biometrics page (both derived from the store) reflect edits made here.
    applicationStore.updateLocal(application.value);
  } catch (err) {
    notify.fromError(err, 'Failed to load application');
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
// Exception statuses (rejected / cancelled / on_hold) are consequential —
// gate them behind a confirmation before hitting the API.
function handleStatusUpdate(): void {
  if (!application.value || !statusDescription.value.trim()) return;
  if (isExceptionStatus(newStatus.value)) {
    askConfirm(
      `Set status to “${applicationStatusLabel(newStatus.value)}”?`,
      'This is an exception status. Continue?',
      'Set status',
      doStatusUpdate,
    );
    return;
  }
  doStatusUpdate();
}

async function doStatusUpdate(): Promise<void> {
  if (!application.value || !statusDescription.value.trim()) return;
  isUpdating.value = true;
  try {
    await updateApplicationStatus(application.value.id, {
      status: newStatus.value,
      descriptionPublic: statusDescription.value.trim(),
    });
    applicationStore.updateStatusLocal(application.value.id, newStatus.value);
    notify.success('Status updated');
    showStatusForm.value = false;
    statusDescription.value = '';
    await loadApplication();
  } catch (err) {
    notify.fromError(err, 'Failed to update status');
  } finally {
    isUpdating.value = false;
  }
}

// ── Document upload ──────────────────────────────────────────────────────────
async function handleDocUpload(): Promise<void> {
  if (!application.value || !selectedFile.value || !docName.value.trim())
    return;
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
    notify.fromError(err, 'Upload failed');
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
    notify.fromError(err, 'Failed to verify');
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
    notify.fromError(err, 'Failed to reject');
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

function promptDocDelete(id: string): void {
  askConfirm(
    'Delete this document?',
    'This permanently removes the document record and its file. This cannot be undone.',
    'Delete',
    () => handleDocDelete(id),
  );
}

async function handleDocDelete(id: string): Promise<void> {
  try {
    await deleteDocument(id);
    documents.value = documents.value.filter((d) => d.id !== id);
    notify.success('Document deleted');
  } catch (err) {
    notify.fromError(err, 'Failed to delete');
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
    applicationStore.updateLocal(application.value);
  } catch (err) {
    notify.fromError(err, 'Failed to update');
  } finally {
    togglingIndex.value = null;
  }
}

// ── Biometric ────────────────────────────────────────────────────────────────
// A scheduled / rescheduled appointment must carry a date — otherwise the
// client gets notified about a date-less appointment.
const bioValid = computed(
  () =>
    (bioStatus.value !== 'scheduled' && bioStatus.value !== 'rescheduled') ||
    !!bioDate.value,
);

async function handleBiometricSave(): Promise<void> {
  if (!application.value || !bioValid.value) return;
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
    notify.fromError(err, 'Failed to save');
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
        <!-- Phase stepper -->
        <div class="mt-6">
          <StatusStepper :current-status="application.currentStatus" />
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

      <!-- Next step guidance -->
      <div
        v-if="nextAction"
        class="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6 flex items-start gap-4"
      >
        <div
          class="w-9 h-9 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-[11px] font-semibold uppercase tracking-wide text-red-400/80 mb-0.5"
          >
            Next step
          </p>
          <p class="text-sm font-semibold text-heading">
            {{ nextAction.label }}
          </p>
          <p class="text-xs text-subtle mt-0.5">{{ nextAction.hint }}</p>
        </div>
        <Button
          variant="ghost"
          class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto shrink-0 self-center"
          @click="focusStep()"
        >
          Go →
        </Button>
      </div>

      <!-- Step progress rail (read-only: the flow advances on its own) -->
      <div
        ref="stepsRef"
        class="flex items-center gap-1 mb-4 p-2 bg-panel border border-edge rounded-xl overflow-x-auto scroll-mt-6"
      >
        <template v-for="(key, i) in visibleSteps" :key="key">
          <div v-if="i > 0" class="w-6 h-0.5 shrink-0 bg-edge" />
          <button
            type="button"
            :disabled="stepStateOf(key) === 'locked'"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            :class="[
              key === effectiveStep
                ? 'bg-red-500/15 text-red-400 font-semibold'
                : stepStateOf(key) === 'done'
                  ? 'text-emerald-400'
                  : 'text-subtle/50',
              stepStateOf(key) === 'locked'
                ? 'cursor-not-allowed'
                : 'cursor-pointer hover:bg-panel-light',
            ]"
            :title="
              stepStateOf(key) === 'locked'
                ? 'Complete the current step first'
                : key !== currentStep
                  ? 'Review this step'
                  : ''
            "
            @click="selectStep(key)"
          >
            <!-- Done -->
            <span
              v-if="stepStateOf(key) === 'done'"
              class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <!-- Current number -->
            <span
              v-else-if="stepStateOf(key) === 'current'"
              class="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0"
              >{{ STEP_META[key].n }}</span
            >
            <!-- Locked (ahead, not reached) -->
            <svg
              v-else-if="stepStateOf(key) === 'locked'"
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <!-- Skipped (passed over without completing, e.g. no biometric) -->
            <span
              v-else
              class="w-5 h-5 rounded-full border border-subtle/40 text-subtle/60 flex items-center justify-center shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span class="text-sm">{{ STEP_META[key].label }}</span>
          </button>
        </template>
      </div>

      <!-- ① Documents -->
      <div
        v-show="effectiveStep === 'documents'"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
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
            class="flex flex-col gap-2 p-3 rounded-[8px] border border-edge"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
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
                    <template v-if="daysUntil(doc.expiryDate) < 0"
                      >(expired)</template
                    >
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
              <Button
                v-if="doc.fileDownloadUrl"
                variant="ghost"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition-colors cursor-pointer h-auto"
                @click="togglePreview(doc.id)"
              >
                {{ previewId === doc.id ? 'Hide' : 'View' }}
              </Button>
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
                @click="promptDocDelete(doc.id)"
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

            <!-- Inline preview for review -->
            <div
              v-if="previewId === doc.id && doc.fileDownloadUrl"
              class="w-full max-w-full border border-edge bg-dark"
            >
              <img
                v-if="isImageDoc(doc)"
                :src="doc.fileDownloadUrl"
                :alt="doc.docName"
                class="w-full h-[45vh] sm:h-[65vh] object-contain bg-black/40"
              />
              <PdfPreview
                v-else-if="isPdfDoc(doc)"
                :url="doc.fileDownloadUrl"
                :title="doc.docName"
              />
              <div
                v-else
                class="flex items-center gap-2 p-4 text-xs text-subtle"
              >
                <span>Inline preview not supported for this file type.</span>
                <a
                  :href="doc.fileDownloadUrl"
                  target="_blank"
                  class="text-red-400 hover:underline"
                  >Open in new tab</a
                >
              </div>
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

      <!-- ② Document Checklist -->
      <div
        v-show="effectiveStep === 'checklist'"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">
            Document Checklist
          </h2>
          <span
            v-if="checklistProgress.total"
            class="text-xs font-semibold text-subtle"
          >
            {{ checklistProgress.done }}/{{ checklistProgress.total }} complete
          </span>
        </div>
        <div
          v-if="application.checklist && application.checklist.length"
          class="flex flex-col gap-1.5"
        >
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
              :class="
                item.isChecked ? 'text-subtle line-through' : 'text-heading'
              "
              >{{ item.name }}</span
            >
            <span
              v-if="item.isChecked && item.checkedAt"
              class="ml-auto text-[11px] text-subtle"
              >{{ formatDate(item.checkedAt) }}</span
            >
          </label>
        </div>
        <p v-else class="text-sm text-subtle text-center py-4">
          No checklist items for this application.
        </p>
      </div>

      <!-- ③ Biometric Scheduling -->
      <div
        v-show="effectiveStep === 'biometric'"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
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
              >{{
                application.biometricDate
                  ? formatDate(application.biometricDate)
                  : '—'
              }}<span v-if="application.biometricTime">
                · {{ formatTime(application.biometricTime) }}</span
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
        <p v-else-if="!showBiometricForm" class="text-sm text-subtle">
          No biometric appointment scheduled yet.
        </p>

        <!-- Biometric form -->
        <div v-if="showBiometricForm" class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Status</label
              >
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
          <p v-if="!bioValid" class="text-xs text-amber-400">
            A date is required for a scheduled or rescheduled appointment.
          </p>
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
              :disabled="isSavingBio || !bioValid"
              @click="handleBiometricSave"
            >
              {{ isSavingBio ? 'Saving…' : 'Save' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ④ Update Status -->
      <div
        v-show="effectiveStep === 'status'"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-base font-semibold text-heading">Update Status</h2>
          <Button
            variant="ghost"
            v-if="!showStatusForm && !isClosed"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
            @click="openStatusForm()"
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
            This application is {{ application.currentStatus }}. No further
            status updates are allowed.
          </p>
        </div>

        <!-- Status update form -->
        <div v-if="showStatusForm && !isClosed" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-heading"
              >New status</label
            >
            <select
              v-model="newStatus"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500"
            >
              <option v-for="s in allowedStatuses" :key="s" :value="s">
                {{ applicationStatusLabel(s)
                }}{{ s === recommendedNext ? '  (recommended)' : '' }}
              </option>
            </select>
            <p class="text-[11px] text-subtle">
              Only the next valid step, the revision branch, or an exception can
              be selected — stages cannot be skipped.
            </p>
          </div>
          <input
            v-model="statusDescription"
            type="text"
            class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 placeholder:text-subtle"
            placeholder="Description (required) *"
            required
          />
          <!-- Hard block: cannot leave the document stage until it is complete -->
          <div
            v-if="advanceBlockReason"
            class="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mt-0.5 shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{{ advanceBlockReason }}</span>
          </div>
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
              class="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-auto"
              :disabled="isUpdating || !statusDescription.trim() || !canAdvance"
              @click="handleStatusUpdate"
            >
              {{ isUpdating ? 'Updating…' : 'Update' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-panel border border-edge rounded-2xl p-6">
        <h2 class="text-base font-semibold text-heading mb-5">
          Tracking History
        </h2>
        <TrackingTimeline :histories="application.histories ?? []" />
      </div>
    </template>

    <ConfirmDialog
      v-if="confirmState"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      variant="danger"
      :loading="confirmLoading"
      @confirm="runConfirm"
      @cancel="confirmState = null"
    />
  </div>
</template>
