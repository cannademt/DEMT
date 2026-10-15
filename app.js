const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  view: "home",
  collection: "pods",
  query: "",
  sort: "rec",
  cart: JSON.parse(localStorage.getItem("nova_cart") || "[]")
};

function money(n) {
  return "UAH " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function applyBrand() {
  $("#shopName").textContent = SHOP_CONFIG.name;
  $("#logoDot").style.background = SHOP_CONFIG.logoDot || "#ff2d95";
  document.title = SHOP_CONFIG.name;
  if ($("#heroOutline")) $("#heroOutline").textContent = SHOP_CONFIG.heroOutline || "ЗБЕРИ";
  if ($("#heroLime")) $("#heroLime").textContent = SHOP_CONFIG.heroLime || "ІДЕАЛЬНИЙ НАБІР";
  $("#heroText").textContent = SHOP_CONFIG.heroText;
  if ($("#catalogBtn")) $("#catalogBtn").textContent = (SHOP_CONFIG.catalogBtn || "Весь каталог") + " →";
  if ($("#managerBtn")) {
    $("#managerBtn").textContent = "✈ " + (SHOP_CONFIG.managerBtn || "Звʼязатися з менеджером");
    $("#managerBtn").href = SHOP_CONFIG.telegram || "#contact";
  }
  $("#ageTitle").textContent = SHOP_CONFIG.ageTitle;
  $("#ageSub").textContent = SHOP_CONFIG.ageSub;
  $("#ageText").textContent = SHOP_CONFIG.ageText;
  $("#warning").textContent = SHOP_CONFIG.warning;
  $("#phoneLink").textContent = SHOP_CONFIG.phone;
  $("#phoneLink").href = "tel:" + SHOP_CONFIG.phone.replace(/\s/g, "");
  $("#mailLink").textContent = SHOP_CONFIG.email;
  $("#mailLink").href = "mailto:" + SHOP_CONFIG.email;
  $("#tgLink").href = SHOP_CONFIG.telegram;
  $("#igLink").href = SHOP_CONFIG.instagram;
  const bits = [SHOP_CONFIG.delivery, "18+", SHOP_CONFIG.city];
  const tick = bits.join("  ·  ") + "  ·  ";
  $("#announceTrack").textContent = tick + tick;

  $("#menuNav").innerHTML = [
    '<a href="#home" data-nav="home">Головна</a>',
    ...COLLECTIONS.filter(c => c.id !== "all").map(c => `<a href="#catalog/${c.id}" data-nav="${c.id}">${c.menu}</a>`),
    '<a href="#delivery" data-nav="delivery">Доставка і оплата</a>',
    '<a href="#contact" data-nav="contact">Звʼязок з нами</a>'
  ].join("");
  const tg = SHOP_CONFIG.telegram || "#contact";
  if ($("#tgFloat")) $("#tgFloat").href = tg;
  if ($("#managerBtn")) $("#managerBtn").href = tg;
  document.title = SHOP_CONFIG.name;
  const desc = SHOP_CONFIG.heroText || SHOP_CONFIG.tagline || "";
  const abs = (SHOP_CONFIG.siteUrl || (location.protocol !== "file:" ? location.origin : "")).replace(/\/$/, "");
  const img = SHOP_CONFIG.ogImage || "images/cover.svg";
  const setMeta = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
  setMeta("metaDesc", "content", desc);
  setMeta("ogTitle", "content", SHOP_CONFIG.name);
  setMeta("ogDesc", "content", desc);
  setMeta("ogImage", "content", abs ? abs + "/" + img : img);
  setMeta("ogUrl", "content", abs || location.href);
  if ($("#filterSel")) {
    $("#filterSel").innerHTML = COLLECTIONS.map(c =>
      `<option value="${c.id}">${c.id === "all" ? "Усі категорії" : c.title}</option>`
    ).join("");
  }

  const homeCols = COLLECTIONS.filter(c => c.id !== "all");
  $("#homeSections").innerHTML = homeCols.map((c, idx) => {
    const items = PRODUCTS.filter(p => p.category === c.id).slice(0, 4);
    if (!items.length) return "";
    return `<section class="home-sec">
      <div class="num">${String(idx + 1).padStart(2, "0")}</div>
      <h2>${c.title}</h2>
      <div class="grid">${items.map((p, i) => cardHTML(p, i === 0)).join("")}</div>
      <a class="cta-ghost" href="#catalog/${c.id}" style="margin:6px 0 10px">Дивитись усі →</a>
    </section>`;
  }).join("");

  const icons = ["▣", "◈", "◉", "◎"];
  $("#homeTrust").innerHTML = `<div class="trust">${TRUST.map((t, i) => `
    <div class="trust-item">
      <div class="num">${t.n}</div>
      <div class="ico">${icons[i % icons.length]}</div>
      <h3>${t.title}</h3>
      <p>${t.text}</p>
    </div>`).join("")}</div>`;
}

function photoOf(p) {
  return p.imagePath || p.image || "";
}

function photoHTML(p) {
  const src = photoOf(p);
  const art = `<div class="art"><span>${(p.art || "FOTO").slice(0, 6)}</span></div>`;
  if (!src) return art;
  return art + `<img src="${src}" alt="${p.title}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">`;
}

function cardHTML(p, on) {
  const spec = p.spec || (p.volume ? ("Обʼєм / формат: " + p.volume) : "");
  const extra = p.extra || "";
  const note = p.note || p.short || "";
  return `<article class="card${on ? " is-on" : ""}">
    <div class="thumb">
      ${photoHTML(p)}
      ${p.badge && p.inStock !== false ? `<span class="tag">${p.badge}</span>` : ""}
      ${p.inStock === false ? `<span class="oos-tag">НЕМАЄ</span><div class="oos">Немає в наявності</div>` : ""}
    </div>
    <div class="card-copy">
      <h3>${p.volume ? p.volume + " · " : ""}${p.title}</h3>
      ${spec ? `<div class="spec">${spec}</div>` : ""}
      ${extra ? `<div class="extra">${extra}</div>` : ""}
      ${note ? `<div class="note">${note}</div>` : ""}
      <div class="price">${money(p.price)}${p.oldPrice ? `<span class="old">${money(p.oldPrice)}</span>` : ""}</div>
      <div class="row-btns">
        ${p.inStock === false
          ? `<button class="btn btn-dark" data-ask="${p.id}" style="grid-column:1/-1">Написати про товар</button>`
          : `<button class="btn btn-lime" data-add="${p.id}">У кошик</button>
             <button class="btn btn-dark" data-ask="${p.id}">Написати</button>`}
      </div>
      <button class="btn btn-dark" data-open="${p.id}" style="width:100%;margin-top:6px">Деталі</button>
    </div>
  </article>`;
}

function filtered() {
  let list = PRODUCTS.filter(p => {
    const byCol = state.collection === "all" || p.category === state.collection;
    const q = state.query.trim().toLowerCase();
    const byQ = !q || (p.title + " " + p.short + " " + p.desc).toLowerCase().includes(q);
    return byCol && byQ;
  });
  if (state.sort === "new") list = [...list].reverse();
  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  return list;
}

function renderGrid() {
  const list = filtered();
  const col = COLLECTIONS.find(c => c.id === state.collection) || COLLECTIONS[0];
  $("#colTitle").textContent = col.title;
  $("#resultCount").textContent = list.length + " результатів";
  const filterSel = $("#filterSel");
  if (filterSel && filterSel.options.length) filterSel.value = state.collection;
  $("#grid").innerHTML = list.map((p, i) => cardHTML(p, i === 0)).join("") || `<p class="empty" style="grid-column:1/-1">Нічого не знайдено</p>`;
}

function showPage(id) {
  $$(".page").forEach(p => p.classList.remove("on"));
  const el = $("#page-" + id) || $("#page-home");
  el.classList.add("on");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function route() {
  const hash = (location.hash || "#home").slice(1);
  const [page, colRaw] = hash.split("/");
  const col = colRaw ? decodeURIComponent(colRaw) : "";
  $("#menu").classList.remove("open");
  $("#searchLayer").classList.remove("open");
  if (page === "catalog") {
    state.collection = col || "all";
    state.view = "catalog";
    showPage("catalog");
    renderGrid();
  } else if (["about", "contact", "privacy", "terms", "delivery"].includes(page)) {
    showPage(page);
  } else {
    showPage("home");
  }
  $$("#menuNav a").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + hash || (page === "catalog" && a.dataset.nav === col));
  });
}

