<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/composables/useLanguage';

const route = useRoute();
const router = useRouter();
const { t } = useLanguage();

const loading = ref(true);
const verified = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const actionCode = route.query.oobCode as string;
  
  if (!actionCode) {
    error.value = t('auth.invalidVerificationLink');
    loading.value = false;
    return;
  }

  try {
    await applyActionCode(auth, actionCode);
    verified.value = true;
  } catch (err: any) {
    switch (err.code) {
      case 'auth/expired-action-code':
        error.value = t('auth.expiredVerificationLink');
        break;
      case 'auth/invalid-action-code':
        error.value = t('auth.invalidVerificationLinkCheckEmail');
        break;
      case 'auth/user-disabled':
        error.value = t('auth.accountDisabled');
        break;
      default:
        error.value = t('auth.verificationFailed');
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
        <h2 class="text-2xl font-bold text-foreground">{{ t('auth.verifyingEmail') }}</h2>
        <p class="text-muted-foreground">{{ t('auth.verifyingEmailMessage') }}</p>
      </div>

      <!-- Success State -->
      <div v-else-if="verified" class="space-y-6">
        <div class="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-foreground">{{ t('auth.emailVerifiedSuccessfully') }}</h2>
          <p class="text-muted-foreground">
            {{ t('auth.emailVerifiedMessage') }}
          </p>
        </div>

        <Button @click="goToLogin" class="w-full">
          {{ t('auth.continueToDepaTrack') }}
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
          <h2 class="text-2xl font-bold text-foreground">{{ t('auth.verificationFailedTitle') }}</h2>
          <p class="text-muted-foreground">{{ error }}</p>
        </div>

        <Button @click="goToLogin" variant="outline" class="w-full">
          {{ t('auth.backToDepaTrack') }}
        </Button>
      </div>

      <!-- DepaTrack Branding -->
      <div class="pt-8 border-t border-border">
        <h3 class="text-lg font-semibold text-foreground">{{ t('app.title') }}</h3>
        <p class="text-sm text-muted-foreground">{{ t('app.tagline') }}</p>
      </div>
    </div>
  </div>
</template>