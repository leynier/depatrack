<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { HeartIcon } from '@heroicons/vue/24/solid';
import { useLanguage } from '@/composables/useLanguage';
import DonationModal from '@/components/DonationModal.vue';

const { t } = useLanguage();
const showDonationModal = ref(false);

const openDonationModal = () => {
  showDonationModal.value = true;
};
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    @click="openDonationModal"
    :title="t('donation.title')"
    class="border-border hover:bg-muted"
  >
    <HeartIcon class="h-4 w-4 text-red-500" />
  </Button>

  <!-- Donation Modal -->
  <DonationModal 
    v-model:open="showDonationModal" 
    @close="showDonationModal = false" 
  />
</template>