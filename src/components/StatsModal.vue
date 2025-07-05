<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { formatCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InformationCircleIcon } from '@heroicons/vue/24/outline';
import { useLanguage } from '@/composables/useLanguage';

interface Props {
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false
});

const emit = defineEmits<{
  close: [];
  'update:open': [value: boolean];
}>();

const propertiesStore = usePropertiesStore();
const { t } = useLanguage();
const activeTooltip = ref<string | null>(null);
let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

const stats = computed(() => propertiesStore.stats);

const processedRate = computed(() => {
  const { total, completed, rejected } = stats.value;
  if (!total || total === 0 || isNaN(total) || isNaN(completed) || isNaN(rejected)) return '0.0';
  return (((completed + rejected) / total) * 100).toFixed(1);
});

const completedBarWidth = computed(() => {
  const { total, completed } = stats.value;
  if (!total || total === 0 || isNaN(total) || isNaN(completed)) return '0%';
  return `${(completed / total) * 100}%`;
});

const rejectedBarWidth = computed(() => {
  const { total, rejected } = stats.value;
  if (!total || total === 0 || isNaN(total) || isNaN(rejected)) return '0%';
  return `${(rejected / total) * 100}%`;
});

function handleClose() {
  // Clear any active tooltip and timeout when closing modal
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  activeTooltip.value = null;
  
  emit('update:open', false);
  emit('close');
}

function toggleTooltip(tooltipId: string) {
  // Clear any existing timeout
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }

  // Toggle tooltip
  if (activeTooltip.value === tooltipId) {
    activeTooltip.value = null;
  } else {
    activeTooltip.value = tooltipId;
    
    // Set timeout to auto-hide after 3 seconds
    tooltipTimeout = setTimeout(() => {
      activeTooltip.value = null;
      tooltipTimeout = null;
    }, 3000);
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>{{ t('stats.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('stats.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-muted/50 rounded-lg p-4 text-center relative">
            <div class="text-2xl font-bold text-foreground">{{ stats.total || 0 }}</div>
            <div class="flex items-center justify-center gap-1">
              <span class="text-sm text-muted-foreground">{{ t('stats.totalProperties') }}</span>
              <button 
                @click="toggleTooltip('total')"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                <InformationCircleIcon class="h-4 w-4" />
              </button>
            </div>
            <!-- Tooltip -->
            <div v-if="activeTooltip === 'total'" 
                 class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-48">
              {{ t('stats.totalTooltip') }}
            </div>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center relative">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(stats.averagePrice || 0) }}</div>
            <div class="flex items-center justify-center gap-1">
              <span class="text-sm text-muted-foreground">{{ t('stats.averagePrice') }}</span>
              <button 
                @click="toggleTooltip('price')"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                <InformationCircleIcon class="h-4 w-4" />
              </button>
            </div>
            <!-- Tooltip -->
            <div v-if="activeTooltip === 'price'" 
                 class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-48">
              {{ t('stats.priceTooltip') }}
            </div>
          </div>
        </div>

        <!-- Status Breakdown -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-foreground">{{ t('stats.statusBreakdown') }}</h3>
          
          <div class="space-y-3">
            <!-- Available -->
            <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg relative">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="text-sm font-medium text-foreground">{{ t('stats.available') }}</span>
                <button 
                  @click="toggleTooltip('available')"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <InformationCircleIcon class="h-3 w-3" />
                </button>
              </div>
              <span class="text-sm font-bold text-foreground">{{ stats.available || 0 }}</span>
              <!-- Tooltip -->
              <div v-if="activeTooltip === 'available'" 
                   class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-60">
                {{ t('stats.availableTooltip') }}
              </div>
            </div>

            <!-- Active -->
            <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg relative">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="text-sm font-medium text-foreground">{{ t('stats.active') }}</span>
                <button 
                  @click="toggleTooltip('active')"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <InformationCircleIcon class="h-3 w-3" />
                </button>
              </div>
              <span class="text-sm font-bold text-foreground">{{ stats.active || 0 }}</span>
              <!-- Tooltip -->
              <div v-if="activeTooltip === 'active'" 
                   class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-64">
                {{ t('stats.activeTooltip') }}
              </div>
            </div>

            <!-- Completed -->
            <div class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg relative">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span class="text-sm font-medium text-foreground">{{ t('stats.completed') }}</span>
                <button 
                  @click="toggleTooltip('completed')"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <InformationCircleIcon class="h-3 w-3" />
                </button>
              </div>
              <span class="text-sm font-bold text-foreground">{{ stats.completed || 0 }}</span>
              <!-- Tooltip -->
              <div v-if="activeTooltip === 'completed'" 
                   class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-60">
                {{ t('stats.completedTooltip') }}
              </div>
            </div>

            <!-- Rejected -->
            <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg relative">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span class="text-sm font-medium text-foreground">{{ t('stats.rejected') }}</span>
                <button 
                  @click="toggleTooltip('rejected')"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <InformationCircleIcon class="h-3 w-3" />
                </button>
              </div>
              <span class="text-sm font-bold text-foreground">{{ stats.rejected || 0 }}</span>
              <!-- Tooltip -->
              <div v-if="activeTooltip === 'rejected'" 
                   class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-64">
                {{ t('stats.rejectedTooltip') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-2 relative">
          <div class="flex justify-between items-center text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <span>{{ t('stats.progress') }}</span>
              <button 
                @click="toggleTooltip('progress')"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                <InformationCircleIcon class="h-3 w-3" />
              </button>
            </div>
            <span>{{ processedRate }}% {{ t('stats.processed') }}</span>
          </div>
          <!-- Tooltip -->
          <div v-if="activeTooltip === 'progress'" 
               class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-md p-2 text-xs text-popover-foreground shadow-md z-10 w-64">
            {{ t('stats.progressTooltip') }}
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div class="flex h-2 rounded-full overflow-hidden">
              <div 
                class="bg-emerald-500 transition-all duration-300" 
                :style="{ width: completedBarWidth }"
              ></div>
              <div 
                class="bg-red-500 transition-all duration-300" 
                :style="{ width: rejectedBarWidth }"
              ></div>
            </div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-emerald-600">{{ t('stats.completed') }}</span>
            <span class="text-red-600">{{ t('stats.rejected') }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" @click="handleClose">
          {{ t('common.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>