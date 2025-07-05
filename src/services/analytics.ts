import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '@/config/firebase';
import type { PropertyStatus } from '@/types/property';

export class AnalyticsService {
  private static instance: AnalyticsService;
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private constructor() {}

  private logEventSafely(eventName: string, parameters?: Record<string, any>): void {
    try {
      if (analytics) {
        logEvent(analytics, eventName, parameters);
      }
    } catch (error) {
      console.warn('Analytics event failed:', error);
    }
  }

  // User identification and properties
  setUser(userId: string): void {
    try {
      if (analytics) {
        setUserId(analytics, userId);
      }
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  setUserProperty(propertyName: string, value: string): void {
    try {
      if (analytics) {
        setUserProperties(analytics, { [propertyName]: value });
      }
    } catch (error) {
      console.warn('Analytics setUserProperties failed:', error);
    }
  }

  // Authentication events
  logLogin(method: 'email' | 'google'): void {
    this.logEventSafely('login', {
      method: method
    });
  }

  logSignUp(method: 'email' | 'google'): void {
    this.logEventSafely('sign_up', {
      method: method
    });
  }

  logLogout(): void {
    this.logEventSafely('logout');
  }

  // Property management events
  logPropertyCreate(propertyData: {
    zone?: string;
    price?: number;
    status?: PropertyStatus;
  }): void {
    this.logEventSafely('property_create', {
      zone: propertyData.zone,
      price_range: this.getPriceRange(propertyData.price),
      status: propertyData.status
    });
  }

  logPropertyUpdate(propertyData: {
    zone?: string;
    price?: number;
    status?: PropertyStatus;
    field_changed?: string;
  }): void {
    this.logEventSafely('property_update', {
      zone: propertyData.zone,
      price_range: this.getPriceRange(propertyData.price),
      status: propertyData.status,
      field_changed: propertyData.field_changed
    });
  }

  logPropertyDelete(propertyData: {
    zone?: string;
    price?: number;
    status?: PropertyStatus;
  }): void {
    this.logEventSafely('property_delete', {
      zone: propertyData.zone,
      price_range: this.getPriceRange(propertyData.price),
      status: propertyData.status
    });
  }

  logPropertyStatusChange(oldStatus: PropertyStatus, newStatus: PropertyStatus): void {
    this.logEventSafely('property_status_change', {
      old_status: oldStatus,
      new_status: newStatus
    });
  }

  // Import/Export events
  logPropertyImport(count: number, source: 'csv'): void {
    this.logEventSafely('property_import', {
      count: count,
      source: source
    });
  }

  logPropertyExport(count: number, format: 'csv'): void {
    this.logEventSafely('property_export', {
      count: count,
      format: format
    });
  }

  // Search and filter events
  logPropertySearch(searchTerm: string, resultCount: number): void {
    this.logEventSafely('property_search', {
      search_term_length: searchTerm.length,
      result_count: resultCount
    });
  }

  logPropertyFilter(filterType: string, filterValue: any): void {
    this.logEventSafely('property_filter', {
      filter_type: filterType,
      filter_value: typeof filterValue === 'object' ? JSON.stringify(filterValue) : filterValue
    });
  }

  // Calendar events
  logCalendarSchedule(propertyData: {
    zone?: string;
    status?: PropertyStatus;
  }): void {
    this.logEventSafely('calendar_schedule', {
      zone: propertyData.zone,
      status: propertyData.status
    });
  }

  // App usage events
  logPageView(pageName: string): void {
    this.logEventSafely('page_view', {
      page_title: pageName,
      page_location: window.location.href
    });
  }

  logFeatureUse(featureName: string): void {
    this.logEventSafely('feature_use', {
      feature_name: featureName
    });
  }

  logError(errorType: string, errorMessage: string): void {
    this.logEventSafely('app_error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100) // Limit message length
    });
  }

  // Sync events
  logSyncStart(): void {
    this.logEventSafely('sync_start');
  }

  logSyncComplete(duration: number, propertiesCount: number): void {
    this.logEventSafely('sync_complete', {
      duration_ms: duration,
      properties_count: propertiesCount
    });
  }

  logSyncError(errorMessage: string): void {
    this.logEventSafely('sync_error', {
      error_message: errorMessage.substring(0, 100)
    });
  }

  // Theme events
  logThemeChange(theme: 'light' | 'dark' | 'system'): void {
    this.logEventSafely('theme_change', {
      theme: theme
    });
  }

  // Helper methods
  private getPriceRange(price?: number): string {
    if (!price || price === 0) return 'unknown';
    if (price < 500) return 'under_500';
    if (price < 1000) return '500_1000';
    if (price < 1500) return '1000_1500';
    if (price < 2000) return '1500_2000';
    if (price < 3000) return '2000_3000';
    return 'over_3000';
  }

  // User engagement metrics
  logUserEngagement(properties: {
    total_properties?: number;
    active_filters?: number;
    session_duration?: number;
  }): void {
    this.logEventSafely('user_engagement', {
      total_properties: properties.total_properties,
      active_filters: properties.active_filters,
      session_duration_minutes: properties.session_duration ? Math.round(properties.session_duration / 60000) : undefined
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();