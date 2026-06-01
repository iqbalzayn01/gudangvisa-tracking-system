<script setup lang="ts" generic="T extends string = string">
import { computed, type HTMLAttributes } from 'vue';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select';

const props = defineProps<{
  modelValue: T;
  options: { label: string; value: T }[];
  /** Label for the "no filter" (empty value) entry, e.g. "All Statuses". */
  allLabel?: string;
  placeholder?: string;
  triggerClass?: HTMLAttributes['class'];
}>();

const emit = defineEmits<{ 'update:modelValue': [value: T] }>();

// reka-ui (shadcn) Select items cannot use an empty string value, so the
// "all / no filter" choice is represented internally by a sentinel and mapped
// back to '' for the parent — keeping the existing filter logic unchanged.
const ALL = '__all__';

const inner = computed<string>({
  get: () => (props.modelValue === '' ? ALL : props.modelValue),
  set: (value) => emit('update:modelValue', (value === ALL ? '' : value) as T),
});
</script>

<template>
  <Select v-model="inner">
    <SelectTrigger :class="triggerClass">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-if="allLabel" :value="ALL">{{ allLabel }}</SelectItem>
      <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
