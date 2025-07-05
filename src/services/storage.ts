import { useAuthStore } from '@/stores/auth';
import type { Property } from '@/types/property';

const STORAGE_KEY_PREFIX = 'depatrack_properties_';
const DELETED_PROPERTIES_PREFIX = 'depatrack_deleted_properties_';
const VERSION_KEY = 'depatrack_version';
const CURRENT_VERSION = '1.0.0';

export class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private constructor() {
    this.migrateIfNeeded();
  }

  private migrateIfNeeded(): void {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      this.performMigration(version);
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  }

  private performMigration(fromVersion: string | null): void {
    if (!fromVersion) {
      return;
    }
    
    try {
      const data = this.getRawData();
      if (data) {
        const properties = Array.isArray(data) ? data : [];
        properties.forEach(property => {
          if (property.createdAt && typeof property.createdAt === 'string') {
            property.createdAt = new Date(property.createdAt);
          }
          if (property.updatedAt && typeof property.updatedAt === 'string') {
            property.updatedAt = new Date(property.updatedAt);
          }
          if (property.appointmentDate && typeof property.appointmentDate === 'string') {
            property.appointmentDate = new Date(property.appointmentDate);
          }
          // Migrate requirements from string to array
          if (property.requirements && typeof property.requirements === 'string') {
            property.requirements = property.requirements.trim() ? [property.requirements.trim()] : [];
          }
          // Ensure requirements is an array
          if (!Array.isArray(property.requirements)) {
            property.requirements = [];
          }
        });
        this.saveData(properties);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  private getCurrentUserId(): string {
    const authStore = useAuthStore();
    return authStore?.user?.uid || 'guest';
  }

  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.getCurrentUserId()}`;
  }

  private getDeletedKey(): string {
    return `${DELETED_PROPERTIES_PREFIX}${this.getCurrentUserId()}`;
  }

  private getRawData(): any {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private saveData(properties: Property[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(properties));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save data to local storage');
    }
  }

  private saveDeletedPropertyUuids(uuids: string[]): void {
    try {
      localStorage.setItem(this.getDeletedKey(), JSON.stringify(uuids));
    } catch (error) {
      console.error('Error saving deleted property UUIDs to localStorage:', error);
    }
  }

  getDeletedPropertyUuids(): string[] {
    try {
      const data = localStorage.getItem(this.getDeletedKey());
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading deleted property UUIDs from localStorage:', error);
      return [];
    }
  }

  addDeletedPropertyUuid(uuid: string): void {
    const uuids = this.getDeletedPropertyUuids();
    if (!uuids.includes(uuid)) {
      uuids.push(uuid);
      this.saveDeletedPropertyUuids(uuids);
    }
  }

  clearDeletedPropertyUuids(): void {
    localStorage.removeItem(this.getDeletedKey());
  }

  getAllProperties(): Property[] {
    try {
      // Datos del usuario actual
      const userData = this.getRawData();
      let properties: Property[] = Array.isArray(userData) ? userData : [];

      // Si el usuario NO es invitado, intentamos fusionar datos del invitado
      const currentUserId = this.getCurrentUserId();
      if (currentUserId !== 'guest') {
        try {
          const guestRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}guest`);
          if (guestRaw) {
            const guestData: Property[] = JSON.parse(guestRaw);

            // Combinar evitando duplicados (por uuid)
            const combinedMap = new Map<string, Property>();
            [...guestData, ...properties].forEach(p => combinedMap.set(p.uuid, p));
            properties = Array.from(combinedMap.values());

            // Guardar fusionado en la clave del usuario y limpiar la del invitado
            this.saveData(properties);
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);
            localStorage.removeItem(`${DELETED_PROPERTIES_PREFIX}guest`);
          }
        } catch (mergeError) {
          console.error('Failed to merge guest data:', mergeError);
        }
      }

      return properties.map(property => ({
        ...property,
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt),
        appointmentDate: property.appointmentDate ? new Date(property.appointmentDate) : undefined,
        requirements: Array.isArray(property.requirements) ? property.requirements : []
      }));
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  }

  saveProperty(property: Property): void {
    const properties = this.getAllProperties();
    const existingIndex = properties.findIndex(p => p.id === property.id);
    
    if (existingIndex >= 0) {
      properties[existingIndex] = { ...property, updatedAt: new Date() };
    } else {
      properties.push(property);
    }
    
    this.saveData(properties);
  }

  deleteProperty(id: string): void {
    const properties = this.getAllProperties();
    const filtered = properties.filter(p => p.id !== id);
    this.saveData(filtered);
  }

  getProperty(id: string): Property | null {
    const properties = this.getAllProperties();
    return properties.find(p => p.id === id) || null;
  }

  importProperties(properties: Property[]): void {
    const validProperties = properties.filter(p => 
      p.id && p.zone && typeof p.price === 'number'
    );
    
    this.saveData(validProperties);
  }

  exportProperties(): Property[] {
    return this.getAllProperties();
  }

  clearAllData(): void {
    localStorage.removeItem(this.getStorageKey());
    localStorage.removeItem(this.getDeletedKey());
  }
}