function saveCart() {
  localStorage.setItem("nova_cart", JSON.stringify(state.cart));
  renderCart();
}
function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }
function cartSum() { return state.cart.reduce((s, i) => s + i.qty * i.price, 0); }

function renderCart() {
  const before = state.cart.length;
  state.cart = state.cart.filter(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return p && p.inStock !== false;
  });
  if (state.cart.length !== before) localStorage.setItem("nova_cart", JSON.stringify(state.cart));
  const n = cartCount();
  $("#cartCount").textContent = n;
  $("#cartCount").style.display = n ? "grid" : "none";
  $("#cartSum").textContent = money(cartSum());
  if (!state.cart.length) {
    $("#cartList").innerHTML = `<p class="empty">Кошик порожній</p>`;
    $("#checkoutBtn").disabled = true;
    return;
  }
  $("#checkoutBtn").disabled = false;
  $("#cartList").innerHTML = state.cart.map(i => `
    <div class="citem">
      ${i.image ? `<img src="${i.image}" alt="" style="width:64px;height:64px;object-fit:cover">` : `<div class="ph">${i.art || ""}</div>`}
      <div>
        <div>${i.title}</div>
        <div style="color:#9a9a9a;font-size:13px">${money(i.price)}</div>
        <div class="qty">
          <button data-qty="${i.id}" data-d="-1">−</button>
          <span>${i.qty}</span>
          <button data-qty="${i.id}" data-d="1">+</button>
        </div>
      </div>
      <strong>${money(i.price * i.qty)}</strong>
    </div>`).join("");
}

