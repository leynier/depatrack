import type { Timestamp } from 'firebase/firestore';
import type { PropertyFilters, PropertySort } from './property';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es';

export interface UserSettings {
  theme: Theme;
  language: Language;
  filters: PropertyFilters;
  sort: PropertySort;
  columnVisibility: ColumnVisibilitySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsFormData {
  theme: Theme;
  language: Language;
  filters: PropertyFilters;
  sort: PropertySort;
  columnVisibility: ColumnVisibilitySettings;
}

export interface FirestoreUserSettings extends Omit<UserSettings, 'createdAt' | 'updatedAt'> {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettingsDefaults {
  theme: Theme;
  language: Language;
  filters: PropertyFilters;
  sort: PropertySort;
  columnVisibility: ColumnVisibilitySettings;
}

// Column visibility configuration
export type TableColumn = 
  | 'zone'
  | 'price' 
  | 'status'
  | 'appointment'
  | 'realEstate'
  | 'requirements'
  | 'comments'
  | 'links'
  | 'actions';

export interface ColumnVisibilitySettings {
  // Always visible columns (cannot be hidden)
  zone: true;
  price: true;
  status: true;
  actions: true;
  
  // Configurable columns
  appointment: boolean;
  realEstate: boolean;
  requirements: boolean;
  comments: boolean;
  links: boolean;
}