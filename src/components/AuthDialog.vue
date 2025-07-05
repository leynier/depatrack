<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  open: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const { t } = useLanguage();

const mode = ref<'login' | 'register' | 'forgot'>('login');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);
const resetEmailSent = ref(false);
const showVerificationMessage = ref(false);
const isGoogleSignIn = ref(false);

const dialogOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
});

const formTitle = computed(() => {
  switch (mode.value) {
    case 'login': return t('auth.signIn');
    case 'register': return t('auth.signUp');
    case 'forgot': return t('auth.resetPassword');
    default: return t('auth.signIn');
  }
});

const formDescription = computed(() => {
  switch (mode.value) {
    case 'login': return t('auth.signInDescription');
    case 'register': return t('auth.signUpDescription');
    case 'forgot': return t('auth.forgotPasswordDescription');
    default: return t('auth.signInDescription');
  }
});

const submitText = computed(() => {
  switch (mode.value) {
    case 'login': return t('auth.signIn');
    case 'register': return t('auth.signUp');
    case 'forgot': return t('auth.sendResetEmail');
    default: return t('auth.signIn');
  }
});

const switchText = computed(() => {
  switch (mode.value) {
    case 'login': return t('auth.dontHaveAccount');
    case 'register': return t('auth.alreadyHaveAccount');
    case 'forgot': return t('auth.backToSignIn');
    default: return t('auth.dontHaveAccount');
  }
});

const isFormValid = computed(() => {
  if (!email.value) return false;
  if (mode.value === 'forgot') return true;
  if (!password.value) return false;
  if (mode.value === 'register' && password.value !== confirmPassword.value) return false;
  return true;
});

async function handleSubmit() {
  if (!isFormValid.value) return;

  try {
    isSubmitting.value = true;
    authStore.clearError();

    switch (mode.value) {
      case 'login':
        await authStore.login({ email: email.value, password: password.value });
        dialogOpen.value = false;
        resetForm();
        break;
      
      case 'register':
        await authStore.register({ 
          email: email.value, 
          password: password.value, 
          confirmPassword: confirmPassword.value 
        });
        // Don't close dialog, switch to login with verification message
        mode.value = 'login';
        showVerificationMessage.value = true;
        resetForm();
        break;
      
      case 'forgot':
        await authStore.sendPasswordReset(email.value);
        resetEmailSent.value = true;
        break;
    }
  } catch (error) {
    // Error is handled by the store
    console.error('Auth error:', error);
  } finally {
    isSubmitting.value = false;
  }
}

async function handleGoogleSignIn() {
  try {
    isGoogleSignIn.value = true;
    authStore.clearError();
    
    await authStore.signInWithGoogle();
    dialogOpen.value = false;
    resetForm();
  } catch (error) {
    // Error is handled by the store
    console.error('Google sign in error:', error);
  } finally {
    isGoogleSignIn.value = false;
  }
}

function switchMode() {
  switch (mode.value) {
    case 'login':
      mode.value = 'register';
      break;
    case 'register':
      mode.value = 'login';
      break;
    case 'forgot':
      mode.value = 'login';
      break;
  }
  authStore.clearError();
  resetForm();
  showVerificationMessage.value = false;
}

function showForgotPassword() {
  mode.value = 'forgot';
  authStore.clearError();
  resetEmailSent.value = false;
}

function resetForm() {
  email.value = '';
  password.value = '';
  confirmPassword.value = '';
  resetEmailSent.value = false;
  isGoogleSignIn.value = false;
}

function handleOpenChange(open: boolean) {
  if (!open) {
    resetForm();
    authStore.clearError();
    mode.value = 'login';
    showVerificationMessage.value = false;
  }
  dialogOpen.value = open;
}
</script>

<template>
  <Dialog :open="dialogOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ formTitle }}</DialogTitle>
        <DialogDescription>
          {{ formDescription }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Email verification success message -->
        <div v-if="showVerificationMessage && mode === 'login'" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div class="text-sm text-green-600 dark:text-green-400">
            <strong>{{ t('auth.registrationSuccessTitle') }}</strong><br>
            {{ t('auth.registrationSuccessMessage') }}
          </div>
        </div>

        <!-- Success message for password reset -->
        <div v-if="resetEmailSent && mode === 'forgot'" class="text-center space-y-4">
          <div class="text-green-600 dark:text-green-400 text-sm">
            {{ t('auth.passwordResetEmailSent') }}
          </div>
          <Button
            variant="outline"
            @click="switchMode"
            class="w-full"
          >
            {{ t('auth.backToSignIn') }}
          </Button>
        </div>

        <!-- Google Sign In Button (for login and register modes) -->
        <div v-if="mode === 'login' || mode === 'register'" class="space-y-3">
          <Button
            variant="outline"
            class="w-full"
            @click="handleGoogleSignIn"
            :disabled="isSubmitting || isGoogleSignIn"
          >
            <svg
              class="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
              />
            </svg>
            {{ isGoogleSignIn ? t('common.pleaseWait') : (mode === 'register' ? t('auth.signUpWithGoogle') : t('auth.continueWithGoogle')) }}
          </Button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">{{ t('auth.orContinueWithEmail') }}</span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form v-if="!resetEmailSent" @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">{{ t('auth.email') }}</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              :placeholder="t('auth.enterYourEmail')"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="mode !== 'forgot'" class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">{{ t('auth.password') }}</Label>
              <Button
                v-if="mode === 'login'"
                variant="ghost"
                class="text-xs p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                @click="showForgotPassword"
                type="button"
                :disabled="isSubmitting"
              >
                {{ t('auth.forgotPassword') }}
              </Button>
            </div>
            <Input
              id="password"
              v-model="password"
              type="password"
              :placeholder="t('auth.enterYourPassword')"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="mode === 'register'" class="space-y-2">
            <Label for="confirmPassword">{{ t('auth.confirmPassword') }}</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              :placeholder="t('auth.confirmYourPassword')"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="authStore.error" class="text-sm text-red-600 dark:text-red-400">
            {{ authStore.error }}
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="!isFormValid || isSubmitting || isGoogleSignIn"
          >
            {{ isSubmitting ? t('common.pleaseWait') : submitText }}
          </Button>
        </form>

        <!-- Mode switching -->
        <div v-if="!resetEmailSent" class="space-y-3">
          <Separator />
          
          <div class="text-center">
            <Button
              variant="ghost"
              class="text-sm"
              @click="switchMode"
              :disabled="isSubmitting"
            >
              {{ switchText }}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>