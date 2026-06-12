<template>
  <section id="services" class="py-24 px-6 border-t border-edge bg-transparent">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2
          class="text-3xl font-bold text-white mb-4 tracking-tight sm:text-4xl"
        >
          {{ $t("services.title") }}
        </h2>
        <p class="text-base text-subtle max-w-2xl mx-auto leading-relaxed">
          {{ $t("services.subtitle") }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5"
        >
          <div
            class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-2">
              {{ $t("services.visa.title") }}
            </h3>
            <p class="text-sm text-subtle leading-relaxed">
              {{ $t("services.visa.desc") }}
            </p>
          </div>
        </div>

        <div
          class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5"
        >
          <div
            class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              <rect width="20" height="14" x="2" y="6" rx="2" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-2">
              {{ $t("services.kitas.title") }}
            </h3>
            <p class="text-sm text-subtle leading-relaxed">
              {{ $t("services.kitas.desc") }}
            </p>
          </div>
        </div>

        <div
          class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5"
        >
          <div
            class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
              <circle cx="12" cy="11" r="2" />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-2">
              {{ $t("services.passport.title") }}
            </h3>
            <p class="text-sm text-subtle leading-relaxed">
              {{ $t("services.passport.desc") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
