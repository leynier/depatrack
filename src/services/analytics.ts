import { 
  logEvent, 
  setUserProperties, 
  setUserId,
  type Analytics 
} from 'firebase/analytics';
import { analytics } from '@/config/firebase';

export class AnalyticsService {
  private analytics: Analytics | null;

  constructor() {
    this.analytics = analytics;
  }

  /**
   * Log a custom event
   */
  logEvent(eventName: string, parameters?: Record<string, any>): void {
    if (!this.analytics) {
      console.warn('Analytics not initialized');
      return;
    }
    
    logEvent(this.analytics, eventName, parameters);
  }

  /**
   * Track page views
   */
  trackPageView(pageName: string, pageTitle?: string): void {
    this.logEvent('page_view', {
      page_name: pageName,
      page_title: pageTitle || pageName
    });
  }

  /**
   * Track user login
   */
  trackLogin(method: string = 'email'): void {
    this.logEvent('login', {
      method: method
    });
  }

  /**
   * Track user signup
   */
  trackSignup(method: string = 'email'): void {
    this.logEvent('sign_up', {
      method: method
    });
  }

  /**
   * Track property creation
   */
  trackPropertyCreated(propertyType?: string): void {
    this.logEvent('property_created', {
      property_type: propertyType
    });
  }

  /**
   * Track property updated
   */
  trackPropertyUpdated(propertyType?: string): void {
    this.logEvent('property_updated', {
      property_type: propertyType
    });
  }

  /**
   * Track property deleted
   */
  trackPropertyDeleted(propertyType?: string): void {
    this.logEvent('property_deleted', {
      property_type: propertyType
    });
  }

  /**
   * Track search usage
   */
  trackSearch(searchTerm: string): void {
    this.logEvent('search', {
      search_term: searchTerm
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsed(featureName: string): void {
    this.logEvent('feature_used', {
      feature_name: featureName
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.analytics) {
      console.warn('Analytics not initialized');
      return;
    }
    
    setUserProperties(this.analytics, properties);
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    if (!this.analytics) {
      console.warn('Analytics not initialized');
      return;
    }
    
    setUserId(this.analytics, userId);
  }

  /**
   * Track error events
   */
  trackError(error: string, context?: string): void {
    this.logEvent('error', {
      error_message: error,
      error_context: context
    });
  }

  /**
   * Track timing events
   */
  trackTiming(name: string, value: number, category?: string): void {
    this.logEvent('timing', {
      name: name,
      value: value,
      category: category
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();