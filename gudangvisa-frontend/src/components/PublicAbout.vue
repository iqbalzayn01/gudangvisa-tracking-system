<script setup lang="ts">
// Public About Component - Updated with Master Logo
</script>

<template>
  <section id="about" class="bg-dark text-white py-24 border-t border-edge/50">
    <div class="max-w-7xl mx-auto px-6">
      <div
        class="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center"
      >
        <h2
          class="text-xs uppercase tracking-widest text-indigo-500 font-bold mb-4"
        >
          {{ $t("about.title") }}
        </h2>

        <div class="mb-6 class-logo-wrapper">
          <img
            src="/design/master-logo-2.png"
            alt="Gudang Visa Master Logo"
            class="max-h-28 w-auto object-contain drop-shadow-[0_4px_20px_rgba(225,29,72,0.15)]"
          />
        </div>

        <p
          class="text-3xl font-extrabold text-heading tracking-tight sm:text-4xl"
        >
          PT. Gudang Konsultan Indonesia
        </p>
        <p class="mt-4 text-base text-subtle leading-relaxed">
          {{ $t("about.subtitle") }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
        <div
          class="space-y-6 text-sm leading-relaxed text-body bg-panel border border-edge rounded-2xl p-8 shadow-md"
        >
          <p>
            {{ $t("about.description1") }}
          </p>
          <p>
            {{ $t("about.description2") }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <div
            class="bg-panel border-l-4 border-indigo-500 border-y border-r border-edge rounded-r-2xl rounded-l-md p-6 shadow-sm"
          >
            <h3
              class="text-lg font-bold text-heading mb-2 flex items-center gap-2"
            >
              <span class="text-indigo-500">🎯</span> {{ $t("about.vision") }}
            </h3>
            <p class="text-sm text-body leading-relaxed">
              {{ $t("about.vision_text") }}
            </p>
          </div>

          <div
            class="bg-panel border-l-4 border-indigo-500 border-y border-r border-edge rounded-r-2xl rounded-l-md p-6 shadow-sm"
          >
            <h3
              class="text-lg font-bold text-heading mb-2 flex items-center gap-2"
            >
              <span class="text-indigo-500">🚀</span> {{ $t("about.mission") }}
            </h3>
            <p class="text-sm text-body leading-relaxed">
              {{ $t("about.mission_text") }}
            </p>
          </div>
        </div>
      </div>

      <div class="border-t border-edge/30 pt-16">
        <h3 class="text-xl font-bold text-heading text-center mb-10">
          {{ $t("about.why_us") }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            class="bg-panel/40 border border-edge rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors duration-300 shadow-sm"
          >
            <div
              class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mx-auto mb-4 font-bold text-xl"
            >
              ✓
            </div>
            <h4 class="text-base font-semibold text-heading mb-2">
              {{ $t("about.trusted") }}
            </h4>
            <p class="text-xs text-subtle leading-relaxed">
              {{ $t("about.trusted_desc") }}
            </p>
          </div>

          <div
            class="bg-panel/40 border border-edge rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors duration-300 shadow-sm"
          >
            <div
              class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mx-auto mb-4 font-bold text-xl"
            >
              $
            </div>
            <h4 class="text-base font-semibold text-heading mb-2">
              {{ $t("about.price") }}
            </h4>
            <p class="text-xs text-subtle leading-relaxed">
              {{ $t("about.price_desc") }}
            </p>
          </div>

          <div
            class="bg-panel/40 border border-edge rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors duration-300 shadow-sm"
          >
            <div
              class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 mx-auto mb-4 font-bold text-xl"
            >
              ⚡
            </div>
            <h4 class="text-base font-semibold text-heading mb-2">
              {{ $t("about.fast") }}
            </h4>
            <p class="text-xs text-subtle leading-relaxed">
              {{ $t("about.fast_desc") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
