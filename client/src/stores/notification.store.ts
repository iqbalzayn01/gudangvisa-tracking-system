import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Notification, NotificationType } from '../types';

let nextId = 0;

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([]);

  function add(type: NotificationType, message: string): void {
    const id = nextId++;
    notifications.value.push({ id, type, message });
    setTimeout(() => remove(id), 4000);
  }

  function remove(id: number): void {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  }

  function success(message: string): void {
    add('success', message);
  }

  function error(message: string): void {
    add('error', message);
  }

  function info(message: string): void {
    add('info', message);
  }

  function warning(message: string): void {
    add('warning', message);
  }

  return { notifications, add, remove, success, error, info, warning };
});
