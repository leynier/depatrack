import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Property, PropertyFormData, PropertyFilters, PropertyStats } from '@/types/property';
import { StorageService } from '@/services/storage';

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref<Property[]>([]);
  const filters = ref<PropertyFilters>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const storageService = StorageService.getInstance();

  const filteredProperties = computed(() => {
    let filtered = [...properties.value];

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      filtered = filtered.filter(property => 
        property.zone.toLowerCase().includes(searchTerm) ||
        property.requirements?.toLowerCase().includes(searchTerm) ||
        property.comments?.toLowerCase().includes(searchTerm) ||
        property.price.toString().includes(searchTerm) ||
        property.status.toLowerCase().includes(searchTerm) ||
        property.link?.toLowerCase().includes(searchTerm) ||
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

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });

  const stats = computed((): PropertyStats => {
    const total = properties.value.length;
    const available = properties.value.filter(p => p.status === 'available').length;
    const inProcess = properties.value.filter(p => p.status === 'in_process').length;
    const occupied = properties.value.filter(p => p.status === 'occupied').length;
    
    const averagePrice = total > 0 
      ? properties.value.reduce((sum, p) => sum + p.price, 0) / total 
      : 0;

    return {
      total,
      available,
      inProcess,
      occupied,
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
      requirements: formData.requirements || '',
      comments: formData.comments || '',
      link: formData.link || '',
      whatsapp: formData.whatsapp || '',
      appointmentDate: formData.appointmentDate || undefined,
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
      requirements: formData.requirements || '',
      comments: formData.comments || '',
      link: formData.link || '',
      whatsapp: formData.whatsapp || '',
      appointmentDate: formData.appointmentDate || undefined,
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

  return {
    properties: filteredProperties,
    allProperties: properties,
    filters,
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
    exportProperties
  };
});