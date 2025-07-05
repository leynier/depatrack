import type { Timestamp } from 'firebase/firestore';
import type { PropertyFilters, PropertySort } from './property';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'es';

export interface UserSettings {
  theme: Theme;
  language: Language;
  filters: PropertyFilters;
  sort: PropertySort;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsFormData {
  theme: Theme;
  language: Language;
  filters: PropertyFilters;
  sort: PropertySort;
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
}