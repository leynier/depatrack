import type { Property, PropertyStatus } from '@/types/property';
import { PROPERTY_STATUS_LABELS } from '@/types/property';

export function exportToCSV(properties: Property[]): string {
  const headers = [
    'ID',
    'Zone',
    'Price',
    'Status',
    'Requirements',
    'Comments',
    'Link',
    'WhatsApp',
    'Created At',
    'Updated At'
  ];

  const rows = properties.map(property => [
    property.id,
    property.zone,
    property.price.toString(),
    PROPERTY_STATUS_LABELS[property.status],
    Array.isArray(property.requirements) ? property.requirements.join('; ') : (property.requirements || ''),
    property.comments || '',
    property.link || '',
    property.whatsapp || '',
    property.createdAt.toISOString(),
    property.updatedAt.toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function parseCSV(csvContent: string): Property[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least headers and one row');
  }

  const headers = parseCSVLine(lines[0]);
  const properties: Property[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    try {
      const property = parsePropertyFromCSV(headers, values);
      if (property) {
        properties.push(property);
      }
    } catch (error) {
      console.warn(`Error parsing row ${i + 1}:`, error);
    }
  }

  return properties;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

function parsePropertyFromCSV(headers: string[], values: string[]): Property | null {
  const getField = (fieldName: string): string => {
    const index = headers.findIndex(h => h.toLowerCase().includes(fieldName.toLowerCase()));
    return index >= 0 ? values[index] || '' : '';
  };

  const zone = getField('zone');
  const priceStr = getField('price');
  
  if (!zone || !priceStr) {
    return null;
  }

  const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
  if (isNaN(price)) {
    return null;
  }

  const statusStr = getField('status').toLowerCase();
  const status = mapStatusFromLabel(statusStr);

  const id = getField('id') || crypto.randomUUID();
  const now = new Date();

  return {
    id,
    zone,
    price,
    status,
    requirements: getField('requirements') ? getField('requirements').split(';').map(req => req.trim()).filter(req => req.length > 0) : [],
    comments: getField('comments'),
    link: getField('link'),
    whatsapp: getField('whatsapp'),
    createdAt: parseDate(getField('created')) || now,
    updatedAt: parseDate(getField('updated')) || now
  };
}

function mapStatusFromLabel(statusLabel: string): PropertyStatus {
  const statusMap: Record<string, PropertyStatus> = {
    'available': 'available',
    'contacted': 'contacted',
    'scheduled': 'scheduled',
    'visited': 'visited',
    'negotiating': 'negotiating',
    'in queue': 'in_queue',
    'evaluating': 'evaluating',
    'applying': 'applying',
    'documents pending': 'documents_pending',
    'approved': 'approved',
    'rejected': 'rejected',
    'occupied': 'occupied',
    'over budget': 'over_budget',
    'not interested': 'not_interested'
  };

  return statusMap[statusLabel.toLowerCase()] || 'available';
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function generateCSVFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `depatrack_properties_${year}${month}${day}_${hours}${minutes}.csv`;
}