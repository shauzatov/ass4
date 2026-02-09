const API_URL = window.API_URL || (location.origin === "null" ? "http://localhost:3000" : "");
const API_BASE = API_URL ? `${API_URL}/api` : "/api";
const SESSION_KEY = "session_v1";
const CART_KEY = "cart_v1";

let currentView = "products";
let allProducts = [];
let allReviews = [];
let cart = loadCart();

const $ = (id) => document.getElementById(id);

const els = {
  authStatus: $("authStatus"),
  logoutBtn: $("logoutBtn"),
  authMsg: $("authMsg"),

  productsGrid: $("products-grid"),
  productsMsg: $("productsMsg"),
  refreshProducts: $("refreshProducts"),
  categoryFilter: $("category-filter"),
  searchInput: $("search-input"),

  modal: $("product-modal"),
  modalBody: $("modal-body"),
  modalCloseBtn: $("modalCloseBtn"),

  reviewsList: $("reviews-list"),
  refreshReviews: $("refreshReviews"),
  reviewsMsg: $("reviewsMsg"),
  createReviewForm: $("createReviewForm"),
  reviewFormMsg: $("reviewFormMsg"),

  createProductForm: $("createProductForm"),
  updateProductForm: $("updateProductForm"),
  deleteProductForm: $("deleteProductForm"),
  adminMsg: $("adminMsg"),

  registerForm: $("registerForm"),
  loginForm: $("loginForm"),

  cartList: $("cartList"),
  cartTotal: $("cartTotal"),
  cartSummary: $("cartSummary"),
  cartMsg: $("cartMsg"),
  clearCartBtn: $("clearCartBtn"),
  createOrderBtn: $("createOrderBtn"),
  quickAddForm: $("quickAddForm"),

  loadMyOrders: $("loadMyOrders"),
  loadAllOrders: $("loadAllOrders"),
  myOrders: $("myOrders"),
  allOrders: $("allOrders"),
  ordersMsg: $("ordersMsg"),

  toast: $("toast"),
  adminTab: $("adminTab"),
  authTab: $("authTab"),
  homeBtn: $("homeBtn"),
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(text) {
  if (!els.toast) return;
  els.toast.textContent = text || "";
  els.toast.classList.add("show");
  clearTimeout(els.toast._t);
  els.toast._t = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function showMsg(el, text, type) {
  if (!el) return;
  el.classList.remove("success", "error", "show");
  if (!text) return;
  el.textContent = text;
  if (type) el.classList.add(type);
  el.classList.add("show");
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession()?.token;
}

function isAdmin() {
  return getSession()?.user?.role === "admin";
}

async function api(path, { method = "GET", body } = {}) {
  const session = typeof getSession === "function" ? getSession() : null;
  const token = session?.token;

  const headers = {};
  let payload;

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload
  });

  let data = {};
  const text = await res.text().catch(() => "");
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = Array.isArray(data.details)
      ? data.details.join(", ")
      : (data.error || data.message || data.raw || `HTTP ${res.status}`);
    throw new Error(msg);
  }

  return data;
}


function applyRoleUI() {
  const s = getSession();
  if (!s) {
    els.authStatus.textContent = "Not logged in";
    els.logoutBtn.classList.add("hidden");
  } else {
    els.authStatus.textContent = `Logged in: ${s.user?.email} (${s.user?.role})`;
    els.logoutBtn.classList.remove("hidden");
  }

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.style.display = isAdmin() ? "" : "none";
  });
}

function switchView(viewName) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const target = $(`${viewName}-view`);
  if (target) {
    target.classList.add("active");
    currentView = viewName;
  }
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === viewName));
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  if (els.homeBtn) els.homeBtn.addEventListener("click", () => switchView("products"));
}

function openModal() {
  els.modal.classList.add("active");
  els.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.modal.classList.remove("active");
  els.modal.setAttribute("aria-hidden", "true");
}

function normalizeProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

