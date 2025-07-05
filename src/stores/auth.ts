import { analyticsService } from '@/services/analytics';
import { AuthService, type AuthUser, type LoginCredentials, type RegisterCredentials } from '@/services/auth';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authService = AuthService.getInstance();

  const isAuthenticated = computed(() => user.value !== null);

  async function initializeAuth(): Promise<void> {
    isLoading.value = true;
    
    authService.onAuthStateChanged(async (authUser) => {
      const wasAuthenticated = user.value !== null;
      user.value = authUser;
      isLoading.value = false;
      
      // Set user ID for analytics
      if (authUser) {
        analyticsService.setUser(authUser.uid);
      }
      
      // If user just authenticated, trigger properties and settings sync
      if (!wasAuthenticated && authUser) {
        // Dynamically import stores to avoid circular dependencies
        const { usePropertiesStore } = await import('@/stores/properties');
        const { useUserSettings } = await import('@/composables/useUserSettings');

        const propertiesStore = usePropertiesStore();
        await propertiesStore.syncWithFirebase();
        
        const userSettings = useUserSettings();
        await userSettings.syncWithFirebase();
      }
    });
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authUser = await authService.login(credentials);
      user.value = authUser;
      
      // Log analytics event
      analyticsService.logLogin('email');
      
      // Trigger properties sync after successful login
      const { usePropertiesStore } = await import('@/stores/properties');
      const propertiesStore = usePropertiesStore();
      await propertiesStore.syncWithFirebase();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function signInWithGoogle(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authUser = await authService.signInWithGoogle();
      user.value = authUser;
      
      // Log analytics event
      analyticsService.logLogin('google');
      
      // Trigger properties sync after successful Google login
      const { usePropertiesStore } = await import('@/stores/properties');
      const propertiesStore = usePropertiesStore();
      await propertiesStore.syncWithFirebase();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Google sign in failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(credentials: RegisterCredentials): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      await authService.register(credentials);
      // User is not authenticated after registration - must verify email first
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Clean up properties store subscriptions before logout
      const { usePropertiesStore } = await import('@/stores/properties');
      const propertiesStore = usePropertiesStore();
      propertiesStore.cleanup();
      
      await authService.logout();
      
      // Log analytics event
      analyticsService.logLogout();
      
      user.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendPasswordReset(email: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      await authService.sendPasswordReset(email);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send password reset email';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    initializeAuth,
    login,
    signInWithGoogle,
    register,
    logout,
    sendPasswordReset,
    clearError
  };
});