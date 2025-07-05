<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const step = ref<'verify' | 'reset' | 'success' | 'error'>('verify');
const error = ref<string | null>(null);
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);

const actionCode = route.query.oobCode as string;

onMounted(async () => {
  if (!actionCode) {
    error.value = 'Invalid password reset link';
    step.value = 'error';
    loading.value = false;
    return;
  }

  try {
    email.value = await verifyPasswordResetCode(auth, actionCode);
    step.value = 'reset';
  } catch (err: any) {
    switch (err.code) {
      case 'auth/expired-action-code':
        error.value = 'Password reset link has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        error.value = 'Invalid password reset link. Please check your email.';
        break;
      case 'auth/user-disabled':
        error.value = 'Your account has been disabled.';
        break;
      default:
        error.value = 'Invalid password reset link.';
    }
    step.value = 'error';
  } finally {
    loading.value = false;
  }
});

const resetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters';
    return;
  }

  try {
    isSubmitting.value = true;
    error.value = null;
    
    await confirmPasswordReset(auth, actionCode, newPassword.value);
    step.value = 'success';
  } catch (err: any) {
    switch (err.code) {
      case 'auth/weak-password':
        error.value = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'auth/expired-action-code':
        error.value = 'Password reset link has expired. Please request a new one.';
        break;
      default:
        error.value = 'Failed to reset password. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};

const goToLogin = () => {
  router.push('/?reset=success');
};
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-6">
    <div class="max-w-md w-full space-y-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center space-y-4">
        <div class="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 class="text-2xl font-bold text-foreground">Verifying reset link...</h2>
        <p class="text-muted-foreground">Please wait while we verify your password reset link.</p>
      </div>

      <!-- Reset Password Form -->
      <div v-else-if="step === 'reset'" class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-foreground">Reset Password</h2>
          <p class="text-muted-foreground">Enter your new password for {{ email }}</p>
        </div>

        <form @submit.prevent="resetPassword" class="space-y-4">
          <div class="space-y-2">
            <Label for="newPassword">New Password</Label>
            <Input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="Enter new password"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="isSubmitting || !newPassword || !confirmPassword"
          >
            {{ isSubmitting ? 'Resetting...' : 'Reset Password' }}
          </Button>
        </form>
      </div>

      <!-- Success State -->
      <div v-else-if="step === 'success'" class="text-center space-y-6">
        <div class="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-foreground">Password Reset Successful!</h2>
          <p class="text-muted-foreground">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>

        <Button @click="goToLogin" class="w-full">
          Sign In to DepaTrack
        </Button>
      </div>

      <!-- Error State -->
      <div v-else class="text-center space-y-6">
        <div class="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-foreground">Reset Failed</h2>
          <p class="text-muted-foreground">{{ error }}</p>
        </div>

        <Button @click="goToLogin" variant="outline" class="w-full">
          Back to DepaTrack
        </Button>
      </div>

      <!-- DepaTrack Branding -->
      <div class="pt-8 border-t border-border text-center">
        <h3 class="text-lg font-semibold text-foreground">DepaTrack</h3>
        <p class="text-sm text-muted-foreground">Property Tracking Made Simple</p>
      </div>
    </div>
  </div>
</template>