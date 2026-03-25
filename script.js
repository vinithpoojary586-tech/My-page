/* eslint-disable no-use-before-define */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const money = (n) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

const state = {
    cart: {}, // { [id]: { id, name, price, img, qty, category } }
    filter: "all",
    theme: null,
};

const STORAGE_KEY = "emberCrust.cart.v1";

function loadCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") state.cart = parsed;
    } catch {
        // ignore
    }
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    } catch {
        // ignore
    }
}

function cartCount() {
    return Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
    return Object.values(state.cart).reduce((sum, item) => sum + item.qty * item.price, 0);
}

function setTheme(theme) {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    state.theme = theme;
    try {
        localStorage.setItem("emberCrust.theme.v1", theme);
    } catch {
        // ignore
    }
}

function initTheme() {
    const saved = (() => {
        try {
            return localStorage.getItem("emberCrust.theme.v1");
        } catch {
            return null;
        }
    })();

    if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
    }

    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(prefersLight ? "light" : "dark");
}

function toggleTheme() {
    const next = state.theme === "light" ? "dark" : "light";
    setTheme(next);
    showToast(next === "light" ? "Light mode enabled" : "Dark mode enabled");
}

function setBadge() {
    const badge = $('[data-cart-badge]');
    const count = cartCount();
    badge.textContent = String(count);
    // Slightly highlight when adding items
    badge.style.transform = "scale(1.06)";
    window.setTimeout(() => {
        badge.style.transform = "scale(1)";
    }, 160);
}

