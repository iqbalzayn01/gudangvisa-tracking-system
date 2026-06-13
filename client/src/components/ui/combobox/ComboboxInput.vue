<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxInput,
  type ComboboxInputEmits,
  type ComboboxInputProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../../../lib/utils';

const props = defineProps<
  ComboboxInputProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<ComboboxInputEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxInput
    v-bind="forwarded"
    :class="
      cn(
        'flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
