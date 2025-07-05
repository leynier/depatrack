import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService, type AuthUser, type LoginCredentials, type RegisterCredentials } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const authService = AuthService.getInstance();

  const isAuthenticated = computed(() => user.value !== null);

  function initializeAuth(): void {
    isLoading.value = true;
    
    authService.onAuthStateChanged((authUser) => {
      user.value = authUser;
      isLoading.value = false;
    });
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;
      
      const authUser = await authService.login(credentials);
      user.value = authUser;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
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
      // No automatic login - user needs to verify email first
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
      
      await authService.logout();
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
    register,
    logout,
    sendPasswordReset,
    clearError
  };
});