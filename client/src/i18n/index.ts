import { createI18n } from 'vue-i18n';
import id from './locales/id';
import en from './locales/en';

export type AppLocale = 'id' | 'en';

const STORAGE_KEY = 'locale';

function initialLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'id' ? stored : 'id';
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages: { id, en },
});

/** Switch the active locale and persist the choice. */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.setAttribute('lang', locale);
}

document.documentElement.setAttribute('lang', i18n.global.locale.value);

export default i18n;
