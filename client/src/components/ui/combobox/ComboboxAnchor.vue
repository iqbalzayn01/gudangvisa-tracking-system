<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxAnchor,
  type ComboboxAnchorProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../../../lib/utils';

const props = defineProps<
  ComboboxAnchorProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <ComboboxAnchor
    v-bind="forwarded"
    :class="
      cn(
        'flex w-full items-center gap-2 rounded-lg border border-edge bg-panel-light px-3.5 py-2.5 text-sm text-heading transition-colors focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-500/12',
        props.class,
      )
    "
  >
    <slot />
  </ComboboxAnchor>
</template>
