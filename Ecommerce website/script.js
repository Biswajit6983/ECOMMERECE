// currency formatting (INR whole rupees)
const currencyINR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const formatINR = n => currencyINR.format(n).replace('₹', '');

// demo products - edit as needed
const PRODUCTS = [
  { id: 'bk-java', title: 'Java Programming — Beginner to Advanced', desc: 'Complete guide with hands-on projects', price: 799, category: 'books', tag: 'java' },
  { id: 'bk-dsa', title: 'Data Structures & Algorithms in C++', desc: 'Interview-focused practice', price: 649, category: 'books', tag: 'cpp dsa' },
  { id: 'dev-vscode', title: 'VS Code Pro Setup Pack', desc: 'Themes, keymaps, and workspace tips', price: 299, category: 'dev', tag: 'vscode' },
  { id: 'dev-linux', title: 'Linux Shell Scripting Toolkit', desc: 'Templates and patterns for automation', price: 399, category: 'dev', tag: 'shell bash' },
  { id: 'dev-py', title: 'Python Automation Cookbook', desc: 'Scripts for everyday tasks', price: 599, category: 'dev', tag: 'python' },
  { id: 'merch-tee', title: 'Coder Tee — Dark Mode', desc: '100% cotton, dev-friendly fit', price: 899, category: 'merch', tag: 'tshirt' },
  { id: 'merch-sticker', title: 'Sticker Pack — Ship It', desc: 'Vinyl stickers for laptops', price: 199, category: 'merch', tag: 'stickers' }
];

// state
let cart = JSON.parse(localStorage.getItem('cart') || '{}'); // {id: qty}
let filterCategory = 'all';
let searchQuery = '';

// elements
const productsEl = document.getElementById('products');
const cartListEl = document.getElementById('cart-list');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const searchEl = document.getElementById('search');
const categoryEl = document.getElementById('category');
const checkoutBtn = document.getElementById('checkout');
const clearCartBtn = document.getElementById('clear-cart');
const resumeModal = document.getElementById('resume-modal');
const openResumeBtn = document.getElementById('view-resume');
const closeResumeBtn = document.getElementById('close-resume');
const toastEl = document.getElementById('toast');

// toast helper
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

// render products
function renderProducts() {
  const q = searchQuery.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => {
    const matchesCat = filterCategory === 'all' ? true : p.category === filterCategory;
    const inText = `${p.title} ${p.desc} ${p.tag}`.toLowerCase().includes(q);
    return matchesCat && (q ? inText : true);
  });

  if (!filtered.length) {
    productsEl.innerHTML = `<div class="card"><div class="muted">No products found</div></div>`;
    return;
  }

  productsEl.innerHTML = filtered.map(p => `
    <article class="card product" tabindex="0" aria-label="${p.title}">
      <div class="product-img" aria-hidden="true">${p.category.toUpperCase()}</div>
      <div class="prod-title">${p.title}</div>
      <div class="small">${p.desc}</div>
      <div class="meta">
        <div class="price">₹${formatINR(p.price)}</div>
        <button class="btn" data-id="${p.id}" aria-label="Add ${p.title} to cart">Add</button>
      </div>
    </article>
  `).join('');

  productsEl.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });
}

// cart functions
function persistCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return { ...p, qty, total: p.price * qty };
  });

  cartCountEl.textContent = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.total, 0);
  cartTotalEl.textContent = formatINR(total);

  if (!items.length) {
    cartListEl.innerHTML = `<div class="muted">Your cart is empty</div>`;
    return;
  }

  cartListEl.innerHTML = items.map(i => `
    <div class="cart-item">
      <div style="flex:1">
        <div class="prod-title">${i.title}</div>
        <div class="small muted">₹${formatINR(i.price)} × ${i.qty} = ₹${formatINR(i.total)}</div>
      </div>
      <div class="qty" role="group" aria-label="Quantity">
        <button class="btn ghost" data-action="dec" data-id="${i.id}" aria-label="Decrease">−</button>
        <div style="padding:0 8px" aria-live="polite">${i.qty}</div>
        <button class="btn ghost" data-action="inc" data-id="${i.id}" aria-label="Increase">+</button>
      </div>
      <button class="btn ghost" data-action="rm" data-id="${i.id}" aria-label="Remove">Remove</button>
    </div>
  `).join('');

  cartListEl.querySelectorAll('[data-action]').forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.addEventListener('click', () => {
      if (action === 'dec') updateQty(id, -1);
      if (action === 'inc') updateQty(id, +1);
      if (action === 'rm') removeItem(id);
    });
  });
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  persistCart();
  renderCart();
  const p = PRODUCTS.find(x => x.id === id);
  toast(`Added: ${p.title}`);
}

function updateQty(id, delta) {
  const next = (cart[id] || 0) + delta;
  if (next <= 0) {
    delete cart[id];
    toast('Item removed');
  } else {
    cart[id] = next;
    toast(`Quantity: ${next}`);
  }
  persistCart();
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  persistCart();
  renderCart();
  toast('Item removed');
}

function clearCart() {
  if (!Object.keys(cart).length) {
    toast('Cart already empty');
    return;
  }
  cart = {};
  persistCart();
  renderCart();
  toast('Cart cleared');
}

// search & filter (debounced)
let debounceTimer;
searchEl.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery = searchEl.value;
    renderProducts();
  }, 180);
});
categoryEl.addEventListener('change', () => {
  filterCategory = categoryEl.value;
  renderProducts();
});

// checkout (demo)
checkoutBtn.addEventListener('click', () => {
  if (!Object.keys(cart).length) {
    toast('Your cart is empty.');
    return;
  }
  alert('Demo checkout only. Integrate a payment gateway for real orders.');
});

// resume modal
openResumeBtn.addEventListener('click', () => {
  if (typeof resumeModal.showModal === 'function') {
    resumeModal.showModal();
    closeResumeBtn.focus();
  } else {
    // fallback: open resume pdf in new tab
    window.open('assets/resume.pdf', '_blank');
  }
});
closeResumeBtn.addEventListener('click', () => resumeModal.close());
resumeModal.addEventListener('click', (e) => {
  const doc = resumeModal.querySelector('.resume-doc');
  const rect = doc.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) resumeModal.close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && resumeModal.open) resumeModal.close();
});

// footer year
document.getElementById('year').textContent = new Date().getFullYear();

// boot
renderProducts();
renderCart();
