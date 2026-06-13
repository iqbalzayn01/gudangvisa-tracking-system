import type { RouteLocationNormalized } from 'vue-router';

/**
 * Per-route SEO / head management for the SPA.
 *
 * Policy:
 *  - The public client landing (`/portal`, `meta.index === true`) is the only
 *    indexable page: `index, follow` + canonical + Open Graph.
 *  - Every other route (staff login, client login, dashboard/admin, the
 *    authenticated client portal) is "Secure": `noindex, nofollow, noarchive`.
 *
 * Note: this only affects crawlers that execute JS. Non-JS crawlers and social
 * scrapers rely on the static tags in `index.html` and on `public/robots.txt`.
 */

interface RouteSeo {
  title?: string;
  description?: string;
  index?: boolean;
}

const SITE_NAME = 'GudangVisa';
const DEFAULT_TITLE = 'GudangVisa';
const DEFAULT_DESCRIPTION =
  'Lacak status dan riwayat dokumen imigrasi Anda — Visa, KITAS/KITAP, dan Paspor — secara real-time bersama GudangVisa.';
const OG_IMAGE_PATH = '/design/master-logo-2.png';

function upsertMeta(
  key: 'name' | 'property',
  value: string,
  content: string,
): void {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${key}="${value}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string | null): void {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyRouteSeo(to: RouteLocationNormalized): void {
  const meta = to.meta as RouteSeo;
  const indexable = meta.index === true;
  const title = meta.title ?? DEFAULT_TITLE;
  const description = meta.description ?? DEFAULT_DESCRIPTION;

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta(
    'name',
    'robots',
    indexable ? 'index, follow' : 'noindex, nofollow, noarchive',
  );

  const origin = window.location.origin;
  const url = origin + to.path;

  // Canonical only for the indexable public page.
  upsertCanonical(indexable ? url : null);

  // Open Graph / Twitter (kept in sync for share previews).
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:image', origin + OG_IMAGE_PATH);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', origin + OG_IMAGE_PATH);
}
