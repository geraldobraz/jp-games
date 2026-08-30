import { SEED_TABS, SEED_CATALOG } from "./seedData.js";

const LS_TABS = "gamesGridTabs";
const LS_CATALOG = "gamesGridCatalog";
const LS_BOUGHT = "gamesGridBought";
const LS_ACTIVE_TAB = "gamesGridActiveTab";

// Blocks the classic prototype-pollution keys. Tab ids end up as object
// property keys (catalog[tabId] = ...), so anything loaded from storage
// has to pass this check before it's trusted as a key.
export function isSafeKey(id) {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id.length < 200 &&
    id !== "__proto__" &&
    id !== "constructor" &&
    id !== "prototype"
  );
}

export function makeId(prefix) {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function slugify(label) {
  const s = (label || "tab")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return s || "tab";
}

function lsGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function withIds(list) {
  return list.map((g) => ({ id: makeId("g"), ...g }));
}

export function loadTabs() {
  const raw = lsGet(LS_TABS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        const seen = new Set();
        const clean = [];
        parsed.forEach((t) => {
          if (!t || typeof t.id !== "string" || typeof t.label !== "string") return;
          if (!isSafeKey(t.id)) return;
          if (seen.has(t.id)) return;
          seen.add(t.id);
          clean.push({ id: t.id, label: t.label.slice(0, 80) });
        });
        SEED_TABS.forEach((seedTab) => {
          if (!seen.has(seedTab.id)) {
            seen.add(seedTab.id);
            clean.push({ ...seedTab });
          }
        });
        if (clean.length) return clean;
      }
    } catch (e) {
      /* fall through to seed */
    }
  }
  return SEED_TABS.slice();
}

export function saveTabs(tabs) {
  return lsSet(LS_TABS, JSON.stringify(tabs));
}

function isValidImage(value) {
  return typeof value === "string" && value.length > 0;
}

export function loadCatalogAll(tabs) {
  const out = {};
  const raw = lsGet(LS_CATALOG);
  let parsed = null;
  if (raw) {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) parsed = p;
    } catch (e) {
      /* ignore */
    }
  }
  tabs.forEach((t) => {
    if (!isSafeKey(t.id)) return;
    const seedList = SEED_CATALOG[t.id] || [];
    if (parsed && Array.isArray(parsed[t.id]) && parsed[t.id].length > 0) {
      const existing = parsed[t.id]
        .filter((g) => g && typeof g.id === "string" && typeof g.name === "string")
        .map((g) => ({
          ...g,
          star: typeof g.star === "boolean" ? g.star : false,
          image: isValidImage(g.image) ? g.image : undefined,
        }));
      const existingNames = new Set(existing.map((g) => g.name.toLowerCase()));
      seedList.forEach((seedItem) => {
        if (!existingNames.has(seedItem.name.toLowerCase())) {
          existing.push({ id: makeId("g"), ...seedItem });
        }
      });
      out[t.id] = existing;
    } else {
      out[t.id] = withIds(seedList);
    }
  });
  return out;
}

export function saveCatalogAll(catalog) {
  return lsSet(LS_CATALOG, JSON.stringify(catalog));
}

export function loadActiveTab() {
  return lsGet(LS_ACTIVE_TAB);
}

export function saveActiveTab(id) {
  lsSet(LS_ACTIVE_TAB, id);
}

export function loadBought() {
  const raw = lsGet(LS_BOUGHT);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const clean = {};
        Object.keys(parsed).forEach((k) => {
          if (isSafeKey(k)) clean[k] = !!parsed[k];
        });
        return clean;
      }
    } catch (e) {
      /* ignore */
    }
  }
  return {};
}

export function saveBought(bought) {
  lsSet(LS_BOUGHT, JSON.stringify(bought));
}
