<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth';
import { useLanguage } from '@/composables/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useLanguage();

const loading = ref(true);
const mode = ref('');
const step = ref<'verify' | 'reset' | 'success' | 'error'>('verify');
const error = ref<string | null>(null);
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);

const actionCode = route.query.oobCode as string;

onMounted(async () => {
  mode.value = route.query.mode as string;
  
  if (!actionCode || !mode.value) {
    error.value = t('auth.invalidVerificationLink');
    step.value = 'error';
    loading.value = false;
    return;
  }

  try {
    switch (mode.value) {
      case 'verifyEmail':
        await handleEmailVerification();
        break;
      case 'resetPassword':
        await handlePasswordResetVerification();
        break;
      case 'recoverEmail':
        await handleEmailRecovery();
        break;
      default:
        error.value = t('auth.invalidVerificationLink');
        step.value = 'error';
    }
  } catch (err: any) {
    handleError(err);
  } finally {
    loading.value = false;
  }
});

const handleEmailVerification = async () => {
  await applyActionCode(auth, actionCode);
  step.value = 'success';
  // User must manually sign in after email verification
};

const handlePasswordResetVerification = async () => {
  email.value = await verifyPasswordResetCode(auth, actionCode);
  step.value = 'reset';
};

const handleEmailRecovery = async () => {
  await applyActionCode(auth, actionCode);
  step.value = 'success';
};

const resetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = t('auth.passwordsDoNotMatch');
    return;
  }

  if (newPassword.value.length < 6) {
    error.value = t('auth.passwordTooShort');
    return;
  }

  try {
    isSubmitting.value = true;
    error.value = null;
    
    // Reset the password
    await confirmPasswordReset(auth, actionCode, newPassword.value);
    
    // Auto-login with the new password
    await signInWithEmailAndPassword(auth, email.value, newPassword.value);
    
    step.value = 'success';
  } catch (err: any) {
    handleError(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleError = (err: any) => {
  switch (err.code) {
    case 'auth/expired-action-code':
      error.value = mode.value === 'resetPassword' 
        ? t('auth.expiredPasswordResetLink')
        : t('auth.expiredVerificationLink');
      break;
    case 'auth/invalid-action-code':
      error.value = mode.value === 'resetPassword'
        ? t('auth.invalidPasswordResetLinkCheckEmail')
        : t('auth.invalidVerificationLinkCheckEmail');
      break;
    case 'auth/user-disabled':
      error.value = t('auth.accountDisabled');
      break;
    case 'auth/weak-password':
      error.value = t('auth.passwordTooWeak');
      break;
    default:
      error.value = mode.value === 'resetPassword'
        ? t('auth.failedToResetPassword')
        : t('auth.verificationFailed');
  }
  step.value = 'error';
};

const getTitle = () => {
  if (loading.value) return t('common.pleaseWait');
  
  switch (mode.value) {
    case 'verifyEmail':
      return step.value === 'success' ? t('auth.emailVerifiedSuccessfully') : t('auth.verificationFailedTitle');
    case 'resetPassword':
      if (step.value === 'reset') return t('auth.resetPassword');
      return step.value === 'success' ? t('auth.passwordResetSuccessful') : t('auth.resetFailedTitle');
    case 'recoverEmail':
      return step.value === 'success' ? t('auth.emailVerifiedSuccessfully') : t('auth.verificationFailedTitle');
    default:
      return t('auth.verificationFailedTitle');
  }
};

const getDescription = () => {
  if (loading.value) return t('auth.verifyingEmailMessage');
  
  switch (mode.value) {
    case 'verifyEmail':
      return step.value === 'success' 
        ? t('auth.emailVerifiedMessage')
        : error.value;
    case 'resetPassword':
      if (step.value === 'reset') return t('auth.enterNewPasswordFor', { email: email.value });
      return step.value === 'success'
        ? t('auth.passwordResetSuccessfulMessage')
        : error.value;
    case 'recoverEmail':
      return step.value === 'success'
        ? t('auth.emailVerifiedMessage')
        : error.value;
    default:
      return error.value;
  }
};

const getSuccessAction = () => {
  switch (mode.value) {
    case 'verifyEmail':
      return t('auth.signInToDepaTrack');
    case 'resetPassword':
      return auth.currentUser ? t('auth.continueToDepaTrack') : t('auth.signInToDepaTrack');
    case 'recoverEmail':
      return t('auth.signInToDepaTrack');
    default:
      return t('auth.backToDepaTrack');
  }
};

const goToLogin = () => {
  // If user is authenticated (only after password reset), go directly to app
  if (mode.value === 'resetPassword' && auth.currentUser) {
    router.push('/');
    return;
  }
  
  // For email verification and other cases, go to login page with auto-open modal
  const params = new URLSearchParams();
  if (mode.value === 'verifyEmail') {
    params.set('verified', 'true');
    params.set('openAuth', 'true'); // Signal to open auth modal
  }
  if (mode.value === 'resetPassword') params.set('reset', 'success');
  
  router.push(`/?${params.toString()}`);
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
        <h2 class="text-2xl font-bold text-foreground">{{ getTitle() }}</h2>
        <p class="text-muted-foreground">{{ getDescription() }}</p>
      </div>

      <!-- Password Reset Form -->
      <div v-else-if="step === 'reset' && mode === 'resetPassword'" class="space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold text-foreground">{{ getTitle() }}</h2>
          <p class="text-muted-foreground">{{ getDescription() }}</p>
        </div>

        <form @submit.prevent="resetPassword" class="space-y-4">
          <div class="space-y-2">
            <Label for="newPassword">{{ t('auth.newPassword') }}</Label>
            <Input
              id="newPassword"
              v-model="newPassword"
              type="password"
              :placeholder="t('auth.enterNewPassword')"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">{{ t('auth.confirmPassword') }}</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              :placeholder="t('auth.confirmNewPassword')"
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
            {{ isSubmitting ? t('auth.resetting') : t('auth.resetPassword') }}
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
          <h2 class="text-2xl font-bold text-foreground">{{ getTitle() }}</h2>
          <p class="text-muted-foreground">{{ getDescription() }}</p>
        </div>

        <Button @click="goToLogin" class="w-full">
          {{ getSuccessAction() }}
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
          <h2 class="text-2xl font-bold text-foreground">{{ getTitle() }}</h2>
          <p class="text-muted-foreground">{{ getDescription() }}</p>
        </div>

        <Button @click="goToLogin" variant="outline" class="w-full">
          {{ t('auth.backToDepaTrack') }}
        </Button>
      </div>

      <!-- DepaTrack Branding -->
      <div class="pt-8 border-t border-border text-center">
        <h3 class="text-lg font-semibold text-foreground">{{ t('app.title') }}</h3>
        <p class="text-sm text-muted-foreground">{{ t('app.tagline') }}</p>
      </div>
    </div>
  </div>
</template>