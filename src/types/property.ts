export type PropertyStatus = 
  | 'available'
  | 'in_process'
  | 'occupied'
  | 'documents_pending'
  | 'requires_guarantees'
  | 'not_available';

export interface Property {
  id: string;
  zone: string;
  price: number;
  status: PropertyStatus;
  requirements?: string;
  comments?: string;
  link?: string;
  whatsapp?: string;
  appointmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFormData {
  zone: string;
  price: number | null;
  status: PropertyStatus;
  requirements?: string;
  comments?: string;
  link?: string;
  whatsapp?: string;
  appointmentDate?: Date | null;
}

export interface PropertyFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  statuses?: PropertyStatus[];
}

export interface PropertyStats {
  total: number;
  available: number;
  inProcess: number;
  occupied: number;
  averagePrice: number;
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Available',
  in_process: 'In Process',
  occupied: 'Occupied',
  documents_pending: 'Documents Pending',
  requires_guarantees: 'Requires Guarantees',
  not_available: 'Not Available'
};

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'bg-green-100 text-green-800',
  in_process: 'bg-yellow-100 text-yellow-800',
  occupied: 'bg-red-100 text-red-800',
  documents_pending: 'bg-blue-100 text-blue-800',
  requires_guarantees: 'bg-purple-100 text-purple-800',
  not_available: 'bg-gray-100 text-gray-800'
};