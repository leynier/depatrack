<script setup lang="ts">
import { ref } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilIcon, TrashIcon, GlobeAltIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';

interface Props {
  property: Property;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
  delete: [property: Property];
}>();

const isExpanded = ref(false);

function handleEdit() {
  emit('edit', props.property.id);
}

function handleDelete() {
  emit('delete', props.property);
}

function openLink(url: string) {
  if (url) {
    window.open(url, '_blank');
  }
}

function openWhatsApp(phoneNumber: string) {
  if (phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  }
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function formatDate(date: Date | string | null | undefined): string {
  // Return dash if no date provided
  if (!date) {
    return '-';
  }
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verify that the date is valid before formatting
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}
</script>

<template>
  <div class="bg-card border border-border rounded-md p-4 space-y-3">
    <!-- Main Info (Always Visible) -->
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-foreground">{{ property.zone }}</h3>
        <p class="text-lg font-semibold text-foreground mt-1">{{ formatCurrency(property.price) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Badge :class="PROPERTY_STATUS_COLORS[property.status]">
          {{ PROPERTY_STATUS_LABELS[property.status] }}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          @click="toggleExpanded"
          class="h-8 w-8"
        >
          <ChevronDownIcon v-if="!isExpanded" class="h-4 w-4" />
          <ChevronUpIcon v-else class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Expanded Details -->
    <div v-if="isExpanded" class="space-y-3 border-t border-border pt-3">
      <!-- Appointment -->
      <div v-if="property.appointmentDate">
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Appointment</h4>
        <p class="text-sm text-foreground">{{ formatDate(property.appointmentDate) }}</p>
      </div>

      <!-- Requirements -->
      <div v-if="property.requirements">
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Requirements</h4>
        <p class="text-sm text-foreground">{{ property.requirements }}</p>
      </div>

      <!-- Comments -->
      <div v-if="property.comments">
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Comments</h4>
        <p class="text-sm text-foreground">{{ property.comments }}</p>
      </div>

      <!-- Links -->
      <div v-if="property.link || property.whatsapp" class="flex gap-2">
        <Button
          v-if="property.link"
          variant="outline"
          size="sm"
          @click="openLink(property.link)"
          class="flex-1 text-xs"
        >
          <GlobeAltIcon class="h-3 w-3 mr-1" />
          Link
        </Button>
        <Button
          v-if="property.whatsapp"
          variant="outline"
          size="sm"
          @click="openWhatsApp(property.whatsapp)"
          class="flex-1 text-xs"
        >
          <ChatBubbleOvalLeftIcon class="h-3 w-3 mr-1" />
          WhatsApp
        </Button>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="handleEdit"
          class="flex-1 text-xs"
        >
          <PencilIcon class="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="handleDelete"
          class="flex-1 text-xs"
        >
          <TrashIcon class="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>