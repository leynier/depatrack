import { analyticsService } from '@/services/analytics';
import { useRouter } from 'vue-router';
import { watch } from 'vue';

export function useAnalytics() {
  const router = useRouter();

  /**
   * Initialize route tracking
   */
  const initializeRouteTracking = () => {
    // Track initial page view
    analyticsService.trackPageView(router.currentRoute.value.name as string || 'unknown');

    // Track route changes
    watch(
      () => router.currentRoute.value,
      (newRoute) => {
        analyticsService.trackPageView(newRoute.name as string || 'unknown');
      }
    );
  };

  /**
   * Track custom event
   */
  const track = (eventName: string, parameters?: Record<string, any>) => {
    analyticsService.logEvent(eventName, parameters);
  };

  /**
   * Track user authentication events
   */
  const trackAuth = {
    login: (method: string = 'email') => analyticsService.trackLogin(method),
    signup: (method: string = 'email') => analyticsService.trackSignup(method),
    logout: () => analyticsService.logEvent('logout')
  };

  /**
   * Track property management events
   */
  const trackProperty = {
    created: (propertyType?: string) => analyticsService.trackPropertyCreated(propertyType),
    updated: (propertyType?: string) => analyticsService.trackPropertyUpdated(propertyType),
    deleted: (propertyType?: string) => analyticsService.trackPropertyDeleted(propertyType),
    viewed: (propertyType?: string) => analyticsService.logEvent('property_viewed', { property_type: propertyType })
  };

  /**
   * Track user interactions
   */
  const trackInteraction = {
    search: (searchTerm: string) => analyticsService.trackSearch(searchTerm),
    feature: (featureName: string) => analyticsService.trackFeatureUsed(featureName),
    click: (elementName: string, location?: string) => 
      analyticsService.logEvent('click', { element_name: elementName, location }),
    error: (error: string, context?: string) => analyticsService.trackError(error, context)
  };

  /**
   * Set user properties
   */
  const setUserProperties = (properties: Record<string, any>) => {
    analyticsService.setUserProperties(properties);
  };

  /**
   * Set user ID
   */
  const setUserId = (userId: string) => {
    analyticsService.setUserId(userId);
  };

  /**
   * Track performance/timing
   */
  const trackTiming = (name: string, value: number, category?: string) => {
    analyticsService.trackTiming(name, value, category);
  };

  return {
    initializeRouteTracking,
    track,
    trackAuth,
    trackProperty,
    trackInteraction,
    setUserProperties,
    setUserId,
    trackTiming
  };
}