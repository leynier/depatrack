<script setup lang="ts">
import { ref } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { usePropertiesStore } from '@/stores/properties';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, type Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PencilIcon, TrashIcon, LinkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline';
import { ChatBubbleOvalLeftIcon } from '@heroicons/vue/24/solid';

interface Props {
  properties: Property[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
}>();

const propertiesStore = usePropertiesStore();
const expandedCards = ref<Set<string>>(new Set());

function handleEdit(id: string) {
  emit('edit', id);
}

function handleDelete(property: Property) {
  if (confirm(`Are you sure you want to delete the property in ${property.zone}?`)) {
    propertiesStore.deleteProperty(property.id);
  }
}

function openLink(url: string) {
  if (url) {
    window.open(url, '_blank');
  }
}

function openWhatsApp(url: string) {
  if (url) {
    window.open(url, '_blank');
  }
}

function toggleExpanded(propertyId: string) {
  if (expandedCards.value.has(propertyId)) {
    expandedCards.value.delete(propertyId);
  } else {
    expandedCards.value.add(propertyId);
  }
}

function isExpanded(propertyId: string) {
  return expandedCards.value.has(propertyId);
}
</script>

<template>
  <div class="md:hidden space-y-4">
    <Card
      v-for="property in properties"
      :key="property.id"
    >
      <CardContent class="p-4">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-base font-semibold">{{ property.zone }}</h3>
            <div class="text-xl font-bold mt-1">
              {{ formatCurrency(property.price) }}
            </div>
          </div>
          <Badge :class="PROPERTY_STATUS_COLORS[property.status]">
            {{ PROPERTY_STATUS_LABELS[property.status] }}
          </Badge>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-1">
            <Button
              v-if="property.link"
              variant="ghost"
              size="icon"
              @click="openLink(property.link)"
              title="Open property link"
            >
              <LinkIcon class="h-4 w-4" />
            </Button>
            <Button
              v-if="property.whatsapp"
              variant="ghost"
              size="icon"
              @click="openWhatsApp(property.whatsapp)"
              title="Open WhatsApp"
            >
              <ChatBubbleOvalLeftIcon class="h-4 w-4" />
            </Button>
          </div>

          <div class="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              @click="handleEdit(property.id)"
              title="Edit property"
            >
              <PencilIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="handleDelete(property)"
              title="Delete property"
            >
              <TrashIcon class="h-4 w-4" />
            </Button>
            <Button
              v-if="property.requirements || property.comments"
              variant="ghost"
              size="icon"
              @click="toggleExpanded(property.id)"
              :title="isExpanded(property.id) ? 'Hide details' : 'Show details'"
            >
              <ChevronDownIcon v-if="!isExpanded(property.id)" class="h-4 w-4" />
              <ChevronUpIcon v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          v-if="isExpanded(property.id) && (property.requirements || property.comments)"
          class="mt-4 pt-4 space-y-3"
        >
          <Separator />
          <div v-if="property.requirements">
            <div class="text-xs font-medium text-muted-foreground mb-1">Requirements:</div>
            <div class="text-sm">{{ property.requirements }}</div>
          </div>

          <div v-if="property.comments">
            <div class="text-xs font-medium text-muted-foreground mb-1">Comments:</div>
            <div class="text-sm">{{ property.comments }}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>