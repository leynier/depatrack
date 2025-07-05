import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Property, PropertyFormData, PropertyFilters, PropertyStats, PropertySort, SortField, SortDirection } from '@/types/property';
import { PROPERTY_STATUS_LABELS } from '@/types/property';
import { StorageService } from '@/services/storage';
import { FirestoreService } from '@/services/firestore';
import { useAuthStore } from '@/stores/auth';
import { useNetworkStatus } from '@/composables/useNetworkStatus';

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref<Property[]>([]);
  const filters = ref<PropertyFilters>({});
  const sort = ref<PropertySort>({ field: 'zone', direction: 'asc' });
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isSyncing = ref(false);
  const lastSyncTime = ref<Date | null>(null);

  const storageService = StorageService.getInstance();
  const firestoreService = FirestoreService.getInstance();
  const authStore = useAuthStore();
  const { isOnline } = useNetworkStatus();

  let unsubscribeFromFirestore: (() => void) | null = null;

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
          // Empty zones go to the end
          if (!a.zone && !b.zone) return 0;
          if (!a.zone) return 1;
          if (!b.zone) return -1;
          comparison = a.zone.localeCompare(b.zone);
          break;
        case 'price':
          // Zero or null prices go to the end
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          if (priceA === 0 && priceB === 0) return 0;
          if (priceA === 0) return 1;
          if (priceB === 0) return -1;
          comparison = priceA - priceB;
          break;
        case 'status':
          // Empty status go to the end
          if (!a.status && !b.status) return 0;
          if (!a.status) return 1;
          if (!b.status) return -1;
          const statusA = PROPERTY_STATUS_LABELS[a.status];
          const statusB = PROPERTY_STATUS_LABELS[b.status];
          comparison = statusA.localeCompare(statusB);
          break;
        case 'appointmentDate':
          // Null dates go to the end
          if (!a.appointmentDate && !b.appointmentDate) return 0;
          if (!a.appointmentDate) return 1;
          if (!b.appointmentDate) return -1;
          const dateA = new Date(a.appointmentDate).getTime();
          const dateB = new Date(b.appointmentDate).getTime();
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
      
      // Always load from localStorage first for immediate UI response
      properties.value = storageService.getAllProperties();
      
      // Assign UUIDs to existing properties that don't have them
      assignUuidsToExistingProperties();
      
      // If user is authenticated and online, sync with Firebase
      if (authStore.isAuthenticated && isOnline.value) {
        syncWithFirebase();
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load properties';
    } finally {
      isLoading.value = false;
    }
  }

  async function syncWithFirebase(): Promise<void> {
    if (!authStore.user || !isOnline.value) return;
    
    try {
      isSyncing.value = true;
      
      // Get Firebase properties
      const firebaseProperties = await firestoreService.getUserProperties(authStore.user.uid);
      
      // If Firebase is empty but we have local properties, migrate them
      if (firebaseProperties.length === 0 && properties.value.length > 0) {
        console.log('Migrating local properties to Firebase...');
        await migrateLocalPropertiesToFirebase();
      }
      
      // Get updated Firebase properties after migration
      const updatedFirebaseProperties = await firestoreService.getUserProperties(authStore.user.uid);
      
      // Merge with local properties, preferring newer ones
      const mergedProperties = await mergeProperties(properties.value, updatedFirebaseProperties);
      
      // Update both local and Firebase storage
      properties.value = mergedProperties;
      storageService.importProperties(mergedProperties);
      
      // Subscribe to real-time updates
      subscribeToFirebaseUpdates();
      
      lastSyncTime.value = new Date();
    } catch (err) {
      console.error('Firebase sync failed:', err);
      // Continue with local data on sync failure
    } finally {
      isSyncing.value = false;
    }
  }

  function subscribeToFirebaseUpdates(): void {
    if (!authStore.user || unsubscribeFromFirestore) return;
    
    unsubscribeFromFirestore = firestoreService.subscribeToUserProperties(
      authStore.user.uid,
      async (firebaseProperties) => {
        // Update local properties with Firebase changes
        const mergedProperties = await mergeProperties(properties.value, firebaseProperties);
        properties.value = mergedProperties;
        storageService.importProperties(mergedProperties);
      }
    );
  }

  async function migrateLocalPropertiesToFirebase(): Promise<void> {
    if (!authStore.user) return;
    
    const localProperties = properties.value;
    for (const property of localProperties) {
      try {
        // Assign UUID if property doesn't have one (for backward compatibility)
        if (!property.uuid) {
          property.uuid = crypto.randomUUID();
          storageService.saveProperty(property); // Update localStorage with UUID
        }
        
        const formData: PropertyFormData = {
          zone: property.zone,
          price: property.price,
          status: property.status,
          requirements: property.requirements,
          comments: property.comments,
          link: property.link,
          location: property.location,
          whatsapp: property.whatsapp,
          appointmentDate: property.appointmentDate,
          isCalendarScheduled: property.isCalendarScheduled
        };
        
        await firestoreService.createProperty(authStore.user.uid, formData, property.uuid);
        console.log(`Migrated property: ${property.zone} (UUID: ${property.uuid})`);
      } catch (error) {
        console.error(`Failed to migrate property ${property.id}:`, error);
      }
    }
  }

  async function mergeProperties(localProps: Property[], firebaseProps: Property[]): Promise<Property[]> {
    const merged = new Map<string, Property>();
    
    // Get deleted properties to filter them out
    let deletedUuids = new Set<string>();
    if (authStore.user) {
      try {
        const deletedProperties = await firestoreService.getDeletedProperties(authStore.user.uid);
        deletedUuids = new Set(deletedProperties.map(d => d.uuid));
      } catch (error) {
        console.error('Failed to get deleted properties:', error);
      }
    }
    
    // Add local properties (keyed by UUID for proper sync)
    localProps.forEach(prop => {
      // Skip deleted properties
      if (deletedUuids.has(prop.uuid)) {
        return;
      }
      
      // Assign UUID if missing (backward compatibility)
      if (!prop.uuid) {
        prop.uuid = crypto.randomUUID();
        storageService.saveProperty(prop);
      }
      merged.set(prop.uuid, prop);
    });
    
    // Add/update with Firebase properties (prefer newer ones)
    firebaseProps.forEach(prop => {
      // Skip deleted properties
      if (deletedUuids.has(prop.uuid)) {
        return;
      }
      
      const existing = merged.get(prop.uuid);
      if (!existing || prop.updatedAt > existing.updatedAt) {
        merged.set(prop.uuid, prop);
      }
    });
    
    return Array.from(merged.values());
  }

  async function createProperty(formData: PropertyFormData): Promise<Property> {
    try {
      error.value = null;
      
      // Generate unique UUID for sync across devices
      const propertyUuid = crypto.randomUUID();
      
      // Create property locally first
      const property: Property = {
        id: crypto.randomUUID(), // Local storage ID
        uuid: propertyUuid, // Sync UUID across devices
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

      // Save locally first
      storageService.saveProperty(property);
      properties.value.push(property);
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value) {
        try {
          await firestoreService.createProperty(authStore.user!.uid, formData, propertyUuid);
        } catch (firebaseError) {
          console.error('Firebase create failed:', firebaseError);
          // Continue with local storage - sync will handle it later
        }
      }
      
      return property;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create property';
      throw err;
    }
  }

  async function updateProperty(id: string, formData: PropertyFormData): Promise<Property> {
    const existingProperty = properties.value.find(p => p.id === id);
    if (!existingProperty) {
      throw new Error('Property not found');
    }

    // Assign UUID if property doesn't have one (backward compatibility)
    if (!existingProperty.uuid) {
      existingProperty.uuid = crypto.randomUUID();
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
      // Update locally first
      storageService.saveProperty(updatedProperty);
      const index = properties.value.findIndex(p => p.id === id);
      if (index >= 0) {
        properties.value[index] = updatedProperty;
      }
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value && updatedProperty.uuid) {
        try {
          // Find Firebase property by UUID to get the correct Firestore document ID
          const firebaseProperty = await firestoreService.getPropertyByUuid(authStore.user!.uid, updatedProperty.uuid);
          if (firebaseProperty) {
            await firestoreService.updateProperty(firebaseProperty.id, formData);
          }
        } catch (firebaseError) {
          console.error('Firebase update failed:', firebaseError);
          // Continue with local storage - sync will handle it later
        }
      }
      
      error.value = null;
      return updatedProperty;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update property';
      throw err;
    }
  }

  async function deleteProperty(id: string): Promise<void> {
    try {
      const property = properties.value.find(p => p.id === id);
      if (!property) {
        throw new Error('Property not found');
      }
      
      // Delete locally first
      storageService.deleteProperty(id);
      properties.value = properties.value.filter(p => p.id !== id);
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value && property.uuid) {
        try {
          // Find Firebase property by UUID to get the correct Firestore document ID
          const firebaseProperty = await firestoreService.getPropertyByUuid(authStore.user!.uid, property.uuid);
          if (firebaseProperty) {
            await firestoreService.deleteProperty(firebaseProperty.id, property.uuid, authStore.user!.uid);
          }
        } catch (firebaseError) {
          console.error('Firebase delete failed:', firebaseError);
          // Continue with local deletion - sync will handle it later
        }
      }
      
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
      // Ensure all imported properties have UUIDs
      const propertiesWithUuids = newProperties.map(property => ({
        ...property,
        uuid: property.uuid || crypto.randomUUID(),
        updatedAt: new Date()
      }));
      
      storageService.importProperties(propertiesWithUuids);
      properties.value = propertiesWithUuids;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import properties';
      throw err;
    }
  }

  function addProperties(newProperties: Property[]): void {
    try {
      // Generate new IDs and UUIDs for imported properties to avoid conflicts
      const propertiesWithNewIds = newProperties.map(property => ({
        ...property,
        id: crypto.randomUUID(),
        uuid: property.uuid || crypto.randomUUID(), // Keep existing UUID or generate new one
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

  async function markCalendarScheduled(id: string): Promise<void> {
    try {
      const property = properties.value.find(p => p.id === id);
      if (!property) {
        throw new Error('Property not found');
      }

      // Assign UUID if property doesn't have one (backward compatibility)
      if (!property.uuid) {
        property.uuid = crypto.randomUUID();
      }

      const updatedProperty: Property = {
        ...property,
        isCalendarScheduled: true,
        updatedAt: new Date()
      };

      // Update locally first
      storageService.saveProperty(updatedProperty);
      const index = properties.value.findIndex(p => p.id === id);
      if (index >= 0) {
        properties.value[index] = updatedProperty;
      }
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value && updatedProperty.uuid) {
        try {
          // Find Firebase property by UUID to get the correct Firestore document ID
          const firebaseProperty = await firestoreService.getPropertyByUuid(authStore.user!.uid, updatedProperty.uuid);
          if (firebaseProperty) {
            await firestoreService.markCalendarScheduled(firebaseProperty.id);
          }
        } catch (firebaseError) {
          console.error('Firebase calendar update failed:', firebaseError);
          // Continue with local update - sync will handle it later
        }
      }
      
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark calendar as scheduled';
      throw err;
    }
  }

  function assignUuidsToExistingProperties(): void {
    let hasChanges = false;
    
    properties.value.forEach(property => {
      if (!property.uuid) {
        property.uuid = crypto.randomUUID();
        property.updatedAt = new Date();
        storageService.saveProperty(property);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      console.log('Assigned UUIDs to existing properties without UUID');
    }
  }

  function cleanup(): void {
    if (unsubscribeFromFirestore) {
      unsubscribeFromFirestore();
      unsubscribeFromFirestore = null;
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
    isSyncing,
    lastSyncTime,
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
    setSortDirection,
    syncWithFirebase,
    assignUuidsToExistingProperties,
    cleanup
  };
});