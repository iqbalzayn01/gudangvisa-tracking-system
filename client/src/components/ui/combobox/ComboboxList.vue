<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxContent,
  type ComboboxContentEmits,
  type ComboboxContentProps,
  ComboboxPortal,
  ComboboxViewport,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '../../../lib/utils';

const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  { position: 'popper' },
);
const emits = defineEmits<ComboboxContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxPortal>
    <ComboboxContent
      v-bind="forwarded"
      :side-offset="4"
      :class="
        cn(
          'relative z-50 max-h-72 min-w-[var(--reka-combobox-trigger-width)] overflow-hidden rounded-xl border border-edge bg-panel text-heading shadow-lg shadow-black/20',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          props.class,
        )
      "
    >
      <ComboboxViewport class="max-h-72 overflow-y-auto p-1">
        <slot />
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxPortal>
</template>
