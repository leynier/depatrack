export type PropertyStatus = 
  | 'available'
  | 'contacted'
  | 'scheduled'
  | 'visited'
  | 'negotiating'
  | 'in_queue'
  | 'evaluating'
  | 'applying'
  | 'documents_pending'
  | 'approved'
  | 'rejected'
  | 'occupied'
  | 'over_budget'
  | 'not_interested';

export interface Property {
  id: string;
  zone: string;
  price: number;
  status: PropertyStatus;
  requirements?: string[];
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
  requirements?: string[];
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
  active: number;
  completed: number;
  rejected: number;
  averagePrice: number;
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'Available',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  visited: 'Visited',
  negotiating: 'Negotiating',
  in_queue: 'In Queue',
  evaluating: 'Evaluating',
  applying: 'Applying',
  documents_pending: 'Documents Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  occupied: 'Occupied',
  over_budget: 'Over Budget',
  not_interested: 'Not Interested'
};

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  available: 'bg-green-100 text-green-800',
  contacted: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  visited: 'bg-indigo-100 text-indigo-800',
  negotiating: 'bg-yellow-100 text-yellow-800',
  in_queue: 'bg-orange-100 text-orange-800',
  evaluating: 'bg-teal-100 text-teal-800',
  applying: 'bg-cyan-100 text-cyan-800',
  documents_pending: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  occupied: 'bg-red-100 text-red-800',
  over_budget: 'bg-gray-100 text-gray-800',
  not_interested: 'bg-gray-100 text-gray-800'
};