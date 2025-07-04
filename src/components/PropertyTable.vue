<script setup lang="ts">
import { computed } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { formatCurrency } from '@/utils/currency';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PencilIcon, TrashIcon, GlobeAltIcon, MapPinIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';
import PropertyCard from '@/components/PropertyCard.vue';
import { openGoogleCalendar } from '@/utils/calendar';

interface Props {
  properties: Property[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
  delete: [property: Property];
  calendarScheduled: [property: Property];
}>();

const propertiesStore = usePropertiesStore();

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
</script>

<template>
  <!-- Desktop Table View -->
  <div class="hidden md:block bg-background border border-border rounded-md overflow-hidden">
    <Table>
      <TableHeader class="bg-background">
        <TableRow class="border-b border-border">
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-32 px-6 text-muted-foreground">Zone</TableHead>
          <TableHead class="text-right text-xs font-medium uppercase tracking-wider w-28 px-6 text-muted-foreground">Price</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-24 px-6 text-muted-foreground">Status</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-40 px-6 text-muted-foreground">Appointment</TableHead>
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-40 px-6 text-muted-foreground">Requirements</TableHead>
          <TableHead class="text-left text-xs font-medium uppercase tracking-wider w-40 px-6 text-muted-foreground">Comments</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-20 px-6 text-muted-foreground">Links</TableHead>
          <TableHead class="text-center text-xs font-medium uppercase tracking-wider w-20 px-6 text-muted-foreground">Actions</TableHead>
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
              {{ PROPERTY_STATUS_LABELS[property.status] }}
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
                  title="Open Google Calendar"
                  class="text-xs px-2 py-1 h-6"
                >
                  <CalendarIcon class="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="() => toggleCalendarStatus(property)"
                  :class="property.isCalendarScheduled ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100' : ''"
                  :title="property.isCalendarScheduled ? 'Mark as not scheduled' : 'Mark as scheduled'"
                  class="text-xs px-1 py-1 h-6 w-6"
                >
                  {{ property.isCalendarScheduled ? '✓' : '○' }}
                </Button>
              </div>
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
                title="Open link"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <GlobeAltIcon class="h-4 w-4" />
              </Button>
              <Button
                v-if="property.location"
                variant="outline"
                size="icon"
                @click="openLocation(property.location)"
                title="Open location"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <MapPinIcon class="h-4 w-4" />
              </Button>
              <Button
                v-if="property.whatsapp"
                variant="outline"
                size="icon"
                @click="openWhatsApp(property.whatsapp)"
                title="Open WhatsApp"
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
                title="Edit property"
                class="h-8 w-8 border-border hover:bg-muted"
              >
                <PencilIcon class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                @click="handleDelete(property)"
                title="Delete property"
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
  <div class="md:hidden space-y-3">
    <PropertyCard
      v-for="property in properties"
      :key="property.id"
      :property="property"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>