function normalizeReviews(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cartTotals() {
  let items = 0;
  let total = 0;
  for (const it of cart) {
    items += it.quantity;
    total += (it.price || 0) * it.quantity;
  }
  return { items, total };
}

function addToCart(product, quantity = 1) {
  const q = Math.max(1, Number(quantity) || 1);
  const idx = cart.findIndex((x) => x.productId === product._id);
  if (idx >= 0) cart[idx].quantity += q;
  else cart.push({ productId: product._id, name: product.name, price: Number(product.price || 0), quantity: q });
  saveCart();
  toast("Added to cart");
}

function updateCartQty(productId, delta) {
  const idx = cart.findIndex((x) => x.productId === productId);
  if (idx < 0) return;
  cart[idx].quantity = Math.max(1, cart[idx].quantity + delta);
  saveCart();
}

function removeFromCart(productId) {
  cart = cart.filter((x) => x.productId !== productId);
  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
}

function renderCart() {
  const { items, total } = cartTotals();
  els.cartSummary.textContent = `${items} items`;
  els.cartTotal.textContent = `$${total.toFixed(2)}`;

  if (!cart.length) {
    els.cartList.innerHTML = `<div class="empty-state"><p>Your cart is empty.</p></div>`;
    return;
  }

  els.cartList.innerHTML = cart
    .map(
      (it) => `
      <div class="cart-item">
        <div>
          <div class="cart-name">${esc(it.name)}</div>
          <div class="cart-sub">${esc(it.productId)} • $${Number(it.price || 0).toFixed(2)}</div>
        </div>
        <div class="cart-controls">
          <div class="qty">
            <button type="button" data-act="dec" data-id="${esc(it.productId)}">−</button>
            <span>${it.quantity}</span>
            <button type="button" data-act="inc" data-id="${esc(it.productId)}">+</button>
          </div>
          <button class="btn btn-danger" type="button" data-act="rm" data-id="${esc(it.productId)}">Remove</button>
        </div>
      </div>
    `
    )
    .join("");

  els.cartList.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      const act = b.dataset.act;
      if (act === "inc") updateCartQty(id, 1);
      if (act === "dec") updateCartQty(id, -1);
      if (act === "rm") removeFromCart(id);
    });
  });
}

function refreshCategoryOptions(products) {
  const current = els.categoryFilter.value;
  const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  els.categoryFilter.innerHTML = `<option value="">All categories</option>` + cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  els.categoryFilter.value = current;
}

function filterProducts() {
  const category = els.categoryFilter.value;
  const searchTerm = (els.searchInput.value || "").toLowerCase();

  let filtered = allProducts;

  if (category) filtered = filtered.filter((p) => p.category === category);
  if (searchTerm) {
    filtered = filtered.filter((p) => (p.name || "").toLowerCase().includes(searchTerm) || (p.description || "").toLowerCase().includes(searchTerm));
  }
  renderProducts(filtered);
}

