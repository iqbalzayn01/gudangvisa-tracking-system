<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Globe,
  Briefcase,
  IdCard,
  ShieldCheck,
  DollarSign,
  Zap,
  Target,
  Rocket,
  LogIn,
  ChevronDown,
} from 'lucide-vue-next';
import PublicNavbar from '../components/PublicNavbar.vue';
import PublicFooter from '../components/PublicFooter.vue';

const { t, tm, rt } = useI18n();
const route = useRoute();
const router = useRouter();

interface Card {
  title: string;
  desc: string;
}

const serviceCards = computed(() => tm('services.items') as unknown as Card[]);
const faqItems = computed(
  () => tm('faq.items') as unknown as { q: string; a: string }[],
);
const aboutBody = computed(() => tm('about.body') as unknown as string[]);
const whyUsCards = computed(() => tm('whyUs.items') as unknown as Card[]);

const serviceIcons = [Globe, Briefcase, IdCard];
const whyUsIcons = [ShieldCheck, DollarSign, Zap];

function goToLogin() {
  router.push('/portal/login');
}

// ── FAQ accordion ──────────────────────────────────────────────────────────
const openFaq = ref<number | null>(0);
function toggleFaq(i: number) {
  openFaq.value = openFaq.value === i ? null : i;
}

// Honor #section deep-links on load (e.g. /portal#faq).
onMounted(async () => {
  const hash = route.hash?.replace('#', '');
  if (hash) {
    await nextTick();
    document
      .getElementById(hash)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
</script>

<template>
  <div id="top" class="min-h-screen flex flex-col bg-dark">
    <PublicNavbar />

    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <header class="relative">
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/design/background-public-tracking.png')"
      />
      <div class="absolute inset-0 bg-black/70" />

      <div
        class="relative max-w-3xl mx-auto px-6 pt-44 pb-32 flex flex-col items-center text-center"
      >
        <div class="flex items-center gap-2.5 mb-8">
          <img
            src="/design/logo-square.png"
            alt="Gudang Visa Logo"
            width="40"
            height="40"
          />
          <span class="text-xl font-bold text-white tracking-wide">{{
            t('hero.brand')
          }}</span>
        </div>

        <h1
          class="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
        >
          {{ t('hero.title') }}
        </h1>
        <p
          class="text-base md:text-lg text-white/80 max-w-xl mb-10 leading-relaxed"
        >
          {{ t('hero.subtitle') }}
        </p>

        <Button
          type="button"
          class="inline-flex items-center justify-center cursor-pointer gap-2.5 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-colors shadow-lg shadow-red-500/20 h-auto"
          @click="goToLogin"
        >
          <LogIn :size="20" />
          {{ t('tracking.cta') }}
        </Button>
        <p class="text-sm text-white/60 max-w-md mt-5 leading-relaxed">
          {{ t('tracking.note') }}
        </p>
      </div>
    </header>

    <!-- ── Services ──────────────────────────────────────────────────── -->
    <section id="layanan" class="max-w-6xl mx-auto px-6 py-28 w-full">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-heading mb-4">
          {{ t('services.title') }}
        </h2>
        <p class="text-subtle leading-relaxed">{{ t('services.subtitle') }}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="(card, i) in serviceCards"
          :key="i"
          class="bg-panel border border-edge rounded-2xl p-8 flex flex-col gap-5 transition-colors hover:border-red-500/40"
        >
          <div
            class="w-12 h-12 rounded-xl bg-red-500/12 text-red-400 flex items-center justify-center"
          >
            <component :is="serviceIcons[i]" :size="24" />
          </div>
          <h3 class="text-lg font-bold text-heading">{{ rt(card.title) }}</h3>
          <p class="text-sm text-subtle leading-relaxed">{{ rt(card.desc) }}</p>
        </div>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────────────────────── -->
    <section id="faq" class="max-w-3xl mx-auto px-6 py-28 w-full">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-heading mb-4">
          {{ t('faq.title') }}
        </h2>
        <p class="text-subtle leading-relaxed">{{ t('faq.subtitle') }}</p>
      </div>
      <div class="flex flex-col gap-4">
        <div
          v-for="(item, i) in faqItems"
          :key="i"
          class="bg-panel border border-edge rounded-2xl overflow-hidden transition-colors"
          :class="{ 'border-red-500/40': openFaq === i }"
        >
          <Button
            variant="ghost"
            type="button"
            class="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer h-auto rounded-full"
            @click="toggleFaq(i)"
          >
            <span class="font-semibold text-heading">{{ rt(item.q) }}</span>
            <ChevronDown
              :size="20"
              class="text-subtle shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': openFaq === i }"
            />
          </Button>
          <div
            v-show="openFaq === i"
            class="px-6 pb-6 text-sm text-subtle leading-relaxed"
          >
            {{ rt(item.a) }}
          </div>
        </div>
      </div>
    </section>

    <!-- ── About ─────────────────────────────────────────────────────── -->
    <section id="tentang" class="max-w-6xl mx-auto px-6 py-28 w-full">
      <div class="flex flex-col items-center text-center mb-16">
        <span class="text-xs font-bold tracking-[0.2em] text-red-400 mb-5">
          {{ t('about.eyebrow') }}
        </span>
        <img
          src="/design/master-logo-2.png"
          alt="Gudang Visa"
          class="h-28 w-auto mb-8 rounded-xl"
        />
        <h2 class="text-3xl md:text-4xl font-bold text-heading mb-4">
          {{ t('about.company') }}
        </h2>
        <p class="text-subtle max-w-xl leading-relaxed">
          {{ t('about.tagline') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <!-- Story -->
        <div
          class="bg-panel border border-edge rounded-2xl p-8 flex flex-col gap-5"
        >
          <p
            v-for="(para, i) in aboutBody"
            :key="i"
            class="text-sm text-body leading-relaxed"
          >
            {{ para }}
          </p>
        </div>

        <!-- Vision / Mission -->
        <div class="flex flex-col gap-6">
          <div
            class="bg-panel border-l-4 border-red-500 border border-edge rounded-2xl p-7"
          >
            <h3
              class="flex items-center gap-2 text-base font-bold text-heading mb-3"
            >
              <Target :size="20" class="text-red-400" />
              {{ t('about.visionTitle') }}
            </h3>
            <p class="text-sm text-subtle leading-relaxed">
              {{ t('about.vision') }}
            </p>
          </div>
          <div
            class="bg-panel border-l-4 border-red-500 border border-edge rounded-2xl p-7"
          >
            <h3
              class="flex items-center gap-2 text-base font-bold text-heading mb-3"
            >
              <Rocket :size="20" class="text-red-400" />
              {{ t('about.missionTitle') }}
            </h3>
            <p class="text-sm text-subtle leading-relaxed">
              {{ t('about.mission') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Why us ────────────────────────────────────────────────────── -->
    <section class="max-w-6xl mx-auto px-6 py-28 w-full">
      <h2 class="text-3xl md:text-4xl font-bold text-heading text-center mb-16">
        {{ t('whyUs.title') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="(card, i) in whyUsCards"
          :key="i"
          class="bg-panel border border-edge rounded-2xl p-8 flex flex-col items-center text-center gap-5"
        >
          <div
            class="w-14 h-14 rounded-xl bg-red-500/12 text-red-400 flex items-center justify-center"
          >
            <component :is="whyUsIcons[i]" :size="26" />
          </div>
          <h3 class="text-lg font-bold text-heading">{{ rt(card.title) }}</h3>
          <p class="text-sm text-subtle leading-relaxed">{{ rt(card.desc) }}</p>
        </div>
      </div>
    </section>

    <PublicFooter />
  </div>
</template>
