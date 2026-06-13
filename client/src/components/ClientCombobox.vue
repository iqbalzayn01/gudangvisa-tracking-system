<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Search } from 'lucide-vue-next';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { useClientStore } from '../stores/client.store';
import type { Client } from '../types';

const props = withDefaults(
  defineProps<{
    /** Selected client id. */
    modelValue: string;
    /** Forwarded to the input so an external <label for> can target it. */
    id?: string;
    placeholder?: string;
  }>(),
  { placeholder: 'Search name, email, passport, or phone…' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const clientStore = useClientStore();

const searchTerm = ref('');

const clients = computed<Client[]>(() => clientStore.sortedClients);

// Same multi-field, case-insensitive match used on the Clients page so the
// selector can be filtered by name, email, passport, nationality, or phone.
const filteredClients = computed<Client[]>(() => {
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return clients.value;
  return clients.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.passportNumber ?? '').toLowerCase().includes(q) ||
      (c.nationality ?? '').toLowerCase().includes(q) ||
      (c.contactNumber ?? '').toLowerCase().includes(q),
  );
});

/** Secondary line shown under the name to disambiguate clients. */
function details(c: Client): string {
  return [c.passportNumber, c.email, c.contactNumber]
    .filter(Boolean)
    .join(' · ');
}

/** Render the selected client's name in the input (input value is the id). */
function displayValue(value: unknown): string {
  return clients.value.find((c) => c.id === value)?.name ?? '';
}

onMounted(() => {
  if (!clientStore.hasFetched) clientStore.fetchAll();
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Combobox
      :model-value="props.modelValue"
      :ignore-filter="true"
      :open-on-focus="true"
      :open-on-click="true"
      @update:model-value="emit('update:modelValue', ($event as string) ?? '')"
    >
      <ComboboxAnchor>
        <Search class="h-4 w-4 shrink-0 text-subtle" />
        <ComboboxInput
          :id="props.id"
          v-model="searchTerm"
          :display-value="displayValue"
          :placeholder="props.placeholder"
        />
        <ComboboxTrigger />
      </ComboboxAnchor>

      <ComboboxList>
        <template v-if="filteredClients.length">
          <ComboboxItem
            v-for="c in filteredClients"
            :key="c.id"
            :value="c.id"
            :text-value="c.name"
          >
            <span class="flex flex-col gap-0.5">
              <span class="font-medium text-heading">{{ c.name }}</span>
              <span v-if="details(c)" class="text-xs text-subtle">
                {{ details(c) }}
              </span>
            </span>
          </ComboboxItem>
        </template>
        <ComboboxEmpty v-else>No clients match your search.</ComboboxEmpty>
      </ComboboxList>
    </Combobox>

    <p
      v-if="clientStore.hasFetched && clients.length === 0"
      class="text-xs text-amber-400"
    >
      No clients found.
      <router-link to="/clients" class="underline">Create one first</router-link
      >.
    </p>
  </div>
</template>
