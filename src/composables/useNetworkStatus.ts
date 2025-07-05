import { ref } from 'vue';

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);

const updateStatus = () => {
  isOnline.value = navigator.onLine;
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
}

export function useNetworkStatus() {
  return {
    isOnline,
  };
}