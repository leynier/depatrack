import { ref, onMounted, onUnmounted } from 'vue';

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const isOffline = ref(!navigator.onLine);

  function updateNetworkStatus() {
    isOnline.value = navigator.onLine;
    isOffline.value = !navigator.onLine;
  }

  function handleOnline() {
    updateNetworkStatus();
    console.log('Network: Online');
  }

  function handleOffline() {
    updateNetworkStatus();
    console.log('Network: Offline');
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });

  return {
    isOnline,
    isOffline
  };
}