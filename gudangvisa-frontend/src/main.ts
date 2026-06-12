import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import { useAuthStore } from "./stores/auth.store";
import App from "./App.vue";
import "./assets/main.css";
import i18n from "./i18n";

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.initialize();

import { useThemeStore } from "./stores/theme.store";
useThemeStore();
// themeStore.updateTheme() is called in its setup

app.use(router);
app.use(i18n);
app.mount("#app");
