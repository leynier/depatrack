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

const switchClasses = computed(() => [
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
  {
    'bg-primary': props.checked && !props.disabled,
    'bg-input border-2 border-border': !props.checked && !props.disabled,
    'opacity-50 cursor-not-allowed': props.disabled,
    'cursor-pointer': !props.disabled
  }
]);

const thumbClasses = computed(() => [
  'inline-block h-4 w-4 transform rounded-full transition-transform shadow-sm',
  {
    'translate-x-6 bg-primary-foreground': props.checked,
    'translate-x-1 bg-background border border-border': !props.checked
  }
]);

function handleClick() {
  if (!props.disabled) {
    emit('update:checked', !props.checked);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.key === ' ' || event.key === 'Enter') && !props.disabled) {
    event.preventDefault();
    emit('update:checked', !props.checked);
  }
}
</script>

<template>
  <button
    :id="props.id"
    type="button"
    :class="switchClasses"
    :disabled="props.disabled"
    :aria-checked="props.checked"
    role="switch"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <span :class="thumbClasses" />
  </button>
</template>