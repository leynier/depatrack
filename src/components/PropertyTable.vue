<script setup lang="ts">
import { useLanguage } from '@/composables/useLanguage';
import { computed, ref } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { formatCurrency } from '@/utils/currency';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PencilIcon, TrashIcon, GlobeAltIcon, MapPinIcon, CalendarIcon, ChevronUpIcon, ChevronDownIcon, Bars3BottomLeftIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';
import PropertyCard from '@/components/PropertyCard.vue';
import SortModal from '@/components/SortModal.vue';
import { openGoogleCalendar } from '@/utils/calendar';
import type { SortField } from '@/types/property';

interface Props {
  properties: Property[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
  delete: [property: Property];
  calendarScheduled: [property: Property];
}>();

const { t } = useLanguage();
const propertiesStore = usePropertiesStore();

const showSortModal = ref(false);

const sortOptions: Array<{ field: SortField; label: string }> = [
  { field: 'zone', label: t('property.zone') },
  { field: 'price', label: t('property.price') },
  { field: 'status', label: t('property.status') },
  { field: 'appointmentDate', label: t('property.appointment') }
];

const currentSortLabel = computed(() => {
  const currentSort = propertiesStore.sort;
  const option = sortOptions.find(opt => opt.field === currentSort.field);
  return option ? option.label : '';
});

const currentSortIcon = computed(() => {
  const currentSort = propertiesStore.sort;
  return currentSort.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon;
});

function handleEdit(id: string) {
  emit('edit', id);
}

function handleDelete(property: Property) {
  emit('delete', property);
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
    // Clean the phone number - remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  }
}

function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj);
}

function handleCalendarSchedule(property: Property) {
  try {
    openGoogleCalendar(property);
    // Don't automatically mark as scheduled - let user do it manually
  } catch (error) {
    console.error('Error opening Google Calendar:', error);
  }
}

function toggleCalendarStatus(property: Property) {
  try {
    if (property.isCalendarScheduled) {
      // Unmark as scheduled
      const formData = {
        zone: property.zone,
        price: property.price,
        status: property.status,
        requirements: property.requirements,
        comments: property.comments,
        link: property.link,
        location: property.location,
        whatsapp: property.whatsapp,
        appointmentDate: property.appointmentDate,
        isCalendarScheduled: false
      };
      propertiesStore.updateProperty(property.id, formData);
    } else {
      // Mark as scheduled
      propertiesStore.markCalendarScheduled(property.id);
    }
    emit('calendarScheduled', property);
  } catch (error) {
    console.error('Error updating calendar status:', error);
  }
}

function handleSort(field: SortField) {
  propertiesStore.setSortField(field);
}

function getSortIcon(field: SortField) {
  if (propertiesStore.sort.field !== field) {
    return null;
  }
  return propertiesStore.sort.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon;
}
</script>

