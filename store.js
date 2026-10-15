const CATALOG_KEY = "nova_catalog_v1";
const PIN_KEY = "nova_admin_pin";

function defaultCatalog() {
  return {
    config: JSON.parse(JSON.stringify(window.SHOP_CONFIG || {})),
    collections: JSON.parse(JSON.stringify(window.COLLECTIONS || [])),
    trust: JSON.parse(JSON.stringify(window.TRUST || [])),
    products: JSON.parse(JSON.stringify(window.PRODUCTS || []))
  };
}

function loadCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return defaultCatalog();
    const data = JSON.parse(raw);
    return {
      config: { ...defaultCatalog().config, ...(data.config || {}) },
      collections: Array.isArray(data.collections) && data.collections.length ? data.collections : defaultCatalog().collections,
      trust: Array.isArray(data.trust) && data.trust.length ? data.trust : defaultCatalog().trust,
      products: Array.isArray(data.products) ? data.products : defaultCatalog().products
    };
  } catch (e) {
    return defaultCatalog();
  }
}

function saveCatalog(data) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(data));
}

function applyCatalogToWindow(data) {
  window.SHOP_CONFIG = data.config;
  window.COLLECTIONS = data.collections;
  window.TRUST = data.trust;
  window.PRODUCTS = data.products;
}

function slugify(text) {
  return String(text || "cat")
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || ("c" + Date.now().toString(36));
}

function uid(prefix) {
  return (prefix || "p") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function compressImage(file, max = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