function renderProducts(products) {
  if (!products.length) {
    els.productsGrid.innerHTML = `<div class="empty-state"><h3>No products found</h3><p>Create products as admin.</p></div>`;
    return;
  }

  els.productsGrid.innerHTML = products
    .map((p) => {
      const price = Number(p.price || 0).toFixed(2);
      const stock = Number(p.stock ?? 0);
      const badge = p.featured ? `<div class="featured-badge">Featured</div>` : "";
      const img = esc(p.imageUrl || "https://via.placeholder.com/300x300?text=No+Image");
      return `
        <div class="product-card" data-id="${esc(p._id)}">
          ${badge}
          <img src="${img}" alt="${esc(p.name)}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
          <div class="product-info">
            <div class="product-category">${esc(p.category || "")}</div>
            <div class="product-name">${esc(p.name || "")}</div>
            <div class="product-description">${esc(p.description || "")}</div>
            <div class="product-footer">
              <div class="product-price">$${price}</div>
              <div class="product-stock">${stock} in stock</div>
            </div>
            <div class="card-actions">
              <button class="btn btn-secondary" type="button" data-add="${esc(p._id)}">Add</button>
              <button class="btn btn-primary" type="button" data-open="${esc(p._id)}">Details</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  els.productsGrid.querySelectorAll("button[data-open]").forEach((b) => {
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      await showProductDetails(b.dataset.open);
    });
  });

  els.productsGrid.querySelectorAll("button[data-add]").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const p = allProducts.find((x) => x._id === b.dataset.add);
      if (p) addToCart(p, 1);
    });
  });

  els.productsGrid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const id = card.dataset.id;
      if (id) await showProductDetails(id);
    });
  });
}

async function loadProducts() {
  showMsg(els.productsMsg, "", "");
  els.productsGrid.innerHTML = `<div class="loading">Loading products...</div>`;
  try {
    const data = await api("/products");
    allProducts = normalizeProducts(data);
    refreshCategoryOptions(allProducts);
    filterProducts();
  } catch (e) {
    els.productsGrid.innerHTML = `<div class="empty-state"><h3>Error loading products</h3><p>${esc(e.message)}</p></div>`;
  }
}

function buildStars(rating) {
  const r = Number(rating || 0);
  return [1, 2, 3, 4, 5].map((i) => `<span class="star ${i <= r ? "" : "empty"}">★</span>`).join("");
}

async function showProductDetails(productId) {
  try {
    const product = await api(`/products/${productId}`);
    const reviewsData = await api(`/reviews/product/${productId}`);
    const productReviews = normalizeReviews(reviewsData);

    const img = esc(product.imageUrl || "https://via.placeholder.com/700x400?text=No+Image");
    const stock = Number(product.stock ?? 0);
    const createdAt = product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "-";
    const updatedAt = product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "-";

    const adminActions = isAdmin()
      ? `
        <div class="modal-actions">
          <button class="btn btn-primary" type="button" id="modalEditBtn">Edit</button>
          <button class="btn btn-danger" type="button" id="modalDeleteBtn">Delete</button>
        </div>
      `
      : "";

    els.modalBody.innerHTML = `
      <div style="margin-bottom:1.5rem">
        <img src="${img}" alt="${esc(product.name)}" style="width:100%;max-height:420px;object-fit:cover;border-radius:24px" onerror="this.src='https://via.placeholder.com/700x400?text=No+Image'">
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <div class="badge-pill">${esc(product.category || "")}</div>
          ${product.featured ? `<span class="badge-pill" style="margin-left:8px">Featured</span>` : ""}
          <h2 style="font-family:var(--font-display);font-size:2.4rem;margin:.6rem 0 0;color:var(--deep-blue)">${esc(product.name || "")}</h2>
          <div class="muted small">Created: ${esc(createdAt)} • Updated: ${esc(updatedAt)}</div>
        </div>

        <div style="text-align:right">
          <div style="font-size:2.2rem;font-weight:900;color:var(--primary-blue)">$${Number(product.price || 0).toFixed(2)}</div>
          <div class="muted">Stock: <strong>${stock}</strong></div>
        </div>
      </div>

      <p style="margin-top:1rem;color:var(--text-medium);line-height:1.8">${esc(product.description || "")}</p>

      <div class="card-actions" style="margin-top:1rem">
        <button class="btn btn-secondary" type="button" id="modalAddBtn">Add to cart</button>
        <button class="btn btn-primary" type="button" id="modalCopyBtn">Copy ID</button>
      </div>

      ${productReviews.length ? `
        <div style="margin-top:2rem;border-top:1px solid var(--border-color);padding-top:1.5rem">
          <h3 style="color:var(--deep-blue);font-weight:900;margin-bottom:1rem">Reviews (${productReviews.length})</h3>
          ${productReviews.map(r => `
            <div style="background:var(--light-blue);border-radius:16px;padding:1rem;margin-bottom:1rem">
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:.5rem">
                <div style="font-weight:900">${esc(r.username || "anonymous")}</div>
                <div class="review-rating">${buildStars(r.rating)}</div>
              </div>
              <div style="color:var(--text-medium)">${esc(r.comment || "")}</div>
              <div class="review-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div style="margin-top:2rem;border-top:1px solid var(--border-color);padding-top:1.5rem" class="muted">
          No reviews yet.
        </div>
      `}

      ${adminActions}
    `;

    openModal();

    const p = allProducts.find((x) => x._id === productId) || product;

    $("modalAddBtn")?.addEventListener("click", () => addToCart(p, 1));
    $("modalCopyBtn")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(productId);
        toast("Product ID copied");
      } catch {
        toast("Copy failed");
      }
    });

    if (isAdmin()) {
      $("modalEditBtn")?.addEventListener("click", () => {
        fillUpdateFormFromProduct(product);
        closeModal();
        switchView("admin");
      });

      $("modalDeleteBtn")?.addEventListener("click", async () => {
        await deleteProduct(productId);
      });
    }
  } catch (e) {
    toast(e.message);
  }
}

async function deleteProduct(productId) {
  if (!isAdmin()) return toast("Admin only");
  if (!confirm("Delete this product?")) return;

  try {
    await api(`/products/${productId}`, { method: "DELETE", auth: true });
    closeModal();
    toast("Deleted");
    await loadProducts();
  } catch (e) {
    toast(e.message);
  }
}

