/**
 * Utility to unregister Service Workers, wipe CacheStorage, and hard-reload the PWA
 */
export async function clearCacheAndReload(): Promise<void> {
  try {
    // 1. Unregister all Service Worker registrations
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }

    // 2. Delete all CacheStorage entries
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.error('Failed to completely clear cache:', error);
  }

  // 3. Force hard reload bypassing disk cache with timestamp query param
  const url = new URL(window.location.href);
  url.searchParams.set('ts', Date.now().toString());
  window.location.replace(url.toString());
}
