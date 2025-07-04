# Vue 3 + TypeScript Development Patterns

## Component Structure

Always use the Composition API with `<script setup lang="ts">` syntax.

### Component Template

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

const localValue = ref('')

const displayText = computed(() => {
  return `${props.title}: ${props.count}`
})
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <h2 class="text-lg font-semibold text-foreground">
      {{ displayText }}
    </h2>
  </div>
</template>
```

## TypeScript Guidelines

- **Use strict TypeScript mode** - no `any` types allowed
- **Define interfaces** in separate files when shared across components
- **Prefer `interface` over `type`** for object shapes
- **Use explicit return types** for functions and composables
- **Type reactive refs** with `ref<Type>()` syntax
- **Use union types** for specific string values (e.g., `'light' | 'dark'`)

## Composables Pattern

- Start composable names with `use` prefix (e.g., `useProperties`, `useTheme`)
- Return reactive references and functions
- Keep composables focused on single responsibility
- Document complex composables with JSDoc comments

Example composable:

```typescript
export function useProperties() {
  const properties = ref<Property[]>([])
  const isLoading = ref(false)

  const addProperty = (property: PropertyFormData): void => {
    // Implementation
  }

  return {
    properties: readonly(properties),
    isLoading: readonly(isLoading),
    addProperty
  }
}
```

## Component Best Practices

- Use `computed` properties over methods for reactive data
- Implement proper cleanup in `onUnmounted` for event listeners
- Use `shallowRef` for large objects when deep reactivity isn't needed
- Prefer `v-show` over `v-if` for frequently toggled elements
- Always provide `key` attributes in `v-for` loops