function fillUpdateFormFromProduct(p) {
  if (!els.updateProductForm) return;
  const f = els.updateProductForm;
  f.elements.id.value = p._id || "";
  f.elements.name.value = p.name || "";
  f.elements.category.value = p.category || "";
  f.elements.description.value = p.description || "";
  f.elements.price.value = p.price ?? "";
  if (f.elements.stock) f.elements.stock.value = p.stock ?? "";
  if (f.elements.imageUrl) f.elements.imageUrl.value = p.imageUrl || "";
  if (f.elements.featured) f.elements.featured.checked = !!p.featured;
  showMsg(els.adminMsg, "Loaded product into update form", "success");
}

async function loadReviews() {
  showMsg(els.reviewsMsg, "", "");
  els.reviewsList.innerHTML = `<div class="loading">Loading reviews...</div>`;
  try {
    const data = await api("/reviews");
    allReviews = normalizeReviews(data);
    renderReviews(allReviews);
  } catch (e) {
    els.reviewsList.innerHTML = `<div class="empty-state"><h3>Error loading reviews</h3><p>${esc(e.message)}</p></div>`;
  }
}

function renderReviews(reviews) {
  if (!reviews.length) {
    els.reviewsList.innerHTML = `<div class="empty-state"><h3>No reviews yet</h3><p>Create a review after login.</p></div>`;
    return;
  }

  els.reviewsList.innerHTML = reviews
    .map((r) => {
      const productLabel = r.productId?.name || r.productId || r.product || "Product";
      return `
        <div class="review-card">
          <div class="review-header">
            <div class="review-user">${esc(r.username || "anonymous")}</div>
            <div class="review-rating">${buildStars(r.rating)}</div>
          </div>
          <div class="review-product">${esc(productLabel)}</div>
          <div class="review-comment">${esc(r.comment || "")}</div>
          <div class="review-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</div>
        </div>
      `;
    })
    .join("");
}

async function createReview(form) {
  if (!isLoggedIn()) {
    showMsg(els.reviewFormMsg, "Login required", "error");
    switchView("auth");
    return;
  }

  const fd = new FormData(form);
  const productId = String(fd.get("productId") || "").trim();
  const rating = Number(fd.get("rating"));
  const comment = String(fd.get("comment") || "").trim();

  const username = getSession()?.user?.email || "user";

  try {
    showMsg(els.reviewFormMsg, "", "");
    await api("/reviews", { method: "POST", auth: true, body: { productId, rating, comment, username } });
    showMsg(els.reviewFormMsg, "Review created", "success");
    form.reset();
    await loadReviews();
    toast("Review submitted");
  } catch (e) {
    showMsg(els.reviewFormMsg, e.message, "error");
  }
}

async function createOrderFromCart() {
  if (!isLoggedIn()) {
    showMsg(els.cartMsg, "Login required", "error");
    switchView("auth");
    return;
  }

  if (!cart.length) {
    showMsg(els.cartMsg, "Cart is empty", "error");
    return;
  }

  try {
    showMsg(els.cartMsg, "", "");
    const body = { items: cart.map((it) => ({ productId: it.productId, quantity: it.quantity })) };
    await api("/orders", { method: "POST", auth: true, body });
    clearCart();
    showMsg(els.cartMsg, "Order created", "success");
    toast("Order created");
    await loadMyOrders();
    switchView("orders");
  } catch (e) {
    showMsg(els.cartMsg, e.message, "error");
  }
}

