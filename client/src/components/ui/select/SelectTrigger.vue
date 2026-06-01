<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectIcon,
  SelectTrigger,
  type SelectTriggerProps,
  useForwardProps,
} from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '../../../lib/utils';

const props = defineProps<
  SelectTriggerProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwarded"
    :class="
      cn(
        'flex h-9 items-center justify-between gap-2 whitespace-nowrap rounded-full border border-edge bg-panel-light px-3.5 py-2 text-[13px] text-heading outline-none transition-colors cursor-pointer focus:border-red-500 focus:ring-3 focus:ring-red-500/12 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-subtle [&>span]:truncate',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 shrink-0 text-subtle opacity-90" />
    </SelectIcon>
  </SelectTrigger>
</template>
