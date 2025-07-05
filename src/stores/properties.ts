import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { useUserSettings } from '@/composables/useUserSettings';
import { analyticsService } from '@/services/analytics';
import { FirestoreService } from '@/services/firestore';
import { StorageService } from '@/services/storage';
import { useAuthStore } from '@/stores/auth';
import type { Property, PropertyFilters, PropertyFormData, PropertyStats, SortDirection, SortField, DeletedPropertyRecord } from '@/types/property';
import { PROPERTY_STATUS_LABELS } from '@/types/property';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const usePropertiesStore = defineStore('properties', () => {
  const properties = ref<Property[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isSyncing = ref(false);
  const lastSyncTime = ref<Date | null>(null);

  const storageService = StorageService.getInstance();
  const firestoreService = FirestoreService.getInstance();
  const authStore = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const userSettings = useUserSettings();

  // Get filters and sort from user settings
  const filters = computed(() => userSettings.filters());
  const sort = computed(() => userSettings.sort());

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
      const syncStartTime = Date.now();
      analyticsService.logSyncStart();

      const userId = authStore.user.uid;
      const localProperties = storageService.getAllProperties();
      const localDeletedUuids = storageService.getDeletedPropertyUuids();

      // 1. Download changes from Firestore
      let firebaseProperties: Property[] = [];
      let firebaseDeletedRecords: DeletedPropertyRecord[] = [];

      if (lastSyncTime.value) {
        // Incremental sync
        firebaseProperties = await firestoreService.getPropertiesModifiedSince(userId, lastSyncTime.value);
        firebaseDeletedRecords = await firestoreService.getDeletedPropertiesModifiedSince(userId, lastSyncTime.value);
      } else {
        // Full sync on first run or after a long time
        firebaseProperties = await firestoreService.getUserProperties(userId);
        firebaseDeletedRecords = await firestoreService.getDeletedProperties(userId);
      }

      // 2. Merge Firebase changes into local data
      const mergedProperties = await mergeProperties(localProperties, firebaseProperties);
      const finalProperties = applyFirebaseDeletions(mergedProperties, firebaseDeletedRecords);

      // 3. Identify local changes to upload
      const { newLocal, updatedLocal, deletedLocal } = identifyLocalChanges(
        localProperties,
        finalProperties, // Use finalProperties as the base for comparison
        localDeletedUuids
      );

      // 4. Upload local changes to Firestore
      if (newLocal.length > 0) {
        console.log(`Uploading ${newLocal.length} new local properties.`);
        await firestoreService.batchCreateProperties(userId, newLocal);
      }
      if (updatedLocal.length > 0) {
        console.log(`Uploading ${updatedLocal.length} updated local properties.`);
        await firestoreService.batchUpdateProperties(userId, updatedLocal);
      }
      if (deletedLocal.length > 0) {
        console.log(`Uploading ${deletedLocal.length} deleted local properties.`);
        await firestoreService.batchDeleteProperties(deletedLocal, userId);
      }

      // 5. Update local storage with the reconciled data
      properties.value = finalProperties;
      storageService.importProperties(finalProperties);
      storageService.clearDeletedPropertyUuids(); // Clear local deleted records after successful sync

      // 6. Subscribe to real-time updates (if not already subscribed)
      subscribeToFirebaseUpdates();

      lastSyncTime.value = new Date();

      // Log successful sync
      const syncDuration = Date.now() - syncStartTime;
      analyticsService.logSyncComplete(syncDuration, properties.value.length);
    } catch (err) {
      console.error('Firebase sync failed:', err);
      analyticsService.logSyncError(err instanceof Error ? err.message : 'Unknown sync error');
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
        // When real-time updates come in, merge them with current local state
        // and apply any deletions that might have occurred remotely.
        const localProperties = storageService.getAllProperties();
        const firebaseDeletedRecords = await firestoreService.getDeletedProperties(authStore.user!.uid);

        const merged = await mergeProperties(localProperties, firebaseProperties);
        const final = applyFirebaseDeletions(merged, firebaseDeletedRecords);

        properties.value = final;
        storageService.importProperties(final);
      }
    );
  }

  

  async function mergeProperties(localProps: Property[], firebaseProps: Property[]): Promise<Property[]> {
    const merged = new Map<string, Property>();

    // Add local properties to the map
    localProps.forEach(prop => {
      merged.set(prop.uuid, prop);
    });

    // Merge with Firebase properties, preferring newer ones
    firebaseProps.forEach(prop => {
      const existing = merged.get(prop.uuid);
      if (!existing || prop.updatedAt > existing.updatedAt) {
        merged.set(prop.uuid, prop);
      }
    });

    return Array.from(merged.values());
  }

  function applyFirebaseDeletions(properties: Property[], deletedRecords: DeletedPropertyRecord[]): Property[] {
    const deletedUuids = new Set(deletedRecords.map(d => d.uuid));
    return properties.filter(prop => !deletedUuids.has(prop.uuid));
  }

  function identifyLocalChanges(
    localBeforeSync: Property[],
    localAfterSync: Property[],
    localDeletedUuids: string[]
  ): { newLocal: Property[]; updatedLocal: Property[]; deletedLocal: string[] } {
    const newLocal: Property[] = [];
    const updatedLocal: Property[] = [];
    const deletedLocal: string[] = [...localDeletedUuids]; // Start with locally marked deletions

    const localBeforeMap = new Map<string, Property>(localBeforeSync.map(p => [p.uuid, p]));
    const localAfterMap = new Map<string, Property>(localAfterSync.map(p => [p.uuid, p]));

    // Identify new and updated properties
    localAfterSync.forEach(prop => {
      const existing = localBeforeMap.get(prop.uuid);
      if (!existing) {
        // This property is new locally (created after last sync or imported)
        newLocal.push(prop);
      } else if (prop.updatedAt > existing.updatedAt) {
        // This property was updated locally
        updatedLocal.push(prop);
      }
    });

    // Identify properties deleted locally (not present in localAfterSync but were in localBeforeSync)
    localBeforeSync.forEach(prop => {
      if (!localAfterMap.has(prop.uuid) && !deletedLocal.includes(prop.uuid)) {
        // If it's not in the final merged set and not already marked for deletion
        deletedLocal.push(prop.uuid);
      }
    });

    return { newLocal, updatedLocal, deletedLocal };
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
      
      // Log analytics event
      analyticsService.logPropertyCreate({
        zone: property.zone,
        price: property.price,
        status: property.status
      });
      
      // Trigger sync if online
      if (authStore.isAuthenticated && isOnline.value) {
        syncWithFirebase();
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
      
      // Log analytics event
      analyticsService.logPropertyUpdate({
        zone: updatedProperty.zone,
        price: updatedProperty.price,
        status: updatedProperty.status
      });
      
      // Check for status change
      if (existingProperty.status !== updatedProperty.status) {
        analyticsService.logPropertyStatusChange(existingProperty.status, updatedProperty.status);
      }
      
      // Trigger sync if online
      if (authStore.isAuthenticated && isOnline.value) {
        syncWithFirebase();
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
      
      // Mark for deletion in local storage for sync
      if (property.uuid) {
        storageService.addDeletedPropertyUuid(property.uuid);
      }
      
      // Log analytics event
      analyticsService.logPropertyDelete({
        zone: property.zone,
        price: property.price,
        status: property.status
      });
      
      // Trigger sync if online
      if (authStore.isAuthenticated && isOnline.value) {
        syncWithFirebase();
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
    const oldFilters = { ...filters.value };
    userSettings.setFilters(newFilters);
    
    // Log analytics events for filter changes
    if (newFilters.search && newFilters.search !== oldFilters.search) {
      analyticsService.logPropertySearch(newFilters.search, filteredProperties.value.length);
    }
    
    if (newFilters.minPrice !== oldFilters.minPrice) {
      analyticsService.logPropertyFilter('min_price', newFilters.minPrice);
    }
    
    if (newFilters.maxPrice !== oldFilters.maxPrice) {
      analyticsService.logPropertyFilter('max_price', newFilters.maxPrice);
    }
    
    if (JSON.stringify(newFilters.statuses) !== JSON.stringify(oldFilters.statuses)) {
      analyticsService.logPropertyFilter('status', newFilters.statuses);
    }
  }

  function clearFilters(): void {
    userSettings.setFilters({});
  }

  function clearSearch(): void {
    const currentFilters = { ...filters.value };
    delete currentFilters.search;
    userSettings.setFilters(currentFilters);
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
      
      // Log analytics event
      analyticsService.logPropertyImport(propertiesWithUuids.length, 'csv');
      
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
    const propertiesToExport = hasActiveFilters.value ? filteredProperties.value : properties.value;
    
    // Log analytics event
    analyticsService.logPropertyExport(propertiesToExport.length, 'csv');
    
    return propertiesToExport;
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
      
      // Log analytics event
      analyticsService.logCalendarSchedule({
        zone: updatedProperty.zone,
        status: updatedProperty.status
      });
      
      // Sync with Firebase if authenticated and online
      if (authStore.isAuthenticated && isOnline.value && updatedProperty.uuid) {
        syncWithFirebase();
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
    
    // Cleanup user settings subscription as well
    userSettings.cleanup();
  }

  function setSortField(field: SortField): void {
    const currentSort = sort.value;
    if (currentSort.field === field) {
      // Toggle direction if same field
      userSettings.setSort({ field, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      // Set new field with ascending direction
      userSettings.setSort({ field, direction: 'asc' });
    }
  }

  function setSortDirection(direction: SortDirection): void {
    const currentSort = sort.value;
    userSettings.setSort({ field: currentSort.field, direction });
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