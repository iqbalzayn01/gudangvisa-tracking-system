import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n';
import { useAuthStore } from './stores/auth.store';
import { useClientAuthStore } from './stores/client-auth.store';
import { useThemeStore } from './stores/theme.store';
import App from './App.vue';
import './styles/globals.css';

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

// Restore the separate client-portal session, if any.
const clientAuthStore = useClientAuthStore();
clientAuthStore.initialize();

// Instantiating the theme store applies the persisted theme in its setup.
useThemeStore();

app.use(i18n);
app.use(router);
app.mount('#app');
