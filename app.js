/**
 * ═══════════════════════════════════════════════════════════════
 *  PAN Service Portal — PWA Service Worker Registration
 * ═══════════════════════════════════════════════════════════════
 */
(() => {
  'use strict';

  if ('serviceWorker' in navigator && APP_CONFIG.FEATURES.PWA_SUPPORT) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('sw.js', {
          scope: '/',
        });
        console.log('[SW] Registered:', registration.scope);
      } catch (err) {
        console.warn('[SW] Registration failed:', err.message);
      }
    });
  }
})();
