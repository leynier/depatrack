import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Property, PropertyFormData, PropertyFilters, PropertyStats, PropertySort, SortField, SortDirection } from '@/types/property';
import { PROPERTY_STATUS_LABELS } from '@/types/property';
import { StorageService } from '@/services/storage';

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref<Property[]>([]);
  const filters = ref<PropertyFilters>({});
  const sort = ref<PropertySort>({ field: 'zone', direction: 'asc' });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const storageService = StorageService.getInstance();

  const filteredProperties = computed(() => {
    let filtered = [...properties.value];

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      filtered = filtered.filter(property => 
        property.zone.toLowerCase().includes(searchTerm) ||
        property.requirements?.some(req => req.toLowerCase().includes(searchTerm)) ||
        property.comments?.toLowerCase().includes(searchTerm) ||
        property.price.toString().includes(searchTerm) ||
        property.status.toLowerCase().includes(searchTerm) ||
        property.link?.toLowerCase().includes(searchTerm) ||
        property.location?.toLowerCase().includes(searchTerm) ||
        property.whatsapp?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.value.minPrice !== undefined) {
      filtered = filtered.filter(property => property.price >= filters.value.minPrice!);
    }

    if (filters.value.maxPrice !== undefined) {
      filtered = filtered.filter(property => property.price <= filters.value.maxPrice!);
    }

    if (filters.value.statuses && filters.value.statuses.length > 0) {
      filtered = filtered.filter(property => 
        filters.value.statuses!.includes(property.status)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const { field, direction } = sort.value;
      let comparison = 0;

      switch (field) {
        case 'zone':
          comparison = a.zone.localeCompare(b.zone);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'status':
          const statusA = PROPERTY_STATUS_LABELS[a.status];
          const statusB = PROPERTY_STATUS_LABELS[b.status];
          comparison = statusA.localeCompare(statusB);
          break;
        case 'appointmentDate':
          const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
          const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  });

  const stats = computed((): PropertyStats => {
    const total = properties.value.length;
    const available = properties.value.filter(p => p.status === 'available').length;
    
    // Active: Properties I'm currently working on
    const active = properties.value.filter(p => 
      ['contacted', 'scheduled', 'visited', 'negotiating', 'in_queue', 'evaluating', 'applying', 'documents_pending'].includes(p.status)
    ).length;
    
    // Completed: Successfully approved or occupied by me
    const completed = properties.value.filter(p => 
      ['approved', 'occupied'].includes(p.status)
    ).length;
    
    // Rejected: Didn't work out for various reasons
    const rejected = properties.value.filter(p => 
      ['rejected', 'over_budget', 'not_interested'].includes(p.status)
    ).length;
    
    const averagePrice = total > 0 
      ? properties.value.reduce((sum, p) => sum + p.price, 0) / total 
      : 0;

    return {
      total,
      available,
      active,
      completed,
      rejected,
      averagePrice
    };
  });

  const hasActiveFilters = computed(() => {
    return !!(
      filters.value.search ||
      filters.value.minPrice !== undefined ||
      filters.value.maxPrice !== undefined ||
      (filters.value.statuses && filters.value.statuses.length > 0)
    );
  });

  function loadProperties(): void {
    try {
      isLoading.value = true;
      error.value = null;
      properties.value = storageService.getAllProperties();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load properties';
    } finally {
      isLoading.value = false;
    }
  }

  function createProperty(formData: PropertyFormData): Property {
    const property: Property = {
      id: crypto.randomUUID(),
      zone: formData.zone,
      price: formData.price || 0,
      status: formData.status,
      requirements: formData.requirements || [],
      comments: formData.comments || '',
      link: formData.link || '',
      location: formData.location || '',
      whatsapp: formData.whatsapp || '',
      appointmentDate: formData.appointmentDate || undefined,
      isCalendarScheduled: formData.isCalendarScheduled || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      storageService.saveProperty(property);
      properties.value.push(property);
      error.value = null;
      return property;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create property';
      throw err;
    }
  }

  function updateProperty(id: string, formData: PropertyFormData): Property {
    const existingProperty = properties.value.find(p => p.id === id);
    if (!existingProperty) {
      throw new Error('Property not found');
    }

    const updatedProperty: Property = {
      ...existingProperty,
      zone: formData.zone,
      price: formData.price || 0,
      status: formData.status,
      requirements: formData.requirements || [],
      comments: formData.comments || '',
      link: formData.link || '',
      location: formData.location || '',
      whatsapp: formData.whatsapp || '',
      appointmentDate: formData.appointmentDate || undefined,
      isCalendarScheduled: formData.isCalendarScheduled || false,
      updatedAt: new Date()
    };

    try {
      storageService.saveProperty(updatedProperty);
      const index = properties.value.findIndex(p => p.id === id);
      if (index >= 0) {
        properties.value[index] = updatedProperty;
      }
      error.value = null;
      return updatedProperty;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update property';
      throw err;
    }
  }

  function deleteProperty(id: string): void {
    try {
      storageService.deleteProperty(id);
      properties.value = properties.value.filter(p => p.id !== id);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete property';
      throw err;
    }
  }

  function getProperty(id: string): Property | undefined {
    return properties.value.find(p => p.id === id);
  }

  function setFilters(newFilters: PropertyFilters): void {
    filters.value = { ...newFilters };
  }

  function clearFilters(): void {
    filters.value = {};
  }

  function clearSearch(): void {
    filters.value = { ...filters.value, search: undefined };
  }

  function importProperties(newProperties: Property[]): void {
    try {
      storageService.importProperties(newProperties);
      properties.value = newProperties;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import properties';
      throw err;
    }
  }

  function addProperties(newProperties: Property[]): void {
    try {
      // Generate new IDs for imported properties to avoid conflicts
      const propertiesWithNewIds = newProperties.map(property => ({
        ...property,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Add to existing properties
      propertiesWithNewIds.forEach(property => {
        storageService.saveProperty(property);
        properties.value.push(property);
      });
      
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add properties';
      throw err;
    }
  }

  function exportProperties(): Property[] {
    return hasActiveFilters.value ? filteredProperties.value : properties.value;
  }

  function markCalendarScheduled(id: string): void {
    try {
      const property = properties.value.find(p => p.id === id);
      if (!property) {
        throw new Error('Property not found');
      }

      const updatedProperty: Property = {
        ...property,
        isCalendarScheduled: true,
        updatedAt: new Date()
      };

      storageService.saveProperty(updatedProperty);
      const index = properties.value.findIndex(p => p.id === id);
      if (index >= 0) {
        properties.value[index] = updatedProperty;
      }
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark calendar as scheduled';
      throw err;
    }
  }

  function setSortField(field: SortField): void {
    if (sort.value.field === field) {
      // Toggle direction if same field
      sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field with ascending direction
      sort.value = { field, direction: 'asc' };
    }
  }

  function setSortDirection(direction: SortDirection): void {
    sort.value.direction = direction;
  }

  return {
    properties: filteredProperties,
    allProperties: properties,
    filters,
    sort,
    isLoading,
    error,
    stats,
    hasActiveFilters,
    loadProperties,
    createProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    setFilters,
    clearFilters,
    clearSearch,
    importProperties,
    addProperties,
    exportProperties,
    markCalendarScheduled,
    setSortField,
    setSortDirection
  };
});