const API = '/api';

function getCurrentUserId() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('crm_current_user') || 'null');
    return currentUser?.id || currentUser?.username || 'default';
  } catch {
    return 'default';
  }
}

// ===== API HELPER =====
async function apiFetch(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': getCurrentUserId(),
      ...(options.headers || {})
    };
    const res = await fetch(API + url, { headers, ...options });
    return await res.json();
  } catch (err) {
    showToast('Server se connect nahi ho pa raha!', 'error');
    return null;
  }
}

// ===== TOAST =====
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
  toast.className = `toast ${type}`;
  toast.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">${type==='success'?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'}</svg>${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== CONFIRM MODAL =====
function confirmDelete(message, onConfirm) {
  // Custom styled confirm modal
  let overlay = document.getElementById('confirm-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.className = 'modal-overlay confirm-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-body">
          <div class="confirm-icon">🗑️</div>
          <h4>Are you sure?</h4>
          <p id="confirm-msg"></p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn-danger" id="confirm-ok" style="padding:9px 18px">Yes, Delete</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById('confirm-msg').textContent = message;
  overlay.classList.add('active');
  document.getElementById('confirm-cancel').onclick = () => overlay.classList.remove('active');
  document.getElementById('confirm-ok').onclick = () => { overlay.classList.remove('active'); onConfirm(); };
}

// ===== STATUS BADGE =====
function statusBadge(status) {
  const map = { 'Delivered': 'badge-delivered', 'Pending': 'badge-pending', 'Out for Delivery': 'badge-delivery' };
  return `<span class="badge ${map[status]||'badge-pending'}">${status}</span>`;
}

// ===== AVATAR =====
function avatar(name) { return (name||'?').charAt(0).toUpperCase(); }

// ===== FORMAT DATE & TIME =====
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

// ===== FORMAT PRICE =====
function formatPrice(price) { return '₹' + (parseFloat(price)||0).toLocaleString('en-IN'); }

// ===== LIVE CLOCK =====
function startClock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
  tick();
  setInterval(tick, 1000);
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const btn = document.getElementById('dark-toggle');
  const isDark = document.body.classList.contains('dark');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('darkMode', isDark ? '1' : '0');
}

function applyDarkMode() {
  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark');
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = '☀️';
  }
}

function setSidebarProfile() {
  const user = JSON.parse(localStorage.getItem('crm_current_user') || 'null');
  const nameEl = document.getElementById('sidebar-profile-name');
  const roleEl = document.getElementById('sidebar-profile-role');
  const avatarEl = document.getElementById('sidebar-profile-avatar');
  if (!user) return;
  if (nameEl) nameEl.textContent = user.name || user.username || 'User';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin Account' : 'Registered User';
  if (avatarEl) avatarEl.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
  // Update dashboard welcome subtitle to use the full name if available
  const welcomeEl = document.getElementById('welcome-subtitle');
  if (welcomeEl) {
    const full = user.name || user.username || 'User';
    const firstName = String(full).trim().split(' ')[0];
    welcomeEl.textContent = `Welcome back, ${firstName}! Here's what's happening.`;
  }
}

function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  if (!menu) return;
  menu.classList.toggle('open');
}

function logout() {
  localStorage.removeItem('crm_logged_in');
  localStorage.removeItem('crm_current_user');
  window.location.href = '../index.html';
}

// ===== EMAIL VALIDATION =====
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
  applyDarkMode();
  startClock();
  setSidebarProfile();
});

window.addEventListener('click', (event) => {
  const menu = document.getElementById('profile-menu');
  const trigger = document.querySelector('.profile-trigger');
  if (menu && trigger && !menu.contains(event.target) && !trigger.contains(event.target)) {
    menu.classList.remove('open');
  }
});

// ===== EXPORT HELPERS =====
function openExportModal() {
  const modal = document.getElementById('export-modal');
  if (!modal) return;
  document.getElementById('export-from').value = '';
  document.getElementById('export-to').value = '';
  // clear checklists
  const dsChecks = document.querySelectorAll('input[name="export-dataset"]');
  for (const c of dsChecks) c.checked = false;
  const stChecks = document.querySelectorAll('input[name="export-status"]');
  for (const c of stChecks) c.checked = false;
  onExportDatasetChange();
  modal.classList.add('active');
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (!modal) return;
  modal.classList.remove('active');
}

async function exportData() {
  const dataset = Array.from(document.querySelectorAll('input[name="export-dataset"]:checked')).map(i => i.value);
  const from = document.getElementById('export-from').value;
  const to = document.getElementById('export-to').value;
  const statuses = Array.from(document.querySelectorAll('input[name="export-status"]:checked')).map(i => i.value);
  const btn = document.getElementById('export-run-btn');
  btn.disabled = true; btn.textContent = 'Preparing...';
  // support multiple datasets: produce one CSV per selected dataset
  const datasets = dataset.length ? dataset : ['orders'];
  for (const ds of datasets) {
    let data = [];
    try {
      if (ds === 'orders') data = await apiFetch('/orders');
      if (ds === 'customers') data = await apiFetch('/customers');
      if (ds === 'products') data = await apiFetch('/products');
    } catch (e) { data = []; }

    if (!Array.isArray(data)) data = [];
    let filtered = data.filter(item => !!item);
    if (from) {
      const fromTs = new Date(from).setHours(0,0,0,0);
      filtered = filtered.filter(r => new Date(r.date_created).getTime() >= fromTs);
    }
    if (to) {
      const toTs = new Date(to).setHours(23,59,59,999);
      filtered = filtered.filter(r => new Date(r.date_created).getTime() <= toTs);
    }
    if (ds === 'orders' && statuses.length) filtered = filtered.filter(r => statuses.includes(r.status));

    const csv = datasetToCSV(ds, filtered);
    downloadCSV(csv, `${ds}-${getCurrentUserId()}-${new Date().toISOString().slice(0,10)}.csv`);
  }

  btn.disabled = false; btn.textContent = 'Export CSV';
  closeExportModal();
  showToast('CSV(s) exported — check your downloads', 'success');
}

function onExportDatasetChange() {
  const statusWrap = document.getElementById('export-order-filters');
  if (!statusWrap) return;
  const ordersChecked = document.querySelector('input[name="export-dataset"][value="orders"]')?.checked;
  statusWrap.style.display = ordersChecked ? 'block' : 'none';
}

function datasetToCSV(dataset, rows) {
  if (!rows.length) return '';
  let headers = [];
  if (dataset === 'orders') {
    headers = ['id','customer_name','product_name','price','status','date_created'];
  } else if (dataset === 'customers') {
    headers = ['id','name','phone','email','date_created'];
  } else if (dataset === 'products') {
    headers = ['id','name','category','price','description','date_created'];
  }
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = (r[h] === undefined || r[h] === null) ? '' : String(r[h]);
      return '"' + v.replace(/"/g, '""') + '"';
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

function downloadCSV(csv, filename) {
  if (!csv) {
    showToast('No data to export', 'error');
    return;
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
