import { useState, useEffect } from "react";
import { Pencil, Check, X, Plus, Star, Eye, EyeOff } from "lucide-react";
import { SEED_TABS, getBadge } from "./seedData.js";
import {
  isSafeKey,
  makeId,
  slugify,
  loadTabs,
  saveTabs,
  loadCatalogAll,
  saveCatalogAll,
  loadActiveTab,
  saveActiveTab,
  loadBought,
  saveBought,
  loadHidePrices,
  saveHidePrices,
} from "./persistence.js";
import { readAndResizeImage } from "./imageUtils.js";

function emptyDraft() {
  return { name: "", platform: "", priceUsed: "", priceNew: "", note: "" };
}

function GameFields({ draft, onChange, ...props }) {
  return (
    <>
      <input
        className="field-input"
        type="text"
        placeholder="Game name"
        value={draft.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <input
        className="field-input"
        type="text"
        placeholder="Platform badge (e.g. PS5)"
        value={draft.platform}
        onChange={(e) => onChange("platform", e.target.value)}
      />
      <div className="field-row">
        <input
          className="field-input"
          type="text"
          placeholder="New price"
          value={draft.priceNew}
          onChange={(e) => onChange("priceNew", e.target.value)}
        />
        <input
          className="field-input"
          type="text"
          placeholder="Used price"
          value={draft.priceUsed}
          onChange={(e) => onChange("priceUsed", e.target.value)}
        />
      </div>
      <textarea
        className="field-textarea"
        placeholder="Note (optional)"
        value={draft.note}
        onChange={(e) => onChange("note", e.target.value)}
      />
    </>
  );
}

export default function App() {
  const [tabs, setTabs] = useState(() => loadTabs());
  const [catalog, setCatalog] = useState(() => loadCatalogAll(loadTabs()));
  const [activeTab, setActiveTabState] = useState(() => {
    const saved = loadActiveTab();
    const t = loadTabs();
    if (saved && isSafeKey(saved) && t.some((tab) => tab.id === saved))
      return saved;
    return t[0] ? t[0].id : null;
  });
  const [bought, setBought] = useState(() => loadBought());

  const [newTabLabel, setNewTabLabel] = useState("");
  const [newGameDraft, setNewGameDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft());
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [sortByBadge, setSortByBadge] = useState(false);
  const [hidePrices, setHidePrices] = useState(() => loadHidePrices());
  const [saveWarning, setSaveWarning] = useState("");

  // Persist to localStorage whenever the relevant piece of state changes.
  useEffect(() => {
    saveTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    const ok = saveCatalogAll(catalog);
    if (!ok) {
      setSaveWarning(
        "Your changes couldn't be saved to this browser's storage — it may be full or disabled (e.g. private browsing).",
      );
    }
  }, [catalog]);

  useEffect(() => {
    if (activeTab) saveActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveBought(bought);
  }, [bought]);

  useEffect(() => {
    saveHidePrices(hidePrices);
  }, [hidePrices]);

  function setActiveTab(id) {
    setActiveTabState(id);
    setEditingId(null);
    setSelectedPlatforms([]);
    setSortByBadge(false);
  }

  function handleAddTab(e) {
    e.preventDefault();
    const label = newTabLabel.trim();
    if (!label) return;
    let id = slugify(label) + "-" + makeId("t");
    if (!isSafeKey(id)) id = "tab-" + makeId("t");
    setTabs((prev) => [...prev, { id, label: label.slice(0, 80) }]);
    setCatalog((prev) => ({ ...prev, [id]: [] }));
    setActiveTab(id);
    setNewTabLabel("");
  }

  function handleAddGame(e) {
    e.preventDefault();
    const name = newGameDraft.name.trim();
    if (!name || !isSafeKey(activeTab)) return;
    const game = {
      id: makeId("g"),
      name,
      platform: newGameDraft.platform.trim(),
      priceUsed: newGameDraft.priceUsed.trim(),
      priceNew: newGameDraft.priceNew.trim(),
      note: newGameDraft.note.trim(),
      star: false,
    };
    setCatalog((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), game],
    }));
    setNewGameDraft(emptyDraft());
  }

  function toggleStar(gameId) {
    if (!isSafeKey(activeTab)) return;
    setCatalog((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((g) =>
        g.id === gameId ? { ...g, star: !g.star } : g,
      ),
    }));
  }

  function startEdit(game) {
    setEditingId(game.id);
    setEditDraft({
      name: game.name,
      platform: game.platform,
      priceUsed: game.priceUsed,
      priceNew: game.priceNew,
      note: game.note || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleSaveEdit(e, gameId) {
    e.preventDefault();
    const name = editDraft.name.trim();
    if (!name || !isSafeKey(activeTab)) return;
    setCatalog((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((g) =>
        g.id === gameId
          ? {
              ...g,
              name,
              platform: editDraft.platform.trim(),
              priceUsed: editDraft.priceUsed.trim(),
              priceNew: editDraft.priceNew.trim(),
              note: editDraft.note.trim(),
            }
          : g,
      ),
    }));
    setEditingId(null);
  }

  function toggleBought(gameId) {
    const key = activeTab + "#" + gameId;
    setBought((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePlatformFilter(platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  }

  async function handleCoverUpload(gameId, file) {
    if (!isSafeKey(activeTab)) return;
    try {
      const dataUrl = await readAndResizeImage(file);
      setCatalog((prev) => ({
        ...prev,
        [activeTab]: (prev[activeTab] || []).map((g) =>
          g.id === gameId ? { ...g, image: dataUrl } : g,
        ),
      }));
    } catch (err) {
      setSaveWarning(err.message);
    }
  }

  function removeCoverImage(gameId) {
    if (!isSafeKey(activeTab)) return;
    setCatalog((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).map((g) => {
        if (g.id !== gameId) return g;
        const rest = { ...g };
        delete rest.image;
        return rest;
      }),
    }));
  }

  const rawGames = catalog[activeTab] || [];
  const distinctPlatforms = Array.from(
    new Set(rawGames.map((g) => g.platform).filter(Boolean)),
  ).sort((a, b) => a - b);

  let visibleGames =
    selectedPlatforms.length === 0
      ? rawGames
      : rawGames.filter((g) => selectedPlatforms.includes(g.platform));

  if (sortByBadge) {
    visibleGames = [...visibleGames].sort((a, b) => {
      const pa = (a.platform || "").toLowerCase();
      const pb = (b.platform || "").toLowerCase();
      if (pa !== pb) return pa < pb ? -1 : 1;
      return (a.name || "")
        .toLowerCase()
        .localeCompare((b.name || "").toLowerCase());
    });
  }

  return (
    <div className="page">
      <h1>Games for Sale</h1>
      <p className="subtitle">
        Browse titles below — new and used pricing shown for each.
      </p>

      {saveWarning && (
        <div className="save-warning">
          {saveWarning}{" "}
          <button
            type="button"
            className="dismiss-warning"
            onClick={() => setSaveWarning("")}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="tabs-row">
        <div className="tabs-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={"tab-btn" + (tab.id === activeTab ? " is-active" : "")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form className="add-tab-form" onSubmit={handleAddTab}>
          <input
            className="field-input"
            id="add-tab-input"
            type="text"
            placeholder="New tab name"
            value={newTabLabel}
            onChange={(e) => setNewTabLabel(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={14} /> Add tab
          </button>
        </form>
      </div>

      <div className="filter-sort-row">
        <div className="filter-chips">
          <button
            type="button"
            className="chip"
            onClick={() => setSelectedPlatforms([])}
            style={
              selectedPlatforms.length === 0
                ? {
                    background: "#0056d2",
                    color: "#fff",
                    borderColor: "#0056d2",
                  }
                : {
                    background: "#fff",
                    color: "#4a4f57",
                    borderColor: "#e3e6ea",
                  }
            }
          >
            All
          </button>
          {distinctPlatforms.map((platform) => {
            const badge = getBadge(platform);
            const active = selectedPlatforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                className="chip"
                onClick={() => togglePlatformFilter(platform)}
                style={
                  active
                    ? {
                        background: badge.bg,
                        color: badge.color,
                        borderColor: badge.bg,
                      }
                    : {
                        background: "#fff",
                        color: "#4a4f57",
                        borderColor: "#e3e6ea",
                      }
                }
              >
                {platform}
              </button>
            );
          })}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className={"action-toggle" + (hidePrices ? " is-active" : "")}
            onClick={() => setHidePrices((v) => !v)}
            title={hidePrices ? "Show prices" : "Hide prices"}
          >
            {hidePrices ? (
              <>
                <Eye size={14} /> Show prices
              </>
            ) : (
              <>
                <EyeOff size={14} /> Hide prices
              </>
            )}
          </button>
          <button
            type="button"
            className={"sort-toggle" + (sortByBadge ? " is-active" : "")}
            onClick={() => setSortByBadge((v) => !v)}
          >
            {sortByBadge ? "Sorted by badge ✕" : "Sort by badge"}
          </button>
        </div>
      </div>

      {rawGames.length === 0 && (
        <p className="empty-tab">
          No games in this tab yet — add your first one below.
        </p>
      )}
      {rawGames.length > 0 && visibleGames.length === 0 && (
        <p className="empty-tab">No games match the selected filter.</p>
      )}

      <div className="games-grid">
        {visibleGames.map((game) => {
          const badge = getBadge(game.platform);
          const isEditing = game.id === editingId;
          const boughtKey = activeTab + "#" + game.id;
          const isBought = !!bought[boughtKey];
          const isStarred = !!game.star;
          const hasImage =
            typeof game.image === "string" && game.image.length > 0;

          return (
            <div
              key={game.id}
              className={"game-card" + (isStarred ? " is-starred" : "")}
            >
              <div className="card-cover">
                <span
                  className="card-badge"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {game.platform || "—"}
                </span>
                {isStarred && (
                  <span className="card-star-badge" title="Starred game">
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span>Starred</span>
                  </span>
                )}
                {hasImage ? (
                  <>
                    <img
                      className="cover-img"
                      src={game.image}
                      alt={game.name}
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="cover-overlay-btn"
                      onClick={() => removeCoverImage(game.id)}
                    >
                      Remove
                    </button>
                    <label
                      className="cover-replace-label"
                      title="Replace cover"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          handleCoverUpload(game.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <label className="cover-upload-label">
                    <span>+ Add cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        handleCoverUpload(game.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="card-body">
                {!isEditing && (
                  <>
                    <div className="card-title-row">
                      <div className="card-title">{game.name}</div>
                      <div className="card-header-actions">
                        <button
                          type="button"
                          className={
                            "star-btn" + (isStarred ? " is-active" : "")
                          }
                          onClick={() => toggleStar(game.id)}
                          title={isStarred ? "Remove star" : "Star this game"}
                          aria-label={
                            isStarred ? "Remove star" : "Star this game"
                          }
                        >
                          <Star
                            size={18}
                            fill={isStarred ? "#f59e0b" : "transparent"}
                            color={isStarred ? "#f59e0b" : "#9ca3af"}
                          />
                        </button>
                        <input
                          type="checkbox"
                          className="bought-checkbox"
                          checked={isBought}
                          onChange={() => toggleBought(game.id)}
                          aria-label="Mark as bought"
                        />
                      </div>
                    </div>
                    {!hidePrices && (
                      <div className="price-cols">
                        <div>
                          <div className="price-label">New</div>
                          <div className="price-new">
                            {game.priceNew ? `$${game.priceNew}` : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="price-label">Used</div>
                          <div className="price-used">
                            {game.priceUsed ? `$${game.priceUsed}` : "—"}
                          </div>
                        </div>
                      </div>
                    )}
                    {game.note && <div className="card-note">{game.note}</div>}
                    <button
                      type="button"
                      className="edit-link"
                      onClick={() => startEdit(game)}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </>
                )}

                {isEditing && (
                  <form onSubmit={(e) => handleSaveEdit(e, game.id)}>
                    <GameFields
                      draft={editDraft}
                      onChange={(field, value) =>
                        setEditDraft((d) => ({ ...d, [field]: value }))
                      }
                    />
                    <div className="edit-actions">
                      <button type="submit" className="btn btn-primary">
                        <Check size={12} /> Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={cancelEdit}
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        <form className="game-card add-card" onSubmit={handleAddGame}>
          <div className="add-card-title">
            <Plus size={16} /> Add a game
          </div>
          <GameFields
            draft={newGameDraft}
            onChange={(field, value) =>
              setNewGameDraft((d) => ({ ...d, [field]: value }))
            }
          />
          <button type="submit" className="btn btn-primary">
            Add game
          </button>
        </form>
      </div>
    </div>
  );
}
