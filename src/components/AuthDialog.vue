<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface Props {
  open: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();

const mode = ref<'login' | 'register' | 'forgot'>('login');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);
const resetEmailSent = ref(false);
const showVerificationMessage = ref(false);

const dialogOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
});

const formTitle = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign In';
    case 'register': return 'Sign Up';
    case 'forgot': return 'Reset Password';
    default: return 'Sign In';
  }
});

const formDescription = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign in to sync your properties across devices';
    case 'register': return 'Create an account to sync your properties across devices';
    case 'forgot': return 'Enter your email address to receive password reset instructions';
    default: return 'Sign in to sync your properties across devices';
  }
});

const submitText = computed(() => {
  switch (mode.value) {
    case 'login': return 'Sign In';
    case 'register': return 'Sign Up';
    case 'forgot': return 'Send Reset Email';
    default: return 'Sign In';
  }
});

const switchText = computed(() => {
  switch (mode.value) {
    case 'login': return "Don't have an account? Sign up";
    case 'register': return "Already have an account? Sign in";
    case 'forgot': return "Back to sign in";
    default: return "Don't have an account? Sign up";
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
            <strong>Registration successful!</strong><br>
            We've sent a verification email to your address. Please check your inbox and click the verification link, then sign in below.
          </div>
        </div>

        <!-- Success message for password reset -->
        <div v-if="resetEmailSent && mode === 'forgot'" class="text-center space-y-4">
          <div class="text-green-600 dark:text-green-400 text-sm">
            Password reset email sent! Check your inbox for instructions.
          </div>
          <Button
            variant="outline"
            @click="switchMode"
            class="w-full"
          >
            Back to Sign In
          </Button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="mode !== 'forgot'" class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
              <Button
                v-if="mode === 'login'"
                variant="ghost"
                class="text-xs p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                @click="showForgotPassword"
                type="button"
                :disabled="isSubmitting"
              >
                Forgot password?
              </Button>
            </div>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              required
              :disabled="isSubmitting"
            />
          </div>

          <div v-if="mode === 'register'" class="space-y-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
            :disabled="!isFormValid || isSubmitting"
          >
            {{ isSubmitting ? 'Please wait...' : submitText }}
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