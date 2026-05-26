/* ============================================
   Smart Canteen - Main Script
   Handles: menu, cart, totals, persistence
   ============================================ */

// ---------- MENU DATA ----------
// Edit this list to customize the menu for any canteen
const MENU = [
  { id: 'dosa',        name: 'Dosa',        price: 40, category: 'Main Foods', emoji: '🥞' },
  { id: 'idli',        name: 'Idli',        price: 40, category: 'Main Foods', emoji: '🍘' },
  { id: 'poori',       name: 'Poori',       price: 40, category: 'Main Foods', emoji: '🫓' },
  { id: 'ricebath',    name: 'Rice Bath',   price: 40, category: 'Main Foods', emoji: '🍚' },
  { id: 'ricesambar',  name: 'Rice Sambar', price: 40, category: 'Main Foods', emoji: '🍛' },
  { id: 'coffee',      name: 'Coffee',      price: 10, category: 'Beverages',  emoji: '☕' },
  { id: 'tea',         name: 'Tea',         price: 10, category: 'Beverages',  emoji: '🍵' },
  { id: 'badammilk',   name: 'Badam Milk',  price: 10, category: 'Beverages',  emoji: '🥛' },
];

// ---------- STATE ----------
const STORAGE_KEY = 'smartCanteenOrder';
let quantities = {};   // { itemId: qty }
let activeCategory = 'All';
let searchTerm = '';

// ---------- HELPERS ----------
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      quantities = data.quantities || {};
    }
  } catch (e) { quantities = {}; }
}

function saveState() {
  const items = MENU
    .filter(m => (quantities[m.id] || 0) > 0)
    .map(m => ({ ...m, qty: quantities[m.id] }));
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    quantities,
    items,
    total,
    timestamp: new Date().toISOString(),
  }));
}

function calcTotal() {
  return MENU.reduce((s, m) => s + (quantities[m.id] || 0) * m.price, 0);
}

function totalItemCount() {
  return Object.values(quantities).reduce((a, b) => a + (b || 0), 0);
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ---------- THEME ----------
function initTheme() {
  if (localStorage.getItem('canteenTheme') === 'dark') {
    document.body.classList.add('dark');
  }
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('canteenTheme',
        document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }
}

// ============================================
// HOME PAGE
// ============================================
function renderMenu() {
  const container = document.getElementById('menuContainer');
  if (!container) return;

  const filtered = MENU.filter(item => {
    const catOk = activeCategory === 'All' || item.category === activeCategory;
    const searchOk = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return catOk && searchOk;
  });

  // Group by category
  const groups = {};
  filtered.forEach(it => {
    if (!groups[it.category]) groups[it.category] = [];
    groups[it.category].push(it);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🔍</div>
        <p>No items match your search.</p>
      </div>`;
    return;
  }

  let html = '';
  Object.keys(groups).forEach(cat => {
    html += `<h3 class="category-title">${cat}</h3>`;
    html += `<div class="food-grid">`;
    groups[cat].forEach(item => {
      const qty = quantities[item.id] || 0;
      const sub = qty * item.price;
      html += `
        <div class="food-card" data-id="${item.id}">
          <div class="food-image">${item.emoji}</div>
          <div class="food-info">
            <div class="food-name">${item.name}</div>
            <div class="food-price">₹${item.price}</div>
            <div class="qty-control">
              <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease">−</button>
              <input class="qty-input" type="number" min="0" max="99"
                     value="${qty}" data-id="${item.id}" aria-label="Quantity">
              <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase">+</button>
            </div>
            <div class="subtotal-line">
              <span>Subtotal</span>
              <span>₹${sub}</span>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
  });

  container.innerHTML = html;
  attachQtyListeners();
}

function attachQtyListeners() {
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const current = quantities[id] || 0;
      if (action === 'inc') quantities[id] = Math.min(99, current + 1);
      else quantities[id] = Math.max(0, current - 1);
      updateBill();
      renderMenu(); // refresh subtotals
    });
  });

  document.querySelectorAll('.qty-input').forEach(inp => {
    inp.addEventListener('change', () => {
      const id = inp.dataset.id;
      let v = parseInt(inp.value, 10);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 99) v = 99;
      quantities[id] = v;
      updateBill();
      renderMenu();
    });
  });
}

