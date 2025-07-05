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
  FirestoreError,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Property, PropertyFormData, DeletedPropertyRecord } from '@/types/property';

export interface FirestoreProperty extends Omit<Property, 'createdAt' | 'updatedAt' | 'appointmentDate'> {
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  appointmentDate?: Timestamp;
}

export interface FirestoreDeletedProperty extends Omit<DeletedPropertyRecord, 'deletedAt'> {
  userId: string;
  deletedAt: Timestamp;
}

export class FirestoreService {
  private static instance: FirestoreService;
  private readonly COLLECTION_NAME = 'properties';
  private readonly DELETED_COLLECTION_NAME = 'deletedProperties';
  private deviceId: string;
  
  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  private constructor() {
    // Generate or retrieve a unique device ID
    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    const storageKey = 'depatrack_device_id';
    let deviceId = localStorage.getItem(storageKey);
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(storageKey, deviceId);
    }
    
    return deviceId;
  }

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

  async getPropertyByUuid(userId: string, uuid: string): Promise<Property | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('uuid', '==', uuid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.mapFirestoreProperty(doc.data() as FirestoreProperty, doc.id);
      }
      return null;
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async createProperty(
    userId: string,
    formData: PropertyFormData,
    uuid?: string,
    createdAt?: Date,
    updatedAt?: Date
  ): Promise<Property> {
    try {
      const propertyUuid = uuid || crypto.randomUUID();
      
      const firestoreProperty: Omit<FirestoreProperty, 'id'> = {
        userId,
        uuid: propertyUuid,
        zone: formData.zone,
        price: formData.price || 0,
        status: formData.status,
        requirements: formData.requirements || [],
        comments: formData.comments || '',
        link: formData.link || '',
        location: formData.location || '',
        whatsapp: formData.whatsapp || '',
        isCalendarScheduled: formData.isCalendarScheduled || false,
        createdAt: createdAt ? Timestamp.fromDate(createdAt) : Timestamp.now(),
        updatedAt: updatedAt ? Timestamp.fromDate(updatedAt) : Timestamp.now()
      };

      // Only add appointmentDate if it exists (Firestore doesn't allow undefined)
      if (formData.appointmentDate) {
        firestoreProperty.appointmentDate = Timestamp.fromDate(formData.appointmentDate);
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), firestoreProperty);
      return this.mapFirestoreProperty({ ...firestoreProperty, id: docRef.id }, docRef.id);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async updateProperty(propertyId: string, formData: PropertyFormData, updatedAt?: Date): Promise<Property> {
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
        isCalendarScheduled: formData.isCalendarScheduled || false,
        updatedAt: updatedAt ? Timestamp.fromDate(updatedAt) : Timestamp.now()
      };

      // Only add appointmentDate if it exists (Firestore doesn't allow undefined)
      if (formData.appointmentDate) {
        updateData.appointmentDate = Timestamp.fromDate(formData.appointmentDate);
      }

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

  async deleteProperty(propertyId: string, propertyUuid: string, userId: string): Promise<void> {
    try {
      // Delete the property
      const docRef = doc(db, this.COLLECTION_NAME, propertyId);
      await deleteDoc(docRef);
      
      // Record the deletion
      await this.recordPropertyDeletion(propertyUuid, userId);
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  private async recordPropertyDeletion(uuid: string, userId: string): Promise<void> {
    const deletedRecord: Omit<FirestoreDeletedProperty, 'id'> = {
      userId,
      uuid,
      deviceId: this.deviceId,
      deletedAt: Timestamp.now()
    };
    
    await addDoc(collection(db, this.DELETED_COLLECTION_NAME), deletedRecord);
  }

  async getDeletedProperties(userId: string): Promise<DeletedPropertyRecord[]> {
    try {
      const q = query(
        collection(db, this.DELETED_COLLECTION_NAME),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreDeletedProperty;
        return {
          uuid: data.uuid,
          deviceId: data.deviceId,
          deletedAt: data.deletedAt.toDate()
        };
      });
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

  async batchCreateProperties(userId: string, properties: Property[]): Promise<void> {
    const batch = writeBatch(db);
    properties.forEach(property => {
      const docRef = doc(collection(db, this.COLLECTION_NAME));
      const firestoreProperty: Omit<FirestoreProperty, 'id'> = {
        userId,
        uuid: property.uuid,
        zone: property.zone,
        price: property.price || 0,
        status: property.status,
        requirements: property.requirements || [],
        comments: property.comments || '',
        link: property.link || '',
        location: property.location || '',
        whatsapp: property.whatsapp || '',
        isCalendarScheduled: property.isCalendarScheduled || false,
        createdAt: Timestamp.fromDate(property.createdAt),
        updatedAt: Timestamp.fromDate(property.updatedAt)
      };
      if (property.appointmentDate) {
        firestoreProperty.appointmentDate = Timestamp.fromDate(property.appointmentDate);
      }
      batch.set(docRef, firestoreProperty);
    });
    await batch.commit();
  }

  async batchUpdateProperties(properties: Property[]): Promise<void> {
    const batch = writeBatch(db);
    for (const property of properties) {
      const firebaseProperty = await this.getPropertyByUuid(property.userId!, property.uuid);
      if (firebaseProperty) {
        const docRef = doc(db, this.COLLECTION_NAME, firebaseProperty.id);
        const updateData: Partial<FirestoreProperty> = {
          zone: property.zone,
          price: property.price || 0,
          status: property.status,
          requirements: property.requirements || [],
          comments: property.comments || '',
          link: property.link || '',
          location: property.location || '',
          whatsapp: property.whatsapp || '',
          isCalendarScheduled: property.isCalendarScheduled || false,
          updatedAt: Timestamp.fromDate(property.updatedAt)
        };
        if (property.appointmentDate) {
          updateData.appointmentDate = Timestamp.fromDate(property.appointmentDate);
        }
        batch.update(docRef, updateData);
      }
    }
    await batch.commit();
  }

  async batchDeleteProperties(propertyUuids: string[], userId: string): Promise<void> {
    const batch = writeBatch(db);
    for (const uuid of propertyUuids) {
      const firebaseProperty = await this.getPropertyByUuid(userId, uuid);
      if (firebaseProperty) {
        const docRef = doc(db, this.COLLECTION_NAME, firebaseProperty.id);
        batch.delete(docRef);
        await this.recordPropertyDeletion(uuid, userId); // Record deletion for sync
      }
    }
    await batch.commit();
  }

  async getPropertiesModifiedSince(userId: string, lastSyncTime: Date): Promise<Property[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('updatedAt', '>', Timestamp.fromDate(lastSyncTime))
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapFirestoreProperty(doc.data() as FirestoreProperty, doc.id));
    } catch (error) {
      throw this.handleFirestoreError(error as FirestoreError);
    }
  }

  async getDeletedPropertiesModifiedSince(userId: string, lastSyncTime: Date): Promise<DeletedPropertyRecord[]> {
    try {
      const q = query(
        collection(db, this.DELETED_COLLECTION_NAME),
        where('userId', '==', userId),
        where('deletedAt', '>', Timestamp.fromDate(lastSyncTime))
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as FirestoreDeletedProperty;
        return {
          uuid: data.uuid,
          deviceId: data.deviceId,
          deletedAt: data.deletedAt.toDate()
        };
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
      uuid: firestoreProperty.uuid,
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