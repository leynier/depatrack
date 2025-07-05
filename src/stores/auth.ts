import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService, type AuthUser, type LoginCredentials, type RegisterCredentials } from '@/services/auth';
import { analyticsService } from '@/services/analytics';
import { auth } from '@/config/firebase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authService = AuthService.getInstance();

  const isAuthenticated = computed(() => user.value !== null);

  function initializeAuth(): void {
    isLoading.value = true;
    
    authService.onAuthStateChanged((authUser) => {
      const wasAuthenticated = user.value !== null;
      user.value = authUser;
      isLoading.value = false;
      
      // Set user ID for analytics
      if (authUser) {
        analyticsService.setUser(authUser.uid);
      }
      
      // If user just authenticated, trigger properties sync
      if (!wasAuthenticated && authUser) {
        // Import properties store dynamically to avoid circular dependency
        import('@/stores/properties').then(({ usePropertiesStore }) => {
          const propertiesStore = usePropertiesStore();
          propertiesStore.syncWithFirebase();
        });
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
      import('@/stores/properties').then(({ usePropertiesStore }) => {
        const propertiesStore = usePropertiesStore();
        propertiesStore.syncWithFirebase();
      });
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
      import('@/stores/properties').then(({ usePropertiesStore }) => {
        const propertiesStore = usePropertiesStore();
        propertiesStore.syncWithFirebase();
      });
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
      import('@/stores/properties').then(({ usePropertiesStore }) => {
        const propertiesStore = usePropertiesStore();
        propertiesStore.cleanup();
      });
      
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