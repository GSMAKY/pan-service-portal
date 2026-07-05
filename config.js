/**
 * ═══════════════════════════════════════════════════════════════
 *  PAN Service Portal — Central Configuration
 *  ═══════════════════════════════════════════════════════════════
 *  Change API_URL and API_KEY here; no frontend code changes needed.
 * ═══════════════════════════════════════════════════════════════
 */

const APP_CONFIG = Object.freeze({
  // ─── Google Apps Script Web App Endpoint ─────────────────────
  API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  
  // ─── API Authentication Key ─────────────────────────────────
  API_KEY: 'your-secret-api-key-change-in-production',

  // ─── App Metadata ────────────────────────────────────────────
  APP_NAME: 'PAN Service Portal',
  APP_VERSION: '2.0.0',
  COMPANY_NAME: 'SecurePAN Services',
  CONTACT_EMAIL: 'support@securepan.in',
  CONTACT_PHONE: '+91-1800-123-4567',

  // ─── Validation Rules ───────────────────────────────────────
  VALIDATION: {
    AADHAAR_LENGTH: 12,
    AADHAAR_PATTERN: /^[2-9]\d{11}$/,
    MAX_REQUESTS_PER_DAY: 5,
    RATE_LIMIT_WINDOW_MS: 24 * 60 * 60 * 1000,
  },

  // ─── UI / UX ────────────────────────────────────────────────
  THEME: {
    PRIMARY_COLOR: '#FF6B35',
    SECONDARY_COLOR: '#FF8C42',
    DARK_BG: '#0F0F1A',
    DARK_CARD: '#1A1A2E',
  },

  // ─── API Endpoints (mapped to 'action' parameter) ───────────
  ENDPOINTS: {
    SUBMIT_PAN_REQUEST: 'submitPanRequest',
    GET_REQUEST_STATUS: 'getRequestStatus',
    ADMIN_LOGIN: 'adminLogin',
    GET_USERS: 'getUsers',
    GET_REQUESTS: 'getRequests',
    GET_TRANSACTIONS: 'getTransactions',
    GET_ANALYTICS: 'getAnalytics',
    GET_LOGS: 'getLogs',
    UPDATE_SETTINGS: 'updateSettings',
    EXPORT_DATA: 'exportData',
  },

  // ─── Feature Flags ──────────────────────────────────────────
  FEATURES: {
    DARK_MODE: true,
    PWA_SUPPORT: true,
    ANIMATIONS: true,
    SKELETON_LOADING: true,
    TOAST_NOTIFICATIONS: true,
  },
});

// Prevent accidental mutation
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'APP_CONFIG', {
    value: APP_CONFIG,
    writable: false,
    configurable: false,
  });
}
