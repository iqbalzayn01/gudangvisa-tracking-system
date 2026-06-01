<script setup lang="ts">
// Public Footer Component
</script>

<template>
  <footer class="bg-panel border-t border-edge mt-auto">
    <div class="max-w-7xl mx-auto px-6 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        <!-- Left Side: Contact & Socials -->
        <div class="flex flex-col gap-5">
          <div class="flex items-center gap-2 mb-2">
            <img
              src="/design/logo-square.png"
              alt="Gudang Visa Logo"
              width="32"
              height="32"
              class="shrink-0"
            />
            <span class="text-xl font-bold text-white tracking-wide"
              >GudangVisa</span
            >
          </div>

          <div class="flex flex-col gap-3 text-sm text-subtle">
            <a
              href="tel:02112345678"
              class="inline-flex items-center gap-3 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                />
              </svg>
              (021) 1234 5678
            </a>
            <a
              href="mailto:support@gudangvisa.com"
              class="inline-flex items-center gap-3 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              support@gudangvisa.com
            </a>
          </div>

          <!-- Social Icons -->
          <div class="flex items-center gap-4 mt-2">
            <a
              href="#"
              aria-label="Facebook"
              class="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-subtle hover:bg-red-500 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              class="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-subtle hover:bg-pink-500 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              class="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-subtle hover:bg-blue-600 hover:text-white transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Middle Side: Company -->
        <div class="flex flex-col gap-5 md:px-8">
          <h3 class="text-base font-semibold text-white">Company</h3>
          <ul class="flex flex-col gap-3 text-sm text-subtle">
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Company Profile</a
              >
            </li>
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Achievement</a
              >
            </li>
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Careers</a
              >
            </li>
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Contact Us</a
              >
            </li>
          </ul>
        </div>

        <!-- Right Side: Services -->
        <div class="flex flex-col gap-5">
          <h3 class="text-base font-semibold text-white">Services</h3>
          <ul class="flex flex-col gap-3 text-sm text-subtle">
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Check Document Status</a
              >
            </li>
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Guide Visa</a
              >
            </li>
            <li>
              <a
                href="#"
                class="hover:text-white hover:underline transition-colors"
                >Express Services</a
              >
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div
        class="mt-12 pt-6 border-t border-edge flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-subtle"
      >
        <p>
          &copy; {{ new Date().getFullYear() }} GudangVisa. All rights reserved.
        </p>
        <div class="flex gap-4">
          <a href="#" class="hover:text-white transition-colors"
            >Privacy Policy</a
          >
          <a href="#" class="hover:text-white transition-colors"
            >Terms of Service</a
          >
        </div>
      </div>
    </div>
  </footer>
</template>
