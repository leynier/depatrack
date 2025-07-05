import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  Timestamp,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Property, PropertyFormData } from '@/types/property';

export interface FirestoreProperty extends Omit<Property, 'createdAt' | 'updatedAt' | 'appointmentDate'> {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  appointmentDate?: Timestamp;
}

export class FirestoreService {
  private static instance: FirestoreService;
  private readonly COLLECTION_NAME = 'properties';
  
  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  private constructor() {}

  async getUserProperties(userId: string): Promise<Property[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapFirestoreProperty(doc.data() as FirestoreProperty, doc.id));
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapFirestoreProperty(docSnap.data() as FirestoreProperty, docSnap.id);
      }
      return null;
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async createProperty(userId: string, formData: PropertyFormData): Promise<Property> {
    try {
      const firestoreProperty: Omit<FirestoreProperty, 'id'> = {
        userId,
        zone: formData.zone,
        price: formData.price || 0,
        status: formData.status,
        requirements: formData.requirements || [],
        comments: formData.comments || '',
        link: formData.link || '',
        location: formData.location || '',
        whatsapp: formData.whatsapp || '',
        appointmentDate: formData.appointmentDate ? Timestamp.fromDate(formData.appointmentDate) : undefined,
        isCalendarScheduled: formData.isCalendarScheduled || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), firestoreProperty);
      return this.mapFirestoreProperty({ ...firestoreProperty, id: docRef.id }, docRef.id);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async updateProperty(propertyId: string, formData: PropertyFormData): Promise<Property> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, propertyId);
      
      const updateData: Partial<FirestoreProperty> = {
        zone: formData.zone,
        price: formData.price || 0,
        status: formData.status,
        requirements: formData.requirements || [],
        comments: formData.comments || '',
        link: formData.link || '',
        location: formData.location || '',
        whatsapp: formData.whatsapp || '',
        appointmentDate: formData.appointmentDate ? Timestamp.fromDate(formData.appointmentDate) : undefined,
        isCalendarScheduled: formData.isCalendarScheduled || false,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return this.mapFirestoreProperty(updatedDoc.data() as FirestoreProperty, updatedDoc.id);
      }
      
      throw new Error('Property not found after update');
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, propertyId);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async markCalendarScheduled(propertyId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, propertyId);
      await updateDoc(docRef, {
        isCalendarScheduled: true,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  subscribeToUserProperties(userId: string, callback: (properties: Property[]) => void): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const properties = querySnapshot.docs.map(doc => 
        this.mapFirestoreProperty(doc.data() as FirestoreProperty, doc.id)
      );
      callback(properties);
    }, (error) => {
      console.error('Error in properties subscription:', error);
    });
  }

  async enableOfflineMode(): Promise<void> {
    try {
      await disableNetwork(db);
    } catch (error) {
      console.error('Error enabling offline mode:', error);
    }
  }

  async enableOnlineMode(): Promise<void> {
    try {
      await enableNetwork(db);
    } catch (error) {
      console.error('Error enabling online mode:', error);
    }
  }

  private mapFirestoreProperty(firestoreProperty: FirestoreProperty, id: string): Property {
    return {
      id,
      zone: firestoreProperty.zone,
      price: firestoreProperty.price,
      status: firestoreProperty.status,
      requirements: firestoreProperty.requirements || [],
      comments: firestoreProperty.comments || '',
      link: firestoreProperty.link || '',
      location: firestoreProperty.location || '',
      whatsapp: firestoreProperty.whatsapp || '',
      appointmentDate: firestoreProperty.appointmentDate ? firestoreProperty.appointmentDate.toDate() : undefined,
      isCalendarScheduled: firestoreProperty.isCalendarScheduled || false,
      createdAt: firestoreProperty.createdAt.toDate(),
      updatedAt: firestoreProperty.updatedAt.toDate()
    };
  }

  private handleFirestoreError(error: FirestoreError): Error {
    switch (error.code) {
      case 'permission-denied':
        return new Error('Permission denied. Please check your authentication.');
      case 'unavailable':
        return new Error('Service temporarily unavailable. Please try again later.');
      case 'not-found':
        return new Error('Document not found.');
      case 'already-exists':
        return new Error('Document already exists.');
      default:
        return new Error(error.message || 'An unknown error occurred.');
    }
  }
}