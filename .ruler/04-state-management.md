# State Management with Pinia

## Store Structure

Use Composition API syntax with `defineStore` and keep stores focused on single domains.

### Store Pattern Template

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePropertiesStore = defineStore('properties', () => {
  // State
  const properties = ref<Property[]>([])
  const filters = ref<PropertyFilters>({})
  const isLoading = ref(false)

  // Getters (computed values)
  const filteredProperties = computed(() => {
    return applyFilters(properties.value, filters.value)
  })

  const hasActiveFilters = computed(() => {
    return Object.keys(filters.value).length > 0
  })

  // Actions
  function addProperty(property: PropertyFormData): void {
    const newProperty: Property = {
      id: generateId(),
      ...property,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    properties.value.push(newProperty)
    saveToLocalStorage()
    syncToCloud() // Sync to Firebase if user is authenticated
  }

  function updateProperty(id: string, updates: Partial<PropertyFormData>): void {
    const index = properties.value.findIndex(p => p.id === id)
    if (index !== -1) {
      properties.value[index] = {
        ...properties.value[index],
        ...updates,
        updatedAt: new Date()
      }
      saveToLocalStorage()
      syncToCloud() // Sync to Firebase if user is authenticated
    }
  }

  return {
    // State
    properties,
    filters,
    isLoading,
    // Getters
    filteredProperties,
    hasActiveFilters,
    // Actions
    addProperty,
    updateProperty
  }
})
```

## Store Guidelines

- **Use `ref()` for mutable state** that needs to trigger reactivity
- **Use `computed()` for derived state** based on other reactive values
- **Keep actions pure when possible** - avoid side effects in getters
- **Handle errors gracefully** in store actions with try/catch blocks
- **Use consistent naming** conventions for state, getters, and actions

## Data Persistence

- **Local-first architecture** with localStorage as primary storage for offline access
- **Optional cloud synchronization** via Firebase when user is authenticated
- **Handle serialization/deserialization** properly for Date objects
- **Provide fallbacks for corrupted data** with validation
- **Use debounced saving** for frequent updates to avoid performance issues
- **Graceful offline/online state handling** with automatic sync when connection restored
- **Clear invalid data gracefully** when localStorage quota is exceeded

## Error Handling

```typescript
// Good: Proper error handling in actions with local-first approach
async function loadProperties(): Promise<void> {
  try {
    isLoading.value = true
    // Load from localStorage first for immediate access
    const localData = localStorage.getItem('properties')
    if (localData) {
      properties.value = JSON.parse(localData)
    }
    // Sync with cloud if user is authenticated (background operation)
    await syncFromCloud()
  } catch (error) {
    console.error('Failed to load properties:', error)
    // Reset to empty state on error
    properties.value = []
  } finally {
    isLoading.value = false
  }
}
```