function renderCart() {
    const itemsWrap = $('[data-cart-items]');
    const empty = $('[data-cart-empty]');
    const cartEmptyLink = $('[data-cart-empty-link]');

    const entries = Object.values(state.cart);
    const total = cartSubtotal();

    $('[data-cart-subtotal]').textContent = money(total);
    $('[data-cart-delivery]').textContent = money(0);
    $('[data-cart-total]').textContent = money(total);

    itemsWrap.innerHTML = "";

    if (entries.length === 0) {
        empty?.classList.remove("is-hidden");
        cartEmptyLink?.focus?.();
        return;
    }

    empty?.classList.add("is-hidden");

    for (const item of entries) {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
      <img class="cart-item__img" alt="${escapeHtml(item.name)}" src="${item.img}" loading="lazy" />
      <div>
        <p class="cart-item__name">${escapeHtml(item.name)}</p>
        <p class="cart-item__desc">${escapeHtml(item.category)}</p>
        <div class="cart-qty" aria-label="Quantity controls for ${escapeHtml(item.name)}">
          <button type="button" data-cart-minus data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite" data-cart-qty>${item.qty}</span>
          <button type="button" data-cart-plus data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item__right">
        <div class="cart-item__price">${money(item.price * item.qty)}</div>
        <button class="cart-item__remove" type="button" data-cart-remove data-id="${item.id}">Remove</button>
      </div>
    `;
        itemsWrap.appendChild(row);
    }
}

function addToCart(menuItem) {
    const existing = state.cart[menuItem.id];
    if (existing) existing.qty += 1;
    else state.cart[menuItem.id] = { ...menuItem, qty: 1 };
    saveCart();
    setBadge();
    renderCart();
    showToast(`Added: ${menuItem.name}`);
}

function updateQty(id, delta) {
    const item = state.cart[id];
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) delete state.cart[id];
    saveCart();
    setBadge();
    renderCart();
}

function removeFromCart(id) {
    if (state.cart[id]) {
        delete state.cart[id];
        saveCart();
        setBadge();
        renderCart();
        showToast("Removed from cart");
    }
}

function openCart() {
    const drawer = $(".cart-drawer");
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
    const drawer = $(".cart-drawer");
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
}

function initCart() {
    const openBtn = $('[data-cart-open]');
    const closeBtns = $$("[data-cart-close]");
    const backdrop = $('[data-cart-close].cart-drawer__backdrop, [data-cart-drawer] [data-cart-close].cart-drawer__backdrop, .cart-drawer__backdrop[data-cart-close]');
    const checkoutBtn = $('[data-cart-checkout]');

    openBtn?.addEventListener("click", () => {
        openCart();
        // Render on open so numbers are always correct
        renderCart();
    });

    closeBtns.forEach((btn) => {
        btn.addEventListener("click", closeCart);
    });

    const bd = $(".cart-drawer__backdrop[data-cart-close]");
    bd?.addEventListener("click", closeCart);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCart();
    });

    document.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const plus = t.closest("[data-cart-plus]");
        const minus = t.closest("[data-cart-minus]");
        const remove = t.closest("[data-cart-remove]");

        if (plus) updateQty(plus.getAttribute("data-id"), +1);
        if (minus) updateQty(minus.getAttribute("data-id"), -1);
        if (remove) removeFromCart(remove.getAttribute("data-id"));
    });

    checkoutBtn?.addEventListener("click", () => {
        const total = cartSubtotal();
        if (total <= 0) {
            showToast("Your cart is empty");
            return;
        }
        showToast("Checkout demo: order not sent");
    });
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(text) {
    const el = $('[data-toast]');
    if (!el) return;
    el.textContent = text;
    el.classList.add("is-show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => el.classList.remove("is-show"), 2200);
}

function initRevealAnimations() {
    const candidates = $$("[data-reveal]");
    if (candidates.length === 0) return;

    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    io.unobserve(entry.target);
                }
            }
        },
        { threshold: 0.12 }
    );

    candidates.forEach((c) => io.observe(c));
}

function initNav() {
    const toggle = $('[data-nav-toggle]');
    const links = $('[data-nav-links]');

    toggle?.addEventListener("click", () => {
        const isOpen = links.getAttribute("data-open") === "true";
        links.setAttribute("data-open", isOpen ? "false" : "true");
    });

    // Close menu when selecting a link (mobile)
    links?.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        if (t.tagName !== "A") return;
        links.setAttribute("data-open", "false");
    });
}

const MENU = [
    {
        id: "margherita",
        category: "Veg",
        filter: "veg",
        name: "Classic Margherita",
        price: 12.99,
        desc: "San Marzano sauce, fresh mozzarella, basil, and a drizzle of olive oil.",
        img: "https://images.unsplash.com/photo-1601924582975-7f4c3b7b4b88?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "garden-veggie",
        category: "Veg",
        filter: "veg",
        name: "Garden Veggie",
        price: 14.49,
        desc: "Roasted peppers, mushrooms, olives, onions, and mozzarella—bursting with flavor.",
        img: "https://images.unsplash.com/photo-1590947132387-155cc18bf70b?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "farmhouse",
        category: "Veg",
        filter: "veg",
        name: "Farmhouse Basil",
        price: 15.25,
        desc: "Basil pesto, roasted tomatoes, garlic confit, and creamy mozzarella.",
        img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "spicy-jalapeno",
        category: "Veg",
        filter: "veg",
        name: "Spicy Jalapeno Heat",
        price: 14.99,
        desc: "Jalapenos, caramelized onions, mozzarella, and a smoky chili finish.",
        img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    },

    {
        id: "pepperoni",
        category: "Non-Veg",
        filter: "nonveg",
        name: "Smoky Pepperoni",
        price: 16.75,
        desc: "Crisp-edged pepperoni, smoked mozzarella, and house tomato sauce.",
        img: "https://images.unsplash.com/photo-1604382355076-af4d2f52cf3a?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "bbq-chicken",
        category: "Non-Veg",
        filter: "nonveg",
        name: "BBQ Chicken Blaze",
        price: 17.5,
        desc: "Slow-smoked chicken, BBQ glaze, red onions, and cheddar melt.",
        img: "https://images.unsplash.com/photo-1565299585323-0500c2f0efef?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "meat-lovers",
        category: "Non-Veg",
        filter: "nonveg",
        name: "Meat Lovers",
        price: 18.99,
        desc: "Pepperoni, sausage, bacon, and beef—stacked for maximum craving.",
        img: "https://images.unsplash.com/photo-1548365328-8bdb1f7a7e0f?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "italian-sausage",
        category: "Non-Veg",
        filter: "nonveg",
        name: "Italian Sausage & Herbs",
        price: 17.25,
        desc: "Herb sausage, roasted garlic, mozzarella, and a touch of chili flakes.",
        img: "https://images.unsplash.com/photo-1590947132387-2c1b9d6c1bfa?auto=format&fit=crop&w=900&q=80",
    },

    {
        id: "truffle-mushroom",
        category: "Special",
        filter: "special",
        name: "Truffle Mushroom Luxe",
        price: 22.0,
        desc: "Wild mushrooms, truffle cream, thyme, and golden cheese bubbles.",
        img: "https://images.unsplash.com/photo-1604908176997-125f25cc5001?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "hot-honey",
        category: "Special",
        filter: "special",
        name: "Hot Honey Pepperoni",
        price: 21.5,
        desc: "Smoky pepperoni with hot honey drizzle and chili-lime zest.",
        img: "https://images.unsplash.com/photo-1612189560717-5f5d8f7d2f5c?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "pesto-rosa",
        category: "Special",
        filter: "special",
        name: "Pesto Rosa",
        price: 20.75,
        desc: "Creamy pesto sauce, roasted tomatoes, basil, and mozzarella ribbons.",
        img: "https://images.unsplash.com/photo-1600628422019-9f3c5e0a1c8c?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "smoked-char",
        category: "Special",
        filter: "special",
        name: "Smoked Char Supreme",
        price: 23.25,
        desc: "High-heat char, spicy tomato, pepperoni, and roasted peppers.",
        img: "https://images.unsplash.com/photo-1601924582975-8bdb1f7a7e0f?auto=format&fit=crop&w=900&q=80",
    },

    {
        id: "combo-classic",
        category: "Combos",
        filter: "combos",
        name: "Classic Combo (Pizza + Dip)",
        price: 24.99,
        desc: "One pizza + garlic dip. Perfect for solo cravings and quick nights.",
        img: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "family-feast",
        category: "Combos",
        filter: "combos",
        name: "Family Feast Deal",
        price: 59.99,
        desc: "4 pizzas + 2 sides. Feed the crew with variety and value.",
        img: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "date-night",
        category: "Combos",
        filter: "combos",
        name: "Date Night Duo",
        price: 39.99,
        desc: "Two pizzas + two dips. Add a dessert upgrade at checkout (demo).",
        img: "https://images.unsplash.com/photo-1548365328-8bdb1f7a7e0f?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "party-pack",
        category: "Combos",
        filter: "combos",
        name: "Party Pack Bundle",
        price: 79.99,
        desc: "6 pizzas + 3 sides. Built for game day, birthdays, and big hangs.",
        img: "https://images.unsplash.com/photo-1604908176997-125f25cc5001?auto=format&fit=crop&w=900&q=80",
    },
];

function renderMenu() {
    const grid = $('[data-menu-grid]');
    if (!grid) return;

    grid.innerHTML = "";

    for (const item of MENU) {
        const card = document.createElement("article");
        card.className = "menu-card";
        card.dataset.category = item.filter;
        card.setAttribute("data-menu-card", "");
        card.innerHTML = `
      <img class="menu-card__img" src="${item.img}" alt="${escapeHtml(item.name)}" loading="lazy" />
      <div class="menu-card__body">
        <div class="menu-card__top">
          <div>
            <h3 class="menu-card__name">${escapeHtml(item.name)}</h3>
            <p class="menu-card__desc">${escapeHtml(item.desc)}</p>
          </div>
          <div class="menu-card__price">${money(item.price)}</div>
        </div>
        <div class="menu-card__actions">
          <div class="qty-stepper" aria-label="Add quantity for ${escapeHtml(item.name)}">
            <button type="button" data-quick-minus data-id="${item.id}" aria-label="Decrease">−</button>
            <span data-quick-qty>1</span>
            <button type="button" data-quick-plus data-id="${item.id}" aria-label="Increase">+</button>
          </div>
          <button class="add-btn" type="button" data-add-to-cart data-id="${item.id}">
            <span aria-hidden="true">+ </span>Add
          </button>
        </div>
      </div>
    `;
        grid.appendChild(card);
    }
}

function initMenuUI() {
    const chips = $$(".chip[data-filter]");
    const cards = $$('[data-menu-card]');

    function applyFilter(filter) {
        state.filter = filter;
        for (const chip of chips) {
            const isActive = chip.getAttribute("data-filter") === filter;
            chip.classList.toggle("chip--active", isActive);
            chip.setAttribute("aria-selected", String(isActive));
        }

        for (const card of cards) {
            const cat = card.dataset.category;
            const visible = filter === "all" || cat === filter;
            card.style.display = visible ? "flex" : "none";
        }
    }

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            applyFilter(chip.getAttribute("data-filter"));
        });
    });

    // Delegated click: add to cart + quick qty controls
    document.addEventListener("click", (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;

        const addBtn = t.closest("[data-add-to-cart]");
        if (addBtn) {
            const id = addBtn.getAttribute("data-id");
            const item = MENU.find((m) => m.id === id);
            if (!item) return;

            const card = t.closest("[data-menu-card]");
            const qtyEl = card?.querySelector("[data-quick-qty]");
            const qty = qtyEl ? Math.max(1, parseInt(qtyEl.textContent || "1", 10) || 1) : 1;
            for (let i = 0; i < qty; i += 1) addToCart(item);
            return;
        }

        const plus = t.closest("[data-quick-plus]");
        const minus = t.closest("[data-quick-minus]");
        if (plus || minus) {
            const id = (plus || minus).getAttribute("data-id");
            const card = t.closest("[data-menu-card]");
            const qtyEl = card?.querySelector("[data-quick-qty]");
            if (!qtyEl) return;
            const current = Math.max(1, parseInt(qtyEl.textContent || "1", 10) || 1);
            const next = plus ? current + 1 : current - 1;
            qtyEl.textContent = String(Math.max(1, next));
            return;
        }
    });

    applyFilter("all");
}

function initMenuSection() {
    renderMenu();
    initMenuUI();
}

function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    const note = $("#formNote");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const phone = String(data.get("phone") || "").trim();
        const email = String(data.get("email") || "").trim();
        const topic = String(data.get("topic") || "").trim();
        const message = String(data.get("message") || "").trim();

        if (!name || !phone || !email || !topic || !message) {
            note.textContent = "Please fill in all fields.";
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            note.textContent = "Please enter a valid email address.";
            return;
        }

        // Demo submission
        note.textContent = "Message sent! We’ll get back to you shortly.";
        showToast("Thanks! Your message was received (demo).");
        form.reset();
    });
}

function initFooterYear() {
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initScrollOffsetFix() {
    // Prevent content from hiding under sticky header on hash navigation.
    // We do this by applying scroll-margin to sections in CSS, but some browsers may still need help.
    // Keeping minimal here.
}

function init() {
    initTheme();
    initRevealAnimations();
    initNav();
    initFooterYear();

    initMenuSection();

    loadCart();
    setBadge();
    renderCart();
    initCart();

    initContactForm();

    // Theme button
    const themeBtn = $('[data-theme-toggle]');
    themeBtn?.addEventListener("click", toggleTheme);
}

document.addEventListener("DOMContentLoaded", init);


