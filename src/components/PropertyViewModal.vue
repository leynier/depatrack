<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { useLanguage } from '@/composables/useLanguage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PencilIcon, GlobeAltIcon, MapPinIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';

interface Props {
  open: boolean;
  property: Property | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  edit: [id: string];
}>();

const { t } = useLanguage();

const formattedAppointmentDate = computed(() => {
  if (!props.property?.appointmentDate) return '-';
  
  const date = typeof props.property.appointmentDate === 'string' 
    ? new Date(props.property.appointmentDate) 
    : props.property.appointmentDate;
    
  if (!date || isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat(t('locale.dateFormat'), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
});

const formattedCreatedDate = computed(() => {
  if (!props.property?.createdAt) return '-';
  
  const date = typeof props.property.createdAt === 'string' 
    ? new Date(props.property.createdAt) 
    : props.property.createdAt;
    
  if (!date || isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat(t('locale.dateFormat'), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
});

const formattedUpdatedDate = computed(() => {
  if (!props.property?.updatedAt) return '-';
  
  const date = typeof props.property.updatedAt === 'string' 
    ? new Date(props.property.updatedAt) 
    : props.property.updatedAt;
    
  if (!date || isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat(t('locale.dateFormat'), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
});

function handleEdit() {
  if (props.property) {
    emit('edit', props.property.id);
    emit('update:open', false);
  }
}

function handleClose() {
  emit('update:open', false);
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
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>{{ t('property.viewProperty') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('property.viewPropertyDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="property" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {{ t('property.zone') }}
              </h3>
              <p class="text-lg font-semibold text-foreground">{{ property.zone }}</p>
            </div>

            <div>
              <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {{ t('property.price') }}
              </h3>
              <p class="text-lg font-semibold text-foreground">{{ formatCurrency(property.price) }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {{ t('property.status') }}
              </h3>
              <Badge :class="PROPERTY_STATUS_COLORS[property.status]">
                {{ t(`status.${property.status}`) }}
              </Badge>
            </div>

            <div v-if="property.realEstate">
              <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {{ t('property.realEstate') }}
              </h3>
              <p class="text-sm text-foreground">{{ property.realEstate }}</p>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Appointment Information -->
        <div v-if="property.appointmentDate">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {{ t('property.appointment') }}
          </h3>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <CalendarIcon class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm text-foreground">{{ formattedAppointmentDate }}</span>
            </div>
            <Badge 
              :variant="property.isCalendarScheduled ? 'default' : 'outline'" 
              class="text-xs"
            >
              {{ property.isCalendarScheduled ? t('property.scheduled') : t('property.notScheduled') }}
            </Badge>
          </div>
        </div>

        <!-- Requirements -->
        <div v-if="property.requirements && property.requirements.length > 0">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {{ t('property.requirements') }}
          </h3>
          <ul class="space-y-2">
            <li 
              v-for="(requirement, index) in property.requirements" 
              :key="index"
              class="flex items-start gap-2 text-sm text-foreground"
            >
              <span class="text-muted-foreground mt-1">•</span>
              <span>{{ requirement }}</span>
            </li>
          </ul>
        </div>

        <!-- Comments -->
        <div v-if="property.comments">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {{ t('property.comments') }}
          </h3>
          <p class="text-sm text-foreground whitespace-pre-wrap">{{ property.comments }}</p>
        </div>

        <!-- Links and Actions -->
        <div v-if="property.link || property.location || property.whatsapp">
          <h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {{ t('property.links') }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="property.link"
              variant="outline"
              size="sm"
              @click="openLink(property.link)"
              class="text-xs"
            >
              <GlobeAltIcon class="h-4 w-4 mr-2" />
              {{ t('property.openLink') }}
            </Button>
            <Button
              v-if="property.location"
              variant="outline"
              size="sm"
              @click="openLocation(property.location)"
              class="text-xs"
            >
              <MapPinIcon class="h-4 w-4 mr-2" />
              {{ t('property.openLocation') }}
            </Button>
            <Button
              v-if="property.whatsapp"
              variant="outline"
              size="sm"
              @click="openWhatsApp(property.whatsapp)"
              class="text-xs"
            >
              <ChatBubbleOvalLeftIcon class="h-4 w-4 mr-2" />
              {{ t('property.openWhatsApp') }}
            </Button>
          </div>
        </div>

        <Separator />

        <!-- Metadata -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span class="font-medium">{{ t('property.createdAt') }}:</span>
            <br>
            {{ formattedCreatedDate }}
          </div>
          <div>
            <span class="font-medium">{{ t('property.updatedAt') }}:</span>
            <br>
            {{ formattedUpdatedDate }}
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-between items-center pt-4 border-t border-border">
          <Button
            variant="outline"
            @click="handleEdit"
            v-if="property"
            class="flex items-center gap-2"
          >
            <PencilIcon class="h-4 w-4" />
            {{ t('common.edit') }}
          </Button>
          <div v-else></div>
          
          <Button variant="outline" @click="handleClose">
            {{ t('common.close') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>