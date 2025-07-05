<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Button } from '@/components/ui/button';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const verified = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const actionCode = route.query.oobCode as string;
  
  if (!actionCode) {
    error.value = 'Invalid verification link';
    loading.value = false;
    return;
  }

  try {
    await applyActionCode(auth, actionCode);
    verified.value = true;
  } catch (err: any) {
    switch (err.code) {
      case 'auth/expired-action-code':
        error.value = 'Verification link has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        error.value = 'Invalid verification link. Please check your email.';
        break;
      case 'auth/user-disabled':
        error.value = 'Your account has been disabled.';
        break;
      default:
        error.value = 'Verification failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
});

const goToLogin = () => {
  router.push('/?verified=true');
};
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-6">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div class="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 class="text-2xl font-bold text-foreground">Verifying your email...</h2>
        <p class="text-muted-foreground">Please wait while we verify your email address.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="verified" class="space-y-6">
        <div class="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-foreground">Email Verified Successfully!</h2>
          <p class="text-muted-foreground">
            Your email has been verified. You can now sign in to DepaTrack and start tracking your property prospects.
          </p>
        </div>

        <Button @click="goToLogin" class="w-full">
          Continue to DepaTrack
        </Button>
      </div>

      <!-- Error State -->
      <div v-else class="space-y-6">
        <div class="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-foreground">Verification Failed</h2>
          <p class="text-muted-foreground">{{ error }}</p>
        </div>

        <Button @click="goToLogin" variant="outline" class="w-full">
          Back to DepaTrack
        </Button>
      </div>

      <!-- DepaTrack Branding -->
      <div class="pt-8 border-t border-border">
        <h3 class="text-lg font-semibold text-foreground">DepaTrack</h3>
        <p class="text-sm text-muted-foreground">Property Tracking Made Simple</p>
      </div>
    </div>
  </div>
</template>