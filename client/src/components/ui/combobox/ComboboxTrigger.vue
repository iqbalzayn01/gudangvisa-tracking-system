<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxTrigger,
  type ComboboxTriggerProps,
  useForwardProps,
} from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '../../../lib/utils';

const props = defineProps<
  ComboboxTriggerProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <ComboboxTrigger
    v-bind="forwarded"
    tabindex="-1"
    :class="
      cn(
        'flex shrink-0 cursor-pointer items-center text-subtle outline-none transition-transform data-[state=open]:rotate-180',
        props.class,
      )
    "
  >
    <slot>
      <ChevronDown class="h-4 w-4 opacity-90" />
    </slot>
  </ComboboxTrigger>
</template>
