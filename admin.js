const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let catalog = loadCatalog();
let editingId = null;

function toast(msg) { alert(msg); }

function unlocked() {
  return sessionStorage.getItem("nova_admin_ok") === "1";
}

function showApp() {
  $("#lock").classList.add("hidden");
  $("#app").classList.remove("hidden");
  renderAll();
}

function tryUnlock() {
  const pin = $("#pin").value.trim();
  const saved = localStorage.getItem(PIN_KEY);
  if (!pin || pin.length < 4) return toast("PIN від 4 символів");
  if (!saved) {
    localStorage.setItem(PIN_KEY, pin);
    sessionStorage.setItem("nova_admin_ok", "1");
    showApp();
    toast("PIN збережено на цьому пристрої.");
    return;
  }
  if (pin === saved) {
    sessionStorage.setItem("nova_admin_ok", "1");
    showApp();
    return;
  }
  toast("Невірний PIN");
}

function renderProducts() {
  const box = $("#productList");
  if (!catalog.products.length) {
    box.innerHTML = `<p class="hint">Поки немає товарів. Натисніть «Додати товар».</p>`;
    return;
  }
  box.innerHTML = catalog.products.map(p => `
    <article class="item">
      ${p.image ? `<img src="${p.image}" alt="">` : `<div class="ph">${p.art || "—"}</div>`}
      <div>
        <b>${p.title}</b>
        <span>${p.category} · ${p.price} грн · ${p.inStock === false ? "немає" : "в наявності"}</span>
      </div>
      <button class="ghost" data-edit="${p.id}">Редагувати</button>
    </article>`).join("");
}

function renderCats() {
  $("#catList").innerHTML = catalog.collections.map(c => `
    <article class="item" style="grid-template-columns:1fr auto">
      <div>
        <b>${c.title}</b>
        <span>id: ${c.id} · меню: ${c.menu || c.title}</span>
      </div>
      <div class="row">
        <button class="ghost" data-edit-cat="${c.id}">Змінити</button>
        ${c.id === "all" ? "" : `<button class="danger" data-del-cat="${c.id}">✕</button>`}
      </div>
    </article>`).join("");
}

function shopFields() {
  return [
    ["name", "Назва магазину"],
    ["heroOutline", "Заголовок (контур)"],
    ["heroLime", "Заголовок (лаймовий)"],
    ["heroText", "Текст під заголовком"],
    ["phone", "Телефон"],
    ["telegram", "Посилання Telegram"],
    ["instagram", "Instagram"],
    ["email", "Email"],
    ["delivery", "Доставка"],
    ["city", "Місто / країна"],
    ["managerBtn", "Текст кнопки менеджера"],
    ["catalogBtn", "Текст кнопки каталогу"],
    ["logoDot", "Колір крапки (#ff2d95)"]
  ];
}

function renderShop() {
  $("#shopForm").innerHTML = shopFields().map(([k, label]) => `
    <label>${label}<input name="${k}" value="${(catalog.config[k] || "").replace(/"/g, "&quot;")}"></label>
  `).join("");
}

function renderAll() {
  renderProducts();
  renderCats();
  renderShop();
}

function fillCatSelect(selected) {
  $("#catSelect").innerHTML = catalog.collections
    .filter(c => c.id !== "all")
    .map(c => `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.title}</option>`)
    .join("");
}

