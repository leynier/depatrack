<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  checked?: boolean;
  disabled?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  checked: false,
  disabled: false
});

const emit = defineEmits<{
  'update:checked': [value: boolean];
}>();

const checkboxClasses = computed(() => [
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground': props.checked && !props.disabled,
    'bg-background': !props.checked && !props.disabled,
    'opacity-50 cursor-not-allowed': props.disabled,
    'cursor-pointer': !props.disabled
  }
]);

function handleChange(event: Event) {
  if (!props.disabled) {
    const target = event.target as HTMLInputElement;
    emit('update:checked', target.checked);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.key === ' ') && !props.disabled) {
    event.preventDefault();
    emit('update:checked', !props.checked);
  }
}
</script>

<template>
  <input
    :id="props.id"
    type="checkbox"
    :checked="props.checked"
    :disabled="props.disabled"
    :class="checkboxClasses"
    @change="handleChange"
    @keydown="handleKeyDown"
  />
</template>