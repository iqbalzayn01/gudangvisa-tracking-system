<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxEmpty,
  type ComboboxEmptyProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '../../../lib/utils';

const props = defineProps<
  ComboboxEmptyProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <ComboboxEmpty
    v-bind="forwarded"
    :class="
      cn('py-4 text-center text-[13px] text-subtle', props.class)
    "
  >
    <slot />
  </ComboboxEmpty>
</template>
