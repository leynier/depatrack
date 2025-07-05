<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppMain from '@/components/AppMain.vue';
import AuthDialog from '@/components/AuthDialog.vue';

const route = useRoute();
const router = useRouter();
const showAuthDialog = ref(false);

onMounted(() => {
  // Check if we should auto-open the auth dialog
  if (route.query.openAuth === 'true') {
    showAuthDialog.value = true;
    // Clean up the URL by removing the query parameter
    router.replace({ query: { ...route.query, openAuth: undefined } });
  }
});
</script>

<template>
  <div>
    <AppHeader />
    <AppMain />
    
    <!-- Auth Dialog for auto-open after email verification -->
    <AuthDialog v-model:open="showAuthDialog" />
  </div>
</template>