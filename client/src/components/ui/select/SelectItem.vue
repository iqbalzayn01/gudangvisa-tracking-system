<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectItem,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
  useForwardProps,
} from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../lib/utils';

const props = defineProps<SelectItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <SelectItem
    v-bind="forwarded"
    :class="
      cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-[13px] text-body outline-none transition-colors data-[highlighted]:bg-panel-light data-[highlighted]:text-heading data-[state=checked]:font-medium data-[state=checked]:text-heading data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <span class="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4 text-red-400" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