function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.inStock === false) return;
  const row = state.cart.find(x => x.id === id);
  if (row) row.qty += 1;
  else state.cart.push({ id: p.id, title: p.title, price: p.price, art: p.art, image: p.image || "", qty: 1 });
  saveCart();
  openCart();
}

function telegramLink(text) {
  const raw = (SHOP_CONFIG.telegram || "").trim();
  const user = raw.replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  const msg = encodeURIComponent(text);
  if (!user || user === "your_shop") return "";
  return "https://t.me/" + user + "?text=" + msg;
}

function orderText() {
  const lines = [
    "Замовлення з сайту " + (SHOP_CONFIG.name || ""),
    "",
    ...state.cart.map(i => "• " + i.title + " × " + i.qty + " — " + money(i.price * i.qty)),
    "",
    "Разом: " + money(cartSum()),
    "",
    "Напишіть місто і відділення Нової Пошти. Менеджер підтвердить замовлення."
  ];
  return lines.join("\n");
}

function askAbout(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const text = "Питання по товару: " + p.title + "\n" + money(p.price) + (p.inStock === false ? "\n(зараз немає в наявності)" : "");
  const url = telegramLink(text);
  if (!url) {
    alert("Вкажіть Telegram у кабінеті: https://t.me/ваш_нік");
    return;
  }
  window.open(url, "_blank");
}

function renderSuggest(q) {
  const box = $("#suggest");
  if (!box) return;
  const query = (q || "").trim().toLowerCase();
  let list = PRODUCTS;
  if (query) {
    list = PRODUCTS.filter(p => (p.title + " " + (p.short || "") + " " + (p.desc || "") + " " + (p.category || "")).toLowerCase().includes(query));
  }
  list = list.slice(0, 6);
  box.innerHTML = list.map(p => `
    <button class="sug" data-sug="${p.id}">
      ${photoOf(p) ? `<img src="${photoOf(p)}" alt="" onerror="this.remove()">` : `<div class="ph">${(p.art || "").slice(0,4)}</div>`}
      <div>
        <b>${p.title}</b>
        <span class="${p.inStock === false ? "off" : ""}">${p.inStock === false ? "Немає в наявності" : money(p.price)}</span>
      </div>
    </button>`).join("") || `<div class="sug"><div></div><div><b>Нічого не знайдено</b><span>Спробуйте іншу назву</span></div></div>`;
}

