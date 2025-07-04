<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePropertiesStore } from '@/stores/properties';
import { PROPERTY_STATUS_LABELS, type PropertyFormData, type PropertyStatus } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline';

interface Props {
  propertyId?: string | null;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false
});

const emit = defineEmits<{
  close: [];
  submit: [];
  'update:open': [value: boolean];
}>();

const propertiesStore = usePropertiesStore();

const formData = ref<PropertyFormData>({
  zone: '',
  price: null,
  status: 'available',
  requirements: [],
  comments: '',
  link: '',
  location: '',
  whatsapp: '',
  appointmentDate: null,
  isCalendarScheduled: false
});

const newRequirement = ref('');

const priceInput = computed({
  get: () => formData.value.price?.toString() ?? '',
  set: (value: string) => {
    formData.value.price = value ? Number(value) : null;
  }
});

const appointmentDateInput = computed({
  get: () => {
    if (!formData.value.appointmentDate) return '';
    
    // Handle both Date objects and ISO string dates
    const date = typeof formData.value.appointmentDate === 'string' 
      ? new Date(formData.value.appointmentDate) 
      : formData.value.appointmentDate;
    
    // Check if the date is valid
    if (!date || isNaN(date.getTime())) return '';
    
    return date.toISOString().slice(0, 16);
  },
  set: (value: string) => {
    formData.value.appointmentDate = value ? new Date(value) : null;
  }
});

const errors = ref<Partial<Record<keyof PropertyFormData, string>>>({});
const isSubmitting = ref(false);

const isEditing = computed(() => !!props.propertyId);
const modalTitle = computed(() => isEditing.value ? 'Edit Property' : 'Add Property');

const statusOptions = computed(() => {
  return Object.entries(PROPERTY_STATUS_LABELS).map(([key, label]) => ({
    value: key as PropertyStatus,
    label
  }));
});

function resetForm() {
  formData.value = {
    zone: '',
    price: null,
    status: 'available',
    requirements: [],
    comments: '',
    link: '',
    location: '',
    whatsapp: '',
    appointmentDate: null,
    isCalendarScheduled: false
  };
  errors.value = {};
  newRequirement.value = '';
}

function loadPropertyData() {
  if (props.propertyId) {
    const property = propertiesStore.getProperty(props.propertyId);
    if (property) {
      formData.value = {
        zone: property.zone,
        price: property.price,
        status: property.status,
        requirements: property.requirements || [],
        comments: property.comments || '',
        link: property.link || '',
        location: property.location || '',
        whatsapp: property.whatsapp || '',
        appointmentDate: property.appointmentDate || null,
        isCalendarScheduled: property.isCalendarScheduled || false
      };
    }
  } else {
    resetForm();
  }
}

onMounted(() => {
  loadPropertyData();
});

watch(() => props.open, (newValue) => {
  if (newValue) {
    loadPropertyData();
  }
});

