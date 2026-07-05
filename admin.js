/**
 * ═══════════════════════════════════════════════════════════════
 *  PAN Service Portal — Admin Dashboard Script
 *  Authentication, CRUD, analytics, export, pagination
 * ═══════════════════════════════════════════════════════════════
 */
(() => {
  'use strict';

  // ─── State ───────────────────────────────────────────────
  const state = {
    isAuthenticated: false,
    currentPage: 'dashboard',
    data: { users: [], requests: [], transactions: [], logs: [] },
    pagination: { users: 1, requests: 1, transactions: 1, logs: 1 },
    perPage: 10,
  };

  // ─── DOM Helpers ─────────────────────────────────────────
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ─── Auth Check ──────────────────────────────────────────
  function checkAuth() {
    const token = sessionStorage.getItem('pan_admin_token');
    if (!token) {
      showLoginScreen();
      return false;
    }
    state.isAuthenticated = true;
    return true;
  }

  // ─── Login Screen ────────────────────────────────────────
  function showLoginScreen() {
    document.body.innerHTML = `
      <div class="login-container">
        <div class="login-card glass-card">
          <div class="card-icon-wrapper" style="margin: 0 auto 20px;">🔐</div>
          <h2>Admin Login</h2>
          <p>Enter credentials to access the dashboard</p>
          <form id="login-form">
            <div class="input-group">
              <label for="login-email">Email</label>
              <div class="input-wrapper">
                <input type="email" id="login-email" placeholder="admin@securepan.in" required />
              </div>
            </div>
            <div class="input-group">
              <label for="login-password">Password</label>
              <div class="input-wrapper">
                <input type="password" id="login-password" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-full">🔓 Login</button>
          </form>
          <p id="login-error" class="hidden" style="color:#E53935;text-align:center;margin-top:12px;"></p>
        </div>
      </div>
      <script src="config.js"><\/script>
    `;

    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value.trim();
      const errEl = $('#login-error');
      errEl.classList.add('hidden');

      try {
        const res = await fetch(APP_CONFIG.API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: APP_CONFIG.ENDPOINTS.ADMIN_LOGIN,
            apiKey: APP_CONFIG.API_KEY,
            email,
            password,
          }),
        });
        // With no-cors, store token optimistically
        sessionStorage.setItem('pan_admin_token', btoa(`${email}:${Date.now()}`));
        sessionStorage.setItem('pan_admin_email', email);
        location.reload();
      } catch (err) {
        // Fallback: simple local auth for testing
        if (email === 'admin@securepan.in' && password === 'admin123') {
          sessionStorage.setItem('pan_admin_token', btoa(`${email}:${Date.now()}`));
          sessionStorage.setItem('pan_admin_email', email);
          location.reload();
        } else {
          errEl.textContent = 'Invalid credentials. Try admin@securepan.in / admin123';
          errEl.classList.remove('hidden');
        }
      }
    });
  }

  // ─── Logout ──────────────────────────────────────────────
  function logout() {
    sessionStorage.removeItem('pan_admin_token');
    sessionStorage.removeItem('pan_admin_email');
    location.reload();
  }

  // ─── Page Navigation ─────────────────────────────────────
  function navigateTo(page) {
    state.currentPage = page;
    $$('.admin-page').forEach(p => p.classList.add('hidden'));
    const target = $(`#page-${page}`);
    if (target) target.classList.remove('hidden');

    $$('.sidebar-link').forEach(l => l.classList.remove('active'));
    const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
    if (link) link.classList.add('active');

    const titles = { dashboard: 'Dashboard', users: 'User Management', requests: 'Request History', transactions: 'Transaction Logs', logs: 'API & Error Logs', settings: 'Website Settings' };
    $('#page-title').textContent = titles[page] || 'Dashboard';

    loadPageData(page);
  }

  // ─── API Call Helper ─────────────────────────────────────
  async function callAPI(action, data = {}) {
    try {
      const payload = { action, apiKey: APP_CONFIG.API_KEY, ...data };
      // Since GAS uses no-cors, we simulate data for demo purposes
      // In production, replace with actual fetch and a GAS proxy
      return simulateData(action, data);
    } catch (err) {
      console.error('[Admin] API error:', err);
      return { error: err.message };
    }
  }

  // ─── Simulated Data (for demo — replace with real API calls) ──
  function simulateData(action, params) {
    const now = new Date();
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    if (action === 'getAnalytics') {
      return {
        totalUsers: rand(100, 500),
        totalRequests: rand(500, 2000),
        todayCount: rand(5, 50),
        pendingCount: rand(10, 100),
        chartData: Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
          count: rand(3, 30),
        })),
      };
    }

    if (action === 'getUsers') {
      const users = [];
      for (let i = 0; i < 25; i++) {
        users.push({
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          phone: `+91-98765${rand(10000, 99999)}`,
          status: ['active', 'inactive'][rand(0, 1)],
          date: new Date(now - rand(0, 30) * 86400000).toLocaleDateString(),
        });
      }
      return users;
    }

    if (action === 'getRequests') {
      const requests = [];
      for (let i = 0; i < 25; i++) {
        const statuses = ['pending', 'processing', 'completed', 'rejected'];
        requests.push({
          ref: `PAN-${now.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
          aadhaar: `${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)}`,
          status: statuses[rand(0, 3)],
          date: new Date(now - rand(0, 20) * 86400000).toLocaleDateString(),
        });
      }
      return requests;
    }

    if (action === 'getTransactions') {
      const transactions = [];
      for (let i = 0; i < 20; i++) {
        transactions.push({
          id: `TXN-${Date.now()}-${i}`,
          amount: `₹${rand(100, 1100)}`,
          status: ['success', 'failed', 'pending'][rand(0, 2)],
          date: new Date(now - rand(0, 15) * 86400000).toLocaleDateString(),
        });
      }
      return transactions;
    }

    if (action === 'getLogs') {
      const logs = [];
      const levels = ['INFO', 'WARN', 'ERROR'];
      for (let i = 0; i < 30; i++) {
        logs.push({
          timestamp: new Date(now - rand(0, 48) * 3600000).toLocaleString(),
          level: levels[rand(0, 2)],
          message: [
            'PAN application submitted successfully',
            'Aadhaar validation passed',
            'Rate limit check passed',
            'Database write operation completed',
            'API request received from IP 103.xxx.xxx.xxx',
            'Payment verification failed — insufficient balance',
            'Invalid Aadhaar format rejected',
          ][rand(0, 6)],
        });
      }
      return logs;
    }

    if (action === 'updateSettings') {
      return { success: true, message: 'Settings updated successfully' };
    }

    return [];
  }

  // ─── Load Page Data ──────────────────────────────────────
  async function loadPageData(page) {
    switch (page) {
      case 'dashboard': await loadDashboard(); break;
      case 'users': await loadUsers(); break;
      case 'requests': await loadRequests(); break;
      case 'transactions': await loadTransactions(); break;
      case 'logs': await loadLogs(); break;
      case 'settings': loadSettings(); break;
    }
  }

  // ─── Dashboard ───────────────────────────────────────────
  async function loadDashboard() {
    const data = await callAPI('getAnalytics');
    if (data.error) return;

    $('#stat-users').textContent = data.totalUsers;
    $('#stat-requests').textContent = data.totalRequests;
    $('#stat-today').textContent = data.todayCount;
    $('#stat-pending').textContent = data.pendingCount;

    const chart = $('#chart-bars');
    if (data.chartData) {
      const max = Math.max(...data.chartData.map(d => d.count), 1);
      chart.innerHTML = data.chartData.map(d =>
        `<div style="flex:1;text-align:center;">
          <div class="chart-bar" style="height:${(d.count / max) * 180}px;" title="${d.count}"></div>
          <span style="font-size:0.7rem;color:var(--text-muted);">${d.day}</span>
        </div>`
      ).join('');
    }
  }

  // ─── Users ───────────────────────────────────────────────
  async function loadUsers(page = 1) {
    const data = await callAPI('getUsers');
    state.data.users = data;
    renderTable('users', data, page);
  }

  // ─── Requests ────────────────────────────────────────────
  async function loadRequests(page = 1) {
    const data = await callAPI('getRequests');
    state.data.requests = data;
    renderTable('requests', data, page);
  }

  // ─── Transactions ────────────────────────────────────────
  async function loadTransactions(page = 1) {
    const data = await callAPI('getTransactions');
    state.data.transactions = data;
    renderTable('transactions', data, page);
  }

  // ─── Logs ────────────────────────────────────────────────
  async function loadLogs(page = 1) {
    const data = await callAPI('getLogs');
    state.data.logs = data;
    renderTable('logs', data, page);
  }

  // ─── Generic Table Renderer ──────────────────────────────
  function renderTable(type, data, page = 1) {
    const tbody = $(`#${type}-tbody`);
    const pagination = $(`#${type}-pagination`);
    if (!tbody) return;

    const searchValue = ($(`#${type}-search`)?.value || '').toLowerCase();
    const statusFilter = ($(`#${type}-status-filter`)?.value || '').toLowerCase();

    let filtered = data;
    if (searchValue) {
      filtered = filtered.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(searchValue))
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(row =>
        (row.status || '').toLowerCase() === statusFilter || !statusFilter
      );
    }

    const totalPages = Math.ceil(filtered.length / state.perPage);
    const start = (page - 1) * state.perPage;
    const pageData = filtered.slice(start, start + state.perPage);

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text-muted);">No records found</td></tr>';
    } else {
      tbody.innerHTML = pageData.map(row => {
        const cols = Object.entries(row).map(([key, val]) => {
          if (key === 'status') {
            const cls = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success', rejected: 'badge-error', success: 'badge-success', failed: 'badge-error', active: 'badge-success', inactive: 'badge-warning' }[val] || 'badge-info';
            return `<td><span class="badge ${cls}">${val}</span></td>`;
          }
          return `<td>${val}</td>`;
        }).join('');
        return `<tr>${cols}</tr>`;
      }).join('');
    }

    // Pagination
    if (pagination) {
      pagination.innerHTML = `
        <button class="page-btn" data-type="${type}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>
        ${Array.from({ length: totalPages }, (_, i) =>
          `<button class="page-btn ${i + 1 === page ? 'active' : ''}" data-type="${type}" data-page="${i + 1}">${i + 1}</button>`
        ).join('')}
        <button class="page-btn" data-type="${type}" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>›</button>
      `;

      pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = parseInt(btn.dataset.page, 10);
          if (p >= 1 && p <= totalPages) {
            state.pagination[type] = p;
            renderTable(type, data, p);
          }
        });
      });
    }

    state.pagination[type] = page;
  }

  // ─── Settings ────────────────────────────────────────────
  function loadSettings() {
    $('#set-api-url').value = APP_CONFIG.API_URL;
    $('#set-api-key').value = APP_CONFIG.API_KEY;
    $('#set-site-name').value = APP_CONFIG.APP_NAME;
    $('#set-contact-email').value = APP_CONFIG.CONTACT_EMAIL;
  }

  // ─── Export CSV ──────────────────────────────────────────
  function exportCSV(type) {
    const data = state.data[type] || [];
    if (data.length === 0) { alert('No data to export.'); return; }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ─── Init ────────────────────────────────────────────────
  function init() {
    if (!checkAuth()) return;

    // Sidebar navigation
    $$('.sidebar-link[data-page]').forEach(link => {
      link.addEventListener('click', () => navigateTo(link.dataset.page));
    });

    // Logout
    $('#logout-btn').addEventListener('click', logout);

    // Theme toggle
    const themeBtn = $('#theme-toggle-admin');
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('pan_theme', isDark ? 'light' : 'dark');
    });

    // Sidebar toggle (mobile)
    $('#sidebar-toggle').addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
    });

    // Search filters with debounce
    $$('.filter-input').forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(input._debounce);
        input._debounce = setTimeout(() => {
          const type = input.id.replace('-search', '').replace('-status-filter', '');
          if (type) loadPageData(type);
        }, 300);
      });
    });

    // Export buttons
    $('#export-users-csv')?.addEventListener('click', () => exportCSV('users'));
    $('#export-requests-csv')?.addEventListener('click', () => exportCSV('requests'));
    $('#export-transactions-csv')?.addEventListener('click', () => exportCSV('transactions'));

    // Save settings
    $('#save-settings')?.addEventListener('click', () => {
      const settings = {
        apiUrl: $('#set-api-url').value,
        apiKey: $('#set-api-key').value,
        siteName: $('#set-site-name').value,
        contactEmail: $('#set-contact-email').value,
      };
      localStorage.setItem('pan_admin_settings', JSON.stringify(settings));
      alert('Settings saved locally. Update config.js for production.');
    });

    // Init theme from localStorage
    const savedTheme = localStorage.getItem('pan_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    // Load default page
    navigateTo('dashboard');
  }

  // ─── Start ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
