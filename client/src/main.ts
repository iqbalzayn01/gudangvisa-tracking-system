import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n';
import { useAuthStore } from './stores/auth.store';
import { useClientAuthStore } from './stores/client-auth.store';
import App from './App.vue';
import './styles/globals.css';

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

// Restore the separate client-portal session, if any.
const clientAuthStore = useClientAuthStore();
clientAuthStore.initialize();

import { useThemeStore } from './stores/theme.store';
useThemeStore();
// themeStore.updateTheme() is called in its setup

app.use(i18n);
app.use(router);
app.mount('#app');