function sendOrderToTelegram() {
  if (!state.cart.length) return;
  const url = telegramLink(orderText());
  if (!url) {
    alert("Вкажіть посилання Telegram у кабінеті або в products.js (поле telegram), наприклад https://t.me/yourname");
    return;
  }
  window.open(url, "_blank");
}

function openCart() { $("#overlay").classList.add("open"); $("#cartDrawer").classList.add("open"); }
function closeAll() {
  $("#overlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
  $("#productModal").classList.remove("open");
  $("#checkoutModal").classList.remove("open");
}

function bind() {
  $("#yesAge").onclick = () => { localStorage.setItem("nova_age", "1"); $("#gate").classList.add("hidden"); };
  $("#noAge").onclick = () => alert("Вхід лише з 18 років.");
  if (localStorage.getItem("nova_age") === "1") $("#gate").classList.add("hidden");

  $("#menuBtn").onclick = () => $("#menu").classList.add("open");
  $("#closeMenu").onclick = () => $("#menu").classList.remove("open");
  $("#searchBtn").onclick = () => { $("#searchLayer").classList.toggle("open"); $("#search").focus(); renderSuggest($("#search").value); };
  $("#searchLayer").addEventListener("click", (e) => { if (e.target.id === "searchLayer") e.currentTarget.classList.remove("open"); });
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderSuggest(e.target.value);
  });
  $("#suggest").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sug]");
    if (!btn) return;
    const p = PRODUCTS.find(x => x.id === btn.dataset.sug);
    if (!p) return;
    $("#searchLayer").classList.remove("open");
    location.hash = "#catalog/" + (p.category || "all");
    setTimeout(() => {
      const openBtn = document.querySelector('[data-open="' + p.id + '"]');
      if (openBtn) openBtn.click();
    }, 50);
  });
  $("#sortSel").onchange = (e) => { state.sort = e.target.value; renderGrid(); };
  $("#filterSel").onchange = (e) => {
    state.collection = e.target.value;
    location.hash = "#catalog/" + state.collection;
  };

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) addToCart(add.dataset.add);
    const ask = e.target.closest("[data-ask]");
    if (ask) askAbout(ask.dataset.ask);
    const open = e.target.closest("[data-open]");
    if (open) {
      const p = PRODUCTS.find(x => x.id === open.dataset.open);
      if (!p) return;
      const thumb = $("#pThumb");
      const src = p.imagePath || p.image;
      if (src) thumb.innerHTML = `<img src="${src}" alt="">`;
      else thumb.innerHTML = `<div class="art" id="pArt"><span>${p.art || "NOVA"}</span></div>`;
      $("#pTitle").textContent = p.title;
      $("#pDesc").textContent = p.desc;
      $("#pPrice").textContent = money(p.price);
      $("#pAdd").dataset.add = p.id;
      $("#pAdd").disabled = p.inStock === false;
      $("#pAdd").style.display = p.inStock === false ? "none" : "block";
      $("#pAsk").dataset.ask = p.id;
      $("#productModal").classList.add("open");
    }
    const q = e.target.closest("[data-qty]");
    if (q) {
      const row = state.cart.find(x => x.id === q.dataset.qty);
      if (!row) return;
      row.qty += Number(q.dataset.d);
      if (row.qty <= 0) state.cart = state.cart.filter(x => x.id !== q.dataset.qty);
      saveCart();
    }
  });

  $("#cartBtn").onclick = openCart;
  $("#closeCart").onclick = closeAll;
  $("#overlay").onclick = closeAll;
  $("#closeProduct").onclick = closeAll;
  $("#checkoutBtn").onclick = sendOrderToTelegram;
  if ($("#newsForm")) $("#newsForm").onsubmit = (e) => { e.preventDefault(); alert("Підключіть розсилку пізніше."); e.target.reset(); };
  window.addEventListener("hashchange", route);
}

applyBrand();
bind();
renderCart();
route();