<template>
  <!-- Desktop Table View -->
  <div class="hidden md:block bg-background border border-border rounded-md overflow-hidden">
    <Table>
      <TableHeader class="bg-background">
        <TableRow class="border-b border-border">
          <TableHead class="w-32 px-6">
            <button 
              @click="handleSort('zone')"
              class="flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ t('property.zone') }}
              <component :is="getSortIcon('zone')" v-if="getSortIcon('zone')" class="h-3 w-3" />
            </button>
          </TableHead>
          <TableHead class="w-28 px-6">
            <button 
              @click="handleSort('price')"
              class="flex items-center gap-1 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-end"
            >
              {{ t('property.price') }}
              <component :is="getSortIcon('price')" v-if="getSortIcon('price')" class="h-3 w-3" />
            </button>
          </TableHead>
          <TableHead class="w-24 px-6">
            <button 
              @click="handleSort('status')"
              class="flex items-center gap-1 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {{ t('property.status') }}
              <component :is="getSortIcon('status')" v-if="getSortIcon('status')" class="h-3 w-3" />
            </button>
          </TableHead>
          <TableHead class="w-40 px-6">
            <button 
              @click="handleSort('appointmentDate')"
              class="flex items-center gap-1 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
            >
              {{ t('property.appointment') }}
              <component :is="getSortIcon('appointmentDate')" v-if="getSortIcon('appointmentDate')" class="h-3 w-3" />
            </button>
          </TableHead>
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-32 px-6 text-muted-foreground">{{ t('property.realEstate') }}</TableHead>
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-40 px-6 text-muted-foreground">{{ t('property.requirements') }}</TableHead>
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-40 px-6 text-muted-foreground">{{ t('property.comments') }}</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-20 px-6 text-muted-foreground">{{ t('property.links') }}</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-20 px-6 text-muted-foreground">{{ t('common.actions') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody class="bg-background divide-y divide-border">
        <TableRow v-for="property in properties" :key="property.id" class="hover:bg-muted/50 transition-colors">
          <TableCell class="py-4 px-6">
            <div class="text-sm font-medium text-foreground">{{ property.zone }}</div>
          </TableCell>
          
          <TableCell class="py-4 px-6 text-right">
            <div class="text-sm font-medium text-foreground">
              {{ formatCurrency(property.price) }}
            </div>
          </TableCell>
          
          <TableCell class="py-4 px-6 text-center">
            <Badge :class="PROPERTY_STATUS_COLORS[property.status]">
              {{ t(`status.${property.status}`) }}
            </Badge>
          </TableCell>

          <TableCell class="py-4 px-6 text-center">
            <div v-if="property.appointmentDate" class="flex flex-col items-center gap-1">
              <div class="text-sm text-foreground">
                {{ formatDate(property.appointmentDate) }}
              </div>
              <div class="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  @click="() => handleCalendarSchedule(property)"
                  :title="t('property.openGoogleCalendar')"
                  class="text-xs px-2 py-1 h-6"
                >
                  <CalendarIcon class="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="() => toggleCalendarStatus(property)"
                  :class="property.isCalendarScheduled ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100' : ''"
                  :title="property.isCalendarScheduled ? t('property.markAsNotScheduled') : t('property.markAsScheduled')"
                  class="text-xs px-1 py-1 h-6 w-6"
                >
                  {{ property.isCalendarScheduled ? '✓' : '○' }}
                </Button>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground">-</div>
          </TableCell>
          
          <TableCell class="py-4 px-6 max-w-[200px]">
            <div
              v-if="property.realEstate"
              class="text-sm text-foreground truncate"
              :title="property.realEstate"
            >
              {{ truncateText(property.realEstate, 30) }}
            </div>
            <div v-else class="text-sm text-muted-foreground">-</div>
          </TableCell>
          
          <TableCell class="py-4 px-6 max-w-[250px]">
            <div
              v-if="property.requirements && property.requirements.length > 0"
              class="text-sm text-foreground"
            >
              <div v-for="(requirement, index) in property.requirements" :key="index" class="truncate" :title="requirement">
                • {{ truncateText(requirement, 35) }}
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground">-</div>
          </TableCell>
          
          <TableCell class="py-4 px-6 max-w-[250px]">
            <div
              v-if="property.comments"
              class="text-sm text-foreground truncate"
              :title="property.comments"
            >
              {{ truncateText(property.comments, 40) }}
            </div>
            <div v-else class="text-sm text-muted-foreground">-</div>
          </TableCell>
          
          <TableCell class="py-4 px-6">
            <div class="flex justify-center space-x-2">
              <Button
                v-if="property.link"
                variant="outline"
                size="icon"
                @click="openLink(property.link)"
                :title="t('property.openLink')"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <GlobeAltIcon class="h-4 w-4" />
              </Button>
              <Button
                v-if="property.location"
                variant="outline"
                size="icon"
                @click="openLocation(property.location)"
                :title="t('property.openLocation')"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <MapPinIcon class="h-4 w-4" />
              </Button>
              <Button
                v-if="property.whatsapp"
                variant="outline"
                size="icon"
                @click="openWhatsApp(property.whatsapp)"
                :title="t('property.openWhatsApp')"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <ChatBubbleOvalLeftIcon class="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
          
          <TableCell class="py-4 px-6">
            <div class="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                @click="handleEdit(property.id)"
                :title="t('property.editProperty')"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                @click="handleDelete(property)"
                :title="t('property.deleteProperty')"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <TrashIcon class="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <!-- Mobile Card View -->
  <div class="md:hidden space-y-2">
    <!-- Sort Controls for Mobile -->
    <div class="flex items-center justify-between bg-background border border-border rounded-md p-3">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">{{ t('sort.sortedBy') }}</span>
        <Badge variant="outline" class="text-xs">
          {{ currentSortLabel }}
          <component :is="currentSortIcon" class="h-3 w-3 ml-1" />
        </Badge>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="showSortModal = true"
        class="text-xs"
      >
        <Bars3BottomLeftIcon class="h-4 w-4 mr-1" />
        {{ t('sort.sort') }}
      </Button>
    </div>

    <!-- Property Cards -->
    <PropertyCard
      v-for="property in properties"
      :key="property.id"
      :property="property"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Sort Modal -->
    <SortModal v-model:open="showSortModal" />
  </div>
</template>