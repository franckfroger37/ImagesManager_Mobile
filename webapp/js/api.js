/* ============================================================
   Images Manager Mobile — api.js
   Utilitaires WooCommerce + WordPress REST API
   ============================================================ */

'use strict';

// ── Settings (localStorage) ──────────────────────────────────

const SETTINGS_KEY = 'im_settings';

function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}

function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

function hasSettings() {
  const s = getSettings();
  return !!(s.wcUrl && s.wcKey && s.wcSecret && s.wpUser && s.wpPass);
}

function requireSettings() {
  if (!hasSettings()) {
    goTo('settings.html?redirect=' + encodeURIComponent(location.href));
    return false;
  }
  return true;
}

// ── Auth helpers ────────────────────────────────────────────

function wcAuth() {
  const { wcKey, wcSecret } = getSettings();
  return 'Basic ' + btoa(wcKey + ':' + wcSecret);
}

function wpAuth() {
  const { wpUser, wpPass } = getSettings();
  return 'Basic ' + btoa(wpUser + ':' + wpPass);
}

function wcBase() {
  let url = getSettings().wcUrl || '';
  url = url.replace(/\/$/, '');
  return url + '/wp-json/wc/v3';
}

function wpBase() {
  let url = getSettings().wcUrl || '';
  url = url.replace(/\/$/, '');
  return url + '/wp-json/wp/v2';
}

// ── Generic WC fetch ─────────────────────────────────────────

async function wcFetch(path, opts = {}) {
  const url = wcBase() + path;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': wcAuth(),
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    let msg = 'Erreur ' + res.status;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ── Products ─────────────────────────────────────────────────

/**
 * Liste les produits (paginée).
 * @returns {{ products: Array, totalPages: number }}
 */
async function getProducts(page = 1, perPage = 10, search = '') {
  let path = `/products?page=${page}&per_page=${perPage}&orderby=date&order=desc`;
  if (search) path += '&search=' + encodeURIComponent(search);

  const url = wcBase() + path;
  const res = await fetch(url, {
    headers: { 'Authorization': wcAuth() }
  });
  if (!res.ok) {
    let msg = 'Erreur ' + res.status;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  const products = await res.json();
  const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
  return { products, totalPages };
}

async function getProduct(id) {
  return wcFetch('/products/' + id);
}

async function createProduct(data) {
  return wcFetch('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateProduct(id, data) {
  return wcFetch('/products/' + id, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

async function deleteProduct(id) {
  return wcFetch('/products/' + id + '?force=true', {
    method: 'DELETE'
  });
}

// ── Categories ───────────────────────────────────────────────

const CAT_CACHE_KEY = 'im_cats';

async function getCategories(forceRefresh = false) {
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(CAT_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  let allCats = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = wcBase() + `/products/categories?per_page=100&page=${page}&hide_empty=false`;
    const res = await fetch(url, { headers: { 'Authorization': wcAuth() } });
    if (!res.ok) throw new Error('Impossible de charger les catégories');
    const cats = await res.json();
    allCats = allCats.concat(cats);
    totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    page++;
  } while (page <= totalPages);

  sessionStorage.setItem(CAT_CACHE_KEY, JSON.stringify(allCats));
  return allCats;
}

// ── Media upload ─────────────────────────────────────────────

/**
 * Upload une image vers la médiathèque WordPress.
 * @param {Blob} blob - Image blob (JPEG recommandé)
 * @param {string} filename - Nom du fichier
 * @returns {Promise<number>} media ID
 */
async function uploadImage(blob, filename = 'image.jpg') {
  const url = wpBase() + '/media';
  const formData = new FormData();
  formData.append('file', blob, filename);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': wpAuth(),
      'Content-Disposition': `attachment; filename="${filename}"`
    },
    body: formData
  });

  if (!res.ok) {
    let msg = 'Erreur upload ' + res.status;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }

  const media = await res.json();
  return media.id;
}

// ── Navigation ───────────────────────────────────────────────

function goTo(page) {
  // Résoudre le chemin relatif à la racine webapp
  const base = location.pathname.replace(/\/[^/]*$/, '/');
  location.href = base + page;
}

// ── Toast ────────────────────────────────────────────────────

let _toastTimer = null;

function showToast(msg, type = '', duration = 3000) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = ''; }, duration);
}

// ── Confirm dialog ───────────────────────────────────────────

function showConfirm(title, message) {
  return new Promise(resolve => {
    // Remove existing
    const old = document.getElementById('_confirm_overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = '_confirm_overlay';
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="dialog">
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(message)}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" id="_confirm_cancel">Annuler</button>
          <button class="btn btn-danger" id="_confirm_ok">Supprimer</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('_confirm_ok').onclick = () => {
      overlay.remove(); resolve(true);
    };
    document.getElementById('_confirm_cancel').onclick = () => {
      overlay.remove(); resolve(false);
    };
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

// ── Utilities ────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}
