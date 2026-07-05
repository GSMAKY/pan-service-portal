/**
 * ═══════════════════════════════════════════════════════════════
 *  PAN Service Portal — Frontend Script
 *  Form validation, API calls, UI interactions, animations
 * ═══════════════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  // ─── DOM References ──────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const form = $('#pan-form');
  const aadhaarInput = $('#aadhaar');
  const submitBtn = $('#submit-btn');
  const resultContainer = $('#result-container');
  const skeletonLoader = $('#skeleton-loader');
  const globalLoader = $('#global-loader');
  const toastContainer = $('#toast-container');
  const themeToggle = $('#theme-toggle');
  const hamburger = $('#hamburger');
  const headerNav = $('#header-nav');
  const header = $('#main-header');

  // ─── State ───────────────────────────────────────────────
  let isSubmitting = false;
  let rateLimitStore = {};

  // ─── Toast Notification System ───────────────────────────
  function showToast(message, type = 'info', duration = 4000) {
    if (!toastContainer) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ─── Aadhaar Validation ──────────────────────────────────
  function validateAadhaar(value) {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length !== 12) return false;
    if (!/^[2-9]\d{11}$/.test(cleaned)) return false;

    // Verhoeff check-digit validation for Aadhaar
    const d = Array.from(cleaned, Number);
    const verhoeffTable = [
      [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
      [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
      [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
      [9,8,7,6,5,4,3,2,1,0]
    ];
    const pTable = [
      [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
      [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
      [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
    ];

    let c = 0;
    for (let i = 0; i < d.length; i++) {
      c = verhoeffTable[c][pTable[(i + 1) % 8][d[d.length - 1 - i]]];
    }
    return c === 0;
  }

  // ─── Format Aadhaar Input ────────────────────────────────
  function formatAadhaar(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formatted;

    const cleaned = val;
    const group = aadhaarInput.closest('.input-group');

    if (cleaned.length === 12) {
      const isValid = validateAadhaar(cleaned);
      group.classList.remove('error', 'valid');
      group.classList.add(isValid ? 'valid' : 'error');
      submitBtn.disabled = !isValid;
    } else {
      group.classList.remove('error', 'valid');
      submitBtn.disabled = true;
    }
  }

  // ─── Rate Limiting Check ─────────────────────────────────
  function checkRateLimit() {
    const key = `pan_rate_${new Date().toDateString()}`;
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) : 0;
    const max = APP_CONFIG.VALIDATION.MAX_REQUESTS_PER_DAY;

    if (count >= max) {
      showToast(`Daily limit reached (${max}/${max}). Try again tomorrow.`, 'error', 6000);
      return false;
    }
    return true;
  }

  function incrementRateLimit() {
    const key = `pan_rate_${new Date().toDateString()}`;
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) : 0;
    localStorage.setItem(key, count + 1);
  }

  // ─── Form Submit Handler ─────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;
    if (!checkRateLimit()) return;

    const aadhaarRaw = aadhaarInput.value.replace(/\s/g, '');
    if (!validateAadhaar(aadhaarRaw)) {
      showToast('Please enter a valid 12-digit Aadhaar number.', 'error');
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.btn-loader').classList.remove('hidden');
    skeletonLoader.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    const requestId = `PAN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    try {
      const payload = {
        action: APP_CONFIG.ENDPOINTS.SUBMIT_PAN_REQUEST,
        apiKey: APP_CONFIG.API_KEY,
        aadhaar: aadhaarRaw,
        requestId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      const response = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for GAS Web App
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // GAS with no-cors returns opaque — treat as success if no network error
      incrementRateLimit();

      skeletonLoader.classList.add('hidden');
      resultContainer.classList.remove('hidden');

      const successEl = resultContainer.querySelector('.success');
      const errorEl = resultContainer.querySelector('.error');
      successEl.classList.remove('hidden');
      errorEl.classList.add('hidden');
      $('#ref-number').textContent = requestId;
      $('#result-message').innerHTML = `Your PAN application reference number is <strong>${requestId}</strong>. We will process it shortly.`;

      showToast('Application submitted successfully!', 'success');
      form.reset();
      aadhaarInput.closest('.input-group').classList.remove('valid');

    } catch (err) {
      skeletonLoader.classList.add('hidden');
      resultContainer.classList.remove('hidden');
      const successEl = resultContainer.querySelector('.success');
      const errorEl = resultContainer.querySelector('.error');
      successEl.classList.add('hidden');
      errorEl.classList.remove('hidden');
      $('#error-message').textContent = 'Network error. Please check your connection and try again.';

      showToast('Submission failed. Please try again.', 'error');
      console.error('[PAN Portal] Submit error:', err);
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').classList.remove('hidden');
      submitBtn.querySelector('.btn-loader').classList.add('hidden');
    }
  }

  // ─── Theme Toggle ────────────────────────────────────────
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('pan_theme', isDark ? 'light' : 'dark');

    const moon = themeToggle.querySelector('.icon-moon');
    const sun = themeToggle.querySelector('.icon-sun');
    moon.classList.toggle('hidden');
    sun.classList.toggle('hidden');
  }

  function initTheme() {
    const saved = localStorage.getItem('pan_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.querySelector('.icon-moon').classList.add('hidden');
      themeToggle.querySelector('.icon-sun').classList.remove('hidden');
    }
  }

  // ─── Mobile Nav Toggle ───────────────────────────────────
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    headerNav.classList.toggle('open');
  });

  // Close nav on link click (mobile)
  headerNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      headerNav.classList.remove('open');
    });
  });

  // ─── Scroll Effects ─────────────────────────────────────
  let last
$$