function updateBill() {
  const totalEl = document.getElementById('liveTotal');
  const countEl = document.getElementById('cartCount');
  const placeBtn = document.getElementById('placeOrderBtn');
  const total = calcTotal();
  const count = totalItemCount();
  if (totalEl) totalEl.innerHTML = `Total: <span>₹${total}</span>`;
  if (countEl) countEl.textContent = `🛒 ${count}`;
  if (placeBtn) placeBtn.disabled = count === 0;
  saveState();
}

function initHome() {
  loadSaved();
  renderMenu();
  updateBill();

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category;
      renderMenu();
    });
  });

  // Search
  const search = document.getElementById('searchBox');
  if (search) {
    search.addEventListener('input', e => {
      searchTerm = e.target.value;
      renderMenu();
    });
  }

  // Calculate button (visual feedback)
  const calcBtn = document.getElementById('calcBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      const total = calcTotal();
      const count = totalItemCount();
      if (count === 0) showToast('Please add at least one item');
      else showToast(`Total: ₹${total} for ${count} item(s)`);
    });
  }

  // Place order
  const placeBtn = document.getElementById('placeOrderBtn');
  if (placeBtn) {
    placeBtn.addEventListener('click', e => {
      if (totalItemCount() === 0) {
        e.preventDefault();
        showToast('Add items before placing an order');
        return;
      }
      saveState();
    });
  }
}

// ============================================
// ORDER SUMMARY PAGE
// ============================================
function initOrderPage() {
  const wrap = document.getElementById('orderContent');
  if (!wrap) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (e) {}

  if (!data || !data.items || data.items.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="emoji">🍽️</div>
        <h2>No items in your order</h2>
        <p>Head back to the menu and pick something tasty.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:20px;">Back to Menu</a>
      </div>`;
    return;
  }

  const orderTime = new Date(data.timestamp).toLocaleString();
  const itemsHtml = data.items.map(it => `
    <div class="summary-item">
      <div class="name">${it.emoji} ${it.name}</div>
      <div class="qty">× ${it.qty}</div>
      <div class="price">₹${it.price * it.qty}</div>
    </div>
  `).join('');

  const tax = Math.round(data.total * 0.05);
  const grand = data.total + tax;

  wrap.innerHTML = `
    <div class="summary-card">
      <div class="summary-header">
        <div>
          <h2>Order Summary</h2>
          <div class="order-time">Placed: ${orderTime}</div>
        </div>
        <div class="cart-badge">${data.items.length} item(s)</div>
      </div>
      <div class="summary-items">${itemsHtml}</div>
      <div class="summary-totals">
        <div class="row"><span>Subtotal</span><span>₹${data.total}</span></div>
        <div class="row"><span>Service Charge (5%)</span><span>₹${tax}</span></div>
        <div class="row grand"><span>Grand Total</span><span>₹${grand}</span></div>
      </div>
      <div class="summary-actions">
        <a href="index.html" class="btn btn-outline">✏️ Edit Order</a>
        <button id="confirmBtn" class="btn btn-primary">✓ Confirm Order</button>
      </div>
    </div>
  `;

  document.getElementById('confirmBtn').addEventListener('click', () => {
    // Save grand total before navigating
    data.grandTotal = grand;
    data.tax = tax;
    data.confirmedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.location.href = 'thankyou.html';
  });
}

// ============================================
// THANK YOU PAGE
// ============================================
function initThankYou() {
  const wrap = document.getElementById('thankContent');
  if (!wrap) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch (e) {}

  const orderId = 'SC' + Date.now().toString().slice(-6);
  const total = data ? (data.grandTotal || data.total) : 0;
  const itemCount = data && data.items ? data.items.length : 0;
  const waitMin = Math.max(5, itemCount * 2);

  wrap.innerHTML = `
    <div class="success-icon">✓</div>
    <h2>Order Successfully Placed!</h2>
    <p>Thank you for ordering with Smart Canteen.</p>
    <p>Your order <strong>#${orderId}</strong> has been received.</p>
    <div class="wait-time">
      ⏱ Estimated preparation: <strong>${waitMin} minutes</strong>
    </div>
    <p style="font-size:18px;color:var(--accent);font-weight:700;">
      Amount: ₹${total}
    </p>
    <a href="index.html" class="btn btn-primary" style="margin-top:24px;">
      🏠 Return to Home
    </a>
  `;

  // Clear order so a new one can start
  setTimeout(() => localStorage.removeItem(STORAGE_KEY), 500);
}

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHome();
  initOrderPage();
  initThankYou();
});
