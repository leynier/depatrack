import type { Property } from '@/types/property';

export interface GoogleCalendarEvent {
  title: string;
  details: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function generateGoogleCalendarUrl(event: GoogleCalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.details,
    ...(event.location && { location: event.location })
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function createPropertyCalendarEvent(property: Property): GoogleCalendarEvent {
  if (!property.appointmentDate) {
    throw new Error('Property has no appointment date');
  }

  const startDate = new Date(property.appointmentDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const details = [
    `Property: ${property.zone}`,
    `Price: $${property.price.toLocaleString()}`,
    `Status: ${property.status}`,
    ...(property.requirements && property.requirements.length > 0 
      ? [`Requirements: ${property.requirements.join(', ')}`] 
      : []),
    ...(property.comments ? [`Comments: ${property.comments}`] : []),
    ...(property.link ? [`Link: ${property.link}`] : []),
    ...(property.whatsapp ? [`WhatsApp: ${property.whatsapp}`] : [])
  ].join('\n');

  return {
    title: `Property Visit - ${property.zone}`,
    details,
    startDate,
    endDate,
    location: property.location
  };
}

export function openGoogleCalendar(property: Property): void {
  try {
    const event = createPropertyCalendarEvent(property);
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening Google Calendar:', error);
    throw error;
  }
}