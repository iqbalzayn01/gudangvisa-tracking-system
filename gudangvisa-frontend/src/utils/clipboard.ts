import { useNotificationStore } from '../stores/notification.store';

/**
 * Copies the given text to the clipboard and shows a notification.
 * @param text The string to copy to the clipboard.
 * @param successMessage Optional custom success message for the notification.
 */
export async function copyToClipboard(text: string, successMessage = 'Copied to clipboard'): Promise<void> {
  const notify = useNotificationStore();
  try {
    await navigator.clipboard.writeText(text);
    notify.success(successMessage);
  } catch (err) {
    notify.error('Failed to copy to clipboard');
  }
}
