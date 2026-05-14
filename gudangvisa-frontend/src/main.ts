import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import { useAuthStore } from './stores/auth.store';
import App from './App.vue';
import './assets/main.css';

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

app.use(router);
app.mount('#app');
