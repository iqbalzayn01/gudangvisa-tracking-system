import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import { useAuthStore } from "./stores/auth.store";
import { useClientAuthStore } from "./stores/client-auth.store";
import App from "./App.vue";
import "./assets/main.css";

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

// Restore the separate client-portal session, if any.
const clientAuthStore = useClientAuthStore();
clientAuthStore.initialize();

import { useThemeStore } from "./stores/theme.store";
useThemeStore();
// themeStore.updateTheme() is called in its setup

app.use(router);
app.mount("#app");