function renderOrders(container, orders, isAll) {
  if (!orders.length) {
    container.innerHTML = `<div class="empty-state"><p>No orders.</p></div>`;
    return;
  }

  container.innerHTML = orders
    .map((o) => {
      const items = (o.items || [])
        .map((it) => {
          const name = it.product?.name || "product";
          const qty = it.quantity ?? 1;
          const price = Number(it.priceAtPurchase || it.product?.price || 0).toFixed(2);
          return `<li>${esc(name)} x${qty} — $${price}</li>`;
        })
        .join("");

      const who = isAll ? `<div class="muted small">User: ${esc(o.user?.email || "")}</div>` : "";
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "";

      const adminControls =
        isAll && isAdmin()
          ? `
            <div class="order-admin">
              <select data-status="${esc(o._id)}">
                <option value="created" ${o.status === "created" ? "selected" : ""}>created</option>
                <option value="completed" ${o.status === "completed" ? "selected" : ""}>completed</option>
                <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>cancelled</option>
              </select>
              <button class="btn btn-secondary" type="button" data-upd="${esc(o._id)}">Update status</button>
            </div>
          `
          : "";

      return `
        <div class="order-card">
          <div class="order-top">
            <div class="order-meta">
              <div><strong>Order</strong> <span class="badge-pill">${esc(o.status || "created")}</span></div>
              <div class="muted small">ID: ${esc(o._id || "")} ${date ? "• " + esc(date) : ""}</div>
              ${who}
            </div>
            <div style="text-align:right">
              <div class="muted">Total</div>
              <div style="font-size:1.4rem;font-weight:900;color:var(--primary-blue)">$${Number(o.totalPrice || 0).toFixed(2)}</div>
            </div>
          </div>
          <ul class="order-items">${items}</ul>
          ${adminControls}
        </div>
      `;
    })
    .join("");

  if (isAll && isAdmin()) {
    container.querySelectorAll("button[data-upd]").forEach((b) => {
      b.addEventListener("click", async () => {
        const id = b.dataset.upd;
        const select = container.querySelector(`select[data-status="${CSS.escape(id)}"]`);
        const status = select?.value;
        if (!status) return;
        try {
          await api(`/orders/${id}/status`, { method: "PUT", auth: true, body: { status } });
          toast("Status updated");
          await loadAllOrders();
        } catch (e) {
          showMsg(els.ordersMsg, e.message, "error");
        }
      });
    });
  }
}

async function loadMyOrders() {
  if (!isLoggedIn()) {
    els.myOrders.innerHTML = `<div class="empty-state"><p>Login required.</p></div>`;
    return;
  }

  try {
    showMsg(els.ordersMsg, "", "");
    els.myOrders.innerHTML = `<div class="loading">Loading...</div>`;
    const data = await api("/orders/my", { auth: true });
    const orders = Array.isArray(data) ? data : data.orders || [];
    renderOrders(els.myOrders, orders, false);
  } catch (e) {
    els.myOrders.innerHTML = `<div class="empty-state"><p>${esc(e.message)}</p></div>`;
  }
}

async function loadAllOrders() {
  if (!isAdmin()) {
    els.allOrders.innerHTML = `<div class="empty-state"><p>Admin only.</p></div>`;
    return;
  }

  try {
    showMsg(els.ordersMsg, "", "");
    els.allOrders.innerHTML = `<div class="loading">Loading...</div>`;
    const data = await api("/orders", { auth: true });
    const orders = Array.isArray(data) ? data : data.orders || [];
    renderOrders(els.allOrders, orders, true);
  } catch (e) {
    els.allOrders.innerHTML = `<div class="empty-state"><p>${esc(e.message)}</p></div>`;
  }
}

async function createProduct(form) {
  if (!isAdmin()) return showMsg(els.adminMsg, "Admin only", "error");

  const fd = new FormData(form);
  const body = {
    name: String(fd.get("name") || "").trim(),
    category: String(fd.get("category") || "").trim(),
    description: String(fd.get("description") || "").trim(),
    price: Number(fd.get("price")),
    stock: fd.get("stock") === "" ? undefined : Number(fd.get("stock")),
    imageUrl: String(fd.get("imageUrl") || "").trim() || undefined,
    featured: !!fd.get("featured"),
  };

  try {
    showMsg(els.adminMsg, "", "");
    await api("/products", { method: "POST", auth: true, body });
    showMsg(els.adminMsg, "Product created", "success");
    form.reset();
    await loadProducts();
    toast("Created");
  } catch (e) {
    showMsg(els.adminMsg, e.message, "error");
  }
}

async function updateProduct(form) {
  if (!isAdmin()) return showMsg(els.adminMsg, "Admin only", "error");

  const fd = new FormData(form);
  const id = String(fd.get("id") || "").trim();
  if (!id) return showMsg(els.adminMsg, "Product ID required", "error");

  const patch = {
    name: String(fd.get("name") || "").trim() || undefined,
    category: String(fd.get("category") || "").trim() || undefined,
    description: String(fd.get("description") || "").trim() || undefined,
    price: fd.get("price") === "" ? undefined : Number(fd.get("price")),
    stock: fd.get("stock") === "" ? undefined : Number(fd.get("stock")),
    imageUrl: String(fd.get("imageUrl") || "").trim() || undefined,
    featured: fd.get("featured") ? true : undefined,
  };

  try {
    showMsg(els.adminMsg, "", "");
    const current = await api(`/products/${id}`);
    const body = {
      name: patch.name ?? current.name,
      category: patch.category ?? current.category,
      description: patch.description ?? current.description,
      price: Number.isFinite(patch.price) ? patch.price : current.price,
      stock: Number.isFinite(patch.stock) ? patch.stock : current.stock,
      imageUrl: patch.imageUrl ?? current.imageUrl,
      featured: patch.featured !== undefined ? patch.featured : current.featured,
    };

    await api(`/products/${id}`, { method: "PUT", auth: true, body });
    showMsg(els.adminMsg, "Product updated", "success");
    await loadProducts();
    toast("Updated");
  } catch (e) {
    showMsg(els.adminMsg, e.message, "error");
  }
}

