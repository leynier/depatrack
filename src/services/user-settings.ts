import { db } from '@/config/firebase';
import type { FirestoreUserSettings, UserSettings, UserSettingsFormData } from '@/types/user-settings';
import {
    doc,
    FirestoreError,
    getDoc,
    onSnapshot,
    setDoc,
    Timestamp
} from 'firebase/firestore';

export class UserSettingsService {
  private static instance: UserSettingsService;
  private readonly COLLECTION_NAME = 'userSettings';
  
  static getInstance(): UserSettingsService {
    if (!UserSettingsService.instance) {
      UserSettingsService.instance = new UserSettingsService();
    }
    return UserSettingsService.instance;
  }

  private constructor() {}

  private mapFirestoreUserSettings(data: FirestoreUserSettings): UserSettings {
    return {
      theme: data.theme,
      language: data.language,
      filters: data.filters,
      sort: data.sort,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }

  private handleFirestoreError(error: FirestoreError): Error {
    console.error('Firestore error:', error);
    
    switch (error.code) {
      case 'permission-denied':
        return new Error('You do not have permission to access user settings');
      case 'not-found':
        return new Error('User settings not found');
      case 'unavailable':
        return new Error('Firestore service is currently unavailable');
      default:
        return new Error(`Firestore error: ${error.message}`);
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapFirestoreUserSettings(docSnap.data() as FirestoreUserSettings);
      }
      return null;
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async saveUserSettings(userId: string, settingsData: UserSettingsFormData): Promise<UserSettings> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, userId);
      const now = Timestamp.now();
      
      // Check if document exists to preserve createdAt
      const existingDoc = await getDoc(docRef);
      const createdAt = existingDoc.exists() ? existingDoc.data().createdAt : now;
      
      const firestoreSettings: FirestoreUserSettings = {
        userId,
        theme: settingsData.theme,
        language: settingsData.language,
        filters: settingsData.filters,
        sort: settingsData.sort,
        createdAt,
        updatedAt: now
      };

      await setDoc(docRef, firestoreSettings);
      
      return this.mapFirestoreUserSettings(firestoreSettings);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  subscribeToUserSettings(userId: string, callback: (settings: UserSettings | null) => void): () => void {
    const docRef = doc(db, this.COLLECTION_NAME, userId);

    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const settings = this.mapFirestoreUserSettings(docSnap.data() as FirestoreUserSettings);
        callback(settings);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in user settings subscription:', error);
      callback(null);
    });
  }
} 