<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  ComboboxItem,
  type ComboboxItemEmits,
  ComboboxItemIndicator,
  type ComboboxItemProps,
  useForwardPropsEmits,
} from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../lib/utils';

const props = defineProps<
  ComboboxItemProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<ComboboxItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxItem
    v-bind="forwarded"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-[13px] text-body outline-none transition-colors data-[highlighted]:bg-panel-light data-[highlighted]:text-heading data-[state=checked]:text-heading data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
      <ComboboxItemIndicator>
        <Check class="h-4 w-4 text-red-400" />
      </ComboboxItemIndicator>
    </span>
    <slot />
  </ComboboxItem>
</template>