async function deleteProductByForm(form) {
  if (!isAdmin()) return showMsg(els.adminMsg, "Admin only", "error");
  const fd = new FormData(form);
  const id = String(fd.get("id") || "").trim();
  if (!id) return showMsg(els.adminMsg, "Product ID required", "error");
  if (!confirm("Delete this product?")) return;

  try {
    showMsg(els.adminMsg, "", "");
    await api(`/products/${id}`, { method: "DELETE", auth: true });
    showMsg(els.adminMsg, "Product deleted", "success");
    form.reset();
    await loadProducts();
    toast("Deleted");
  } catch (e) {
    showMsg(els.adminMsg, e.message, "error");
  }
}

async function register(form) {
  const fd = new FormData(form);
  const body = {
    email: String(fd.get("email") || "").trim(),
    password: String(fd.get("password") || ""),
    role: String(fd.get("role") || "user"),
  };

  try {
    showMsg(els.authMsg, "", "");
    const data = await api("/auth/register", { method: "POST", body });
    setSession({ token: data.token, user: data.user });
    applyRoleUI();
    showMsg(els.authMsg, "Registered and logged in", "success");
    toast("Welcome");
    switchView("products");
  } catch (e) {
    showMsg(els.authMsg, e.message, "error");
  }
}

async function login(form) {
  const fd = new FormData(form);
  const body = {
    email: String(fd.get("email") || "").trim(),
    password: String(fd.get("password") || ""),
  };

  try {
    showMsg(els.authMsg, "", "");
    const data = await api("/auth/login", { method: "POST", body });
    setSession({ token: data.token, user: data.user });
    applyRoleUI();
    showMsg(els.authMsg, "Logged in", "success");
    toast("Logged in");
    switchView("products");
  } catch (e) {
    showMsg(els.authMsg, e.message, "error");
  }
}

function logout() {
  clearSession();
  applyRoleUI();
  toast("Logged out");
  showMsg(els.authMsg, "Logged out", "success");
}

function wireEvents() {
  els.refreshProducts.addEventListener("click", loadProducts);
  els.categoryFilter.addEventListener("change", filterProducts);
  els.searchInput.addEventListener("input", filterProducts);

  els.refreshReviews.addEventListener("click", loadReviews);

  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });

  els.logoutBtn.addEventListener("click", logout);

  els.registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    register(e.target);
  });

  els.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    login(e.target);
  });

  els.createReviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    createReview(e.target);
  });

  els.createProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    createProduct(e.target);
  });

  els.updateProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    updateProduct(e.target);
  });

  els.deleteProductForm.addEventListener("submit", (e) => {
    e.preventDefault();
    deleteProductByForm(e.target);
  });

  els.clearCartBtn.addEventListener("click", () => {
    clearCart();
    toast("Cart cleared");
  });

  els.createOrderBtn.addEventListener("click", createOrderFromCart);

  els.quickAddForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const productId = String(fd.get("productId") || "").trim();
    const quantity = Number(fd.get("quantity") || 1);
    const p = allProducts.find((x) => x._id === productId);
    if (!p) return showMsg(els.cartMsg, "Product not found in loaded list", "error");
    addToCart(p, quantity);
    e.target.reset();
  });

  els.loadMyOrders.addEventListener("click", loadMyOrders);
  els.loadAllOrders.addEventListener("click", loadAllOrders);

  els.authTab.addEventListener("click", () => switchView("auth"));
}

function boot() {
  setupNavigation();
  wireEvents();
  applyRoleUI();
  renderCart();
  loadProducts();
  loadReviews();
  setInterval(() => {
    if (currentView === "products") loadProducts();
    if (currentView === "reviews") loadReviews();
    if (currentView === "orders" && isLoggedIn()) loadMyOrders();
    if (currentView === "orders" && isAdmin()) loadAllOrders();
  }, 30000);
}

document.addEventListener("DOMContentLoaded", boot);