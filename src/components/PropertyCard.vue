<script setup lang="ts">
import { ref } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilIcon, TrashIcon, GlobeAltIcon, MapPinIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';
import { openGoogleCalendar } from '@/utils/calendar';
import { usePropertiesStore } from '@/stores/properties';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  property: Property;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
  delete: [property: Property];
  calendarScheduled: [property: Property];
}>();

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();
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

function openLocation(url: string) {
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
  
  return new Intl.DateTimeFormat(t('locale.dateFormat'), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

function handleCalendarSchedule() {
  try {
    openGoogleCalendar(props.property);
    // Don't automatically mark as scheduled - let user do it manually
  } catch (error) {
    console.error('Error opening Google Calendar:', error);
  }
}

function toggleCalendarStatus() {
  try {
    if (props.property.isCalendarScheduled) {
      // Unmark as scheduled
      const formData = {
        zone: props.property.zone,
        price: props.property.price,
        status: props.property.status,
        requirements: props.property.requirements,
        comments: props.property.comments,
        link: props.property.link,
        location: props.property.location,
        whatsapp: props.property.whatsapp,
        appointmentDate: props.property.appointmentDate,
        isCalendarScheduled: false
      };
      propertiesStore.updateProperty(props.property.id, formData);
    } else {
      // Mark as scheduled
      propertiesStore.markCalendarScheduled(props.property.id);
    }
    emit('calendarScheduled', props.property);
  } catch (error) {
    console.error('Error updating calendar status:', error);
  }
}
</script>

<template>
  <div class="bg-background border border-border rounded-md p-4 space-y-3">
    <!-- Main Info (Always Visible) -->
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-foreground">{{ property.zone }}</h3>
        <p class="text-lg font-semibold text-foreground mt-1">{{ formatCurrency(property.price) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Badge :class="PROPERTY_STATUS_COLORS[property.status]">
          {{ t(`status.${property.status}`) }}
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
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{{ t('property.appointment') }}</h4>
        <div class="flex items-center justify-between">
          <p class="text-sm text-foreground">{{ formatDate(property.appointmentDate) }}</p>
          <div class="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              @click="() => handleCalendarSchedule()"
              :title="t('property.openGoogleCalendar')"
              class="text-xs px-2 py-1 h-6"
            >
              <CalendarIcon class="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="() => toggleCalendarStatus()"
              :class="property.isCalendarScheduled ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100' : ''"
              :title="property.isCalendarScheduled ? t('property.markAsNotScheduled') : t('property.markAsScheduled')"
              class="text-xs px-1 py-1 h-6 w-6"
            >
              {{ property.isCalendarScheduled ? '✓' : '○' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Requirements -->
      <div v-if="property.requirements && property.requirements.length > 0">
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{{ t('property.requirements') }}</h4>
        <div class="space-y-1">
          <div v-for="(requirement, index) in property.requirements" :key="index" class="text-sm text-foreground">
            • {{ requirement }}
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div v-if="property.comments">
        <h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{{ t('property.comments') }}</h4>
        <p class="text-sm text-foreground">{{ property.comments }}</p>
      </div>

      <!-- Links -->
      <div v-if="property.link || property.location || property.whatsapp" class="flex gap-2">
        <Button
          v-if="property.link"
          variant="outline"
          size="sm"
          @click="openLink(property.link)"
          class="flex-1 text-xs"
        >
          <GlobeAltIcon class="h-3 w-3 mr-1" />
          {{ t('property.link') }}
        </Button>
        <Button
          v-if="property.location"
          variant="outline"
          size="sm"
          @click="openLocation(property.location)"
          class="flex-1 text-xs"
        >
          <MapPinIcon class="h-3 w-3 mr-1" />
          {{ t('property.location') }}
        </Button>
        <Button
          v-if="property.whatsapp"
          variant="outline"
          size="sm"
          @click="openWhatsApp(property.whatsapp)"
          class="flex-1 text-xs"
        >
          <ChatBubbleOvalLeftIcon class="h-3 w-3 mr-1" />
          {{ t('property.whatsapp') }}
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
          {{ t('common.edit') }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="handleDelete"
          class="flex-1 text-xs"
        >
          <TrashIcon class="h-3 w-3 mr-1" />
          {{ t('common.delete') }}
        </Button>
      </div>
    </div>
  </div>
</template>