function validateForm(): boolean {
  errors.value = {};
  
  if (formData.value.price !== null && formData.value.price < 0) {
    errors.value.price = 'Price must be greater than or equal to 0';
  }
  
  if (formData.value.link && !isValidUrl(formData.value.link)) {
    errors.value.link = 'Please enter a valid URL';
  }
  
  if (formData.value.location && !isValidUrl(formData.value.location)) {
    errors.value.location = 'Please enter a valid URL';
  }
  
  if (formData.value.whatsapp && !isValidPhoneNumber(formData.value.whatsapp)) {
    errors.value.whatsapp = 'Please enter a valid phone number';
  }
  
  return Object.keys(errors.value).length === 0;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidPhoneNumber(phone: string): boolean {
  // Basic phone number validation - digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function addRequirement() {
  if (newRequirement.value.trim()) {
    formData.value.requirements = formData.value.requirements || [];
    formData.value.requirements.push(newRequirement.value.trim());
    newRequirement.value = '';
  }
}

function addEmptyRequirement() {
  formData.value.requirements = formData.value.requirements || [];
  formData.value.requirements.push('');
}

function removeRequirement(index: number) {
  if (formData.value.requirements) {
    formData.value.requirements.splice(index, 1);
    // Clean up empty requirements at the end
    while (formData.value.requirements.length > 0 && 
           formData.value.requirements[formData.value.requirements.length - 1].trim() === '') {
      formData.value.requirements.pop();
    }
  }
}

function updateRequirement(index: number, value: string) {
  if (formData.value.requirements) {
    formData.value.requirements[index] = value;
  }
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  try {
    isSubmitting.value = true;
    
    // Clean up empty requirements before saving
    if (formData.value.requirements) {
      formData.value.requirements = formData.value.requirements.filter(req => req.trim() !== '');
    }
    
    if (isEditing.value && props.propertyId) {
      propertiesStore.updateProperty(props.propertyId, formData.value);
    } else {
      propertiesStore.createProperty(formData.value);
    }
    
    emit('submit');
  } catch (error) {
    console.error('Error saving property:', error);
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
  emit('close');
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>{{ modalTitle }}</DialogTitle>
        <DialogDescription>
          Fill in the property information
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="zone">
              Zone
            </Label>
            <Input
              id="zone"
              v-model="formData.zone"
              type="text"
              placeholder="Enter zone or location"
              :class="{ 'border-destructive': errors.zone }"
            />
            <p v-if="errors.zone" class="text-sm text-destructive">{{ errors.zone }}</p>
          </div>

          <div class="space-y-2">
            <Label for="price">
              Price
            </Label>
            <Input
              id="price"
              v-model="priceInput"
              type="number"
              min="0"
              step="1"
              placeholder="Enter price"
              :class="{ 'border-destructive': errors.price }"
            />
            <p v-if="errors.price" class="text-sm text-destructive">{{ errors.price }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="status">Status</Label>
            <Select v-model="formData.status">
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="status in statusOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="appointmentDate">Appointment</Label>
            <Input
              id="appointmentDate"
              v-model="appointmentDateInput"
              type="datetime-local"
              :class="{ 'border-destructive': errors.appointmentDate }"
            />
            <p v-if="errors.appointmentDate" class="text-sm text-destructive">{{ errors.appointmentDate }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <Label>Requirements</Label>
          <div class="space-y-2">
            <!-- Existing requirements -->
            <div v-for="(requirement, index) in formData.requirements || []" :key="index" class="flex gap-2">
              <Input
                v-model="formData.requirements![index]"
                placeholder="Enter requirement"
                class="flex-1"
                @input="updateRequirement(index, ($event.target as HTMLInputElement).value)"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                @click="removeRequirement(index)"
                class="h-10 w-10"
              >
                <XMarkIcon class="h-4 w-4" />
              </Button>
            </div>
            
            <!-- Add new requirement button -->
            <Button
              type="button"
              variant="outline"
              @click="addEmptyRequirement"
              class="w-full h-10 border-dashed"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Add requirement
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="comments">Comments</Label>
          <Textarea
            id="comments"
            v-model="formData.comments"
            placeholder="Enter additional comments or observations"
            class="min-h-[80px]"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="link">Link</Label>
            <Input
              id="link"
              v-model="formData.link"
              type="url"
              placeholder="https://example.com/property"
              :class="{ 'border-destructive': errors.link }"
            />
            <p v-if="errors.link" class="text-sm text-destructive">{{ errors.link }}</p>
          </div>

          <div class="space-y-2">
            <Label for="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              v-model="formData.whatsapp"
              type="tel"
              placeholder="+12345678901"
              :class="{ 'border-destructive': errors.whatsapp }"
            />
            <p v-if="errors.whatsapp" class="text-sm text-destructive">{{ errors.whatsapp }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="location">Location</Label>
          <Input
            id="location"
            v-model="formData.location"
            type="url"
            placeholder="https://maps.google.com/..."
            :class="{ 'border-destructive': errors.location }"
          />
          <p v-if="errors.location" class="text-sm text-destructive">{{ errors.location }}</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Property' : 'Save Property') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>