function openProduct(p) {
  editingId = p ? p.id : null;
  $("#modalTitle").textContent = p ? "Редагувати товар" : "Новий товар";
  const f = $("#productForm");
  f.reset();
  f.id.value = p ? p.id : "";
  f.title.value = p ? p.title : "";
  f.price.value = p ? p.price : "";
  f.oldPrice.value = p && p.oldPrice ? p.oldPrice : "";
  f.volume.value = p ? (p.volume || "") : "";
  f.badge.value = p ? (p.badge || "") : "";
  f.art.value = p ? (p.art || "") : "";
  f.spec.value = p ? (p.spec || "") : "";
  f.extra.value = p ? (p.extra || "") : "";
  f.note.value = p ? (p.note || p.short || "") : "";
  f.desc.value = p ? (p.desc || "") : "";
  f.inStock.checked = p ? p.inStock !== false : true;
  f.image.value = p ? (p.image || "") : "";
  f.imagePath.value = p ? (p.imagePath || "") : "";
  const prev = $("#preview");
  const src = (p && (p.image || p.imagePath)) || "";
  if (src) { prev.src = src; prev.classList.remove("hidden"); }
  else { prev.removeAttribute("src"); prev.classList.add("hidden"); }
  fillCatSelect(p ? p.category : (catalog.collections.find(c => c.id !== "all") || {}).id);
  $("#deleteProduct").style.display = p ? "inline-block" : "none";
  $("#modal").classList.remove("hidden");
}

function persist() {
  saveCatalog(catalog);
  applyCatalogToWindow(catalog);
}

$("#unlock").onclick = tryUnlock;
$("#pin").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
$("#logout").onclick = () => { sessionStorage.removeItem("nova_admin_ok"); location.reload(); };

$$("header nav button").forEach(btn => btn.onclick = () => {
  $$("header nav button").forEach(b => b.classList.remove("on"));
  btn.classList.add("on");
  $$(".tab").forEach(t => t.classList.remove("on"));
  $("#tab-" + btn.dataset.tab).classList.add("on");
});

$("#addProduct").onclick = () => openProduct(null);
$("#closeModal").onclick = () => $("#modal").classList.add("hidden");
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") e.currentTarget.classList.add("hidden"); });

$("#productList").addEventListener("click", (e) => {
  const id = e.target.dataset.edit;
  if (!id) return;
  openProduct(catalog.products.find(p => p.id === id));
});

$("#productForm").file.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) return toast("Файл завеликий. До 8 МБ.");
  const data = await compressImage(file);
  const f = $("#productForm");
  f.image.value = data;
  const id = f.id.value || uid("p");
  if (!f.id.value) f.id.value = id;
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-");
  f.imagePath.value = "images/" + (safe || (id + ".jpg"));
  $("#preview").src = data;
  $("#preview").classList.remove("hidden");
});

$("#productForm").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const item = {
    id: f.id.value || uid("p"),
    title: f.title.value.trim(),
    price: Number(f.price.value || 0),
    oldPrice: f.oldPrice.value ? Number(f.oldPrice.value) : null,
    category: f.category.value,
    volume: f.volume.value.trim(),
    badge: f.badge.value.trim(),
    art: f.art.value.trim() || f.title.value.trim().slice(0, 4).toUpperCase(),
    spec: f.spec.value.trim(),
    extra: f.extra.value.trim(),
    note: f.note.value.trim(),
    short: f.note.value.trim(),
    desc: f.desc.value.trim(),
    image: f.image.value,
    imagePath: f.imagePath.value.trim(),
    inStock: f.inStock.checked
  };
  const i = catalog.products.findIndex(p => p.id === item.id);
  if (i >= 0) catalog.products[i] = item;
  else catalog.products.unshift(item);
  persist();
  renderProducts();
  $("#modal").classList.add("hidden");
};

$("#deleteProduct").onclick = () => {
  if (!editingId) return;
  if (!confirm("Видалити товар?")) return;
  catalog.products = catalog.products.filter(p => p.id !== editingId);
  persist();
  renderProducts();
  $("#modal").classList.add("hidden");
};

$("#addCat").onclick = () => {
  const title = prompt("Назва категорії");
  if (!title) return;
  const menu = prompt("Як показати в меню", title) || title;
  let id = slugify(title);
  if (catalog.collections.some(c => c.id === id)) id = uid("c");
  catalog.collections.push({ id, title, menu });
  persist();
  renderCats();
};

$("#catList").addEventListener("click", (e) => {
  const edit = e.target.dataset.editCat;
  const del = e.target.dataset.delCat;
  if (edit) {
    const c = catalog.collections.find(x => x.id === edit);
    const title = prompt("Назва", c.title);
    if (!title) return;
    const menu = prompt("Меню", c.menu || c.title) || title;
    c.title = title;
    c.menu = menu;
    persist();
    renderCats();
  }
  if (del) {
    if (!confirm("Видалити категорію? Товари залишаться, але без цього розділу в меню.")) return;
    catalog.collections = catalog.collections.filter(c => c.id !== del);
    persist();
    renderCats();
  }
});

$("#saveShop").onclick = () => {
  const data = Object.fromEntries(new FormData($("#shopForm")).entries());
  catalog.config = { ...catalog.config, ...data };
  persist();
  toast("Налаштування збережено. Оновіть вітрину.");
};

function toJs(value) {
  return JSON.stringify(value, null, 2);
}

function catalogForFile() {
  return {
    config: catalog.config,
    collections: catalog.collections,
    trust: catalog.trust,
    products: catalog.products.map(p => {
      const copy = { ...p };
      if (copy.imagePath) copy.image = copy.imagePath;
      delete copy.imagePath;
      if (typeof copy.image === "string" && copy.image.startsWith("data:")) {
        copy.image = "images/" + copy.id + ".jpg";
      }
      return copy;
    })
  };
}

function downloadText(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
  a.download = name;
  a.click();
}

$("#exportJsBtn").onclick = () => {
  const data = catalogForFile();
  const js = `// Згенеровано кабінетом. Замініть цей файл у папці магазину.
// Фото кладіть у папку images/ і пишіть шлях images/назва.jpg

window.SHOP_CONFIG = ${toJs(data.config)};

window.COLLECTIONS = ${toJs(data.collections)};

window.TRUST = ${toJs(data.trust)};

window.PRODUCTS = ${toJs(data.products)};
`;
  downloadText("products.js", js, "text/javascript");
  toast("Файл products.js завантажено. Покладіть його в папку магазину замість старого. Фото — у папку images/");
};

$("#exportPhotosBtn").onclick = () => {
  const pics = catalog.products.filter(p => p.image && String(p.image).startsWith("data:"));
  if (!pics.length) return toast("Немає фото, завантажених у кабінет. Якщо фото вже лежать у images/, нічого качати не треба.");
  pics.forEach((p, i) => {
    const name = (p.imagePath || ("images/" + p.id + ".jpg")).split("/").pop();
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = p.image;
      a.download = name;
      a.click();
    }, i * 250);
  });
};

$("#exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "nova-catalog.json";
  a.click();
};

$("#importFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    catalog = {
      config: { ...catalog.config, ...(data.config || {}) },
      collections: data.collections || catalog.collections,
      trust: data.trust || catalog.trust,
      products: data.products || catalog.products
    };
    persist();
    renderAll();
    toast("Імпортовано.");
  } catch (err) {
    toast("Файл пошкоджений.");
  }
};

$("#resetBtn").onclick = () => {
  if (!confirm("Повернути стартовий шаблон? Ваші товари в кабінеті зникнуть.")) return;
  localStorage.removeItem(CATALOG_KEY);
  catalog = loadCatalog();
  persist();
  renderAll();
};

$("#savePin").onclick = () => {
  const pin = $("#newPin").value.trim();
  if (pin.length < 4) return toast("PIN від 4 символів");
  localStorage.setItem(PIN_KEY, pin);
  $("#newPin").value = "";
  toast("PIN оновлено.");
};

if (unlocked()) showApp();
else {
  const saved = localStorage.getItem(PIN_KEY);
  $("#lockHint").textContent = saved
    ? "Введіть свій PIN."
    : "Перший вхід: придумайте PIN від 4 символів. Він збережеться лише в цьому браузері.";
}
