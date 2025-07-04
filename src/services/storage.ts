import type { Property } from '@/types/property';

const STORAGE_KEY = 'depatrack_properties';
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
        });
        this.saveData(properties);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  private getRawData(): any {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private saveData(properties: Property[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save data to local storage');
    }
  }

  getAllProperties(): Property[] {
    try {
      const data = this.getRawData();
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      return data.map(property => ({
        ...property,
        createdAt: new Date(property.createdAt),
        updatedAt: new Date(property.updatedAt)
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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
  }
}