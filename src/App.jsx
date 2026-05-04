import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";

// ─── FONTS & GLOBAL STYLES ───────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { background: #F7F5F2; font-family: 'Jost', sans-serif; }
    ::-webkit-scrollbar { display: none; }
    * { scrollbar-width: none; }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 70% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
    @keyframes doorOpen { from { transform: perspective(800px) rotateY(-90deg); opacity: 0; } to { transform: perspective(800px) rotateY(0deg); opacity: 1; } }
    @keyframes cabinetReveal { from { opacity: 0; transform: scaleY(0.95); } to { opacity: 1; transform: scaleY(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }

    .fade-up { animation: fadeUp 0.45s ease forwards; }
    .pop-in { animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .door-open { animation: doorOpen 0.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards; transform-origin: left center; }
    .cabinet-reveal { animation: cabinetReveal 0.5s ease forwards; transform-origin: top center; }

    .product-slot:hover .product-label { opacity: 1; transform: translateY(0); }
    .product-slot:active { transform: scale(0.93); }
    .product-slot { transition: transform 0.15s ease; }
    .shelf-item { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .shelf-item:hover { transform: translateY(-3px); }
    .shelf-item:active { transform: scale(0.95); }
    .tab-btn { transition: all 0.25s ease; }
    .tab-btn.active { color: #1A1A1A; }
    .search-result:active { background: #F0EDE8; }
    .add-method-btn:active { transform: scale(0.97); }
    .skeleton {
      background: linear-gradient(90deg, #EDE9E3 25%, #E5E0D8 50%, #EDE9E3 75%);
      background-size: 400px 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
    }
    input:focus { outline: none; }
    textarea:focus { outline: none; }
    button { font-family: 'Jost', sans-serif; cursor: pointer; }

    /* Pill scroll — no visible scrollbar, fade-right peek signals more content */
    .pill-row { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; padding-right: 40px; }
    .pill-row::-webkit-scrollbar { display: none; }
    .pill-scroll-wrap { position: relative; overflow: hidden; }
  `}</style>
);

// ─── DATA ────────────────────────────────────────────────────────────────────

// MOVE 3: Enrich CATEGORIES with emoji + color — single source of truth
const CATEGORIES = [
  { id: "skincare",  label: "Skincare",   icon: "✦", color: "#C8B8A2", emoji: "🧴", cardColor: "#B8D4E8" },
  { id: "makeup",    label: "Makeup",     icon: "◈", color: "#D4A5A5", emoji: "💄", cardColor: "#D4A0A0" },
  { id: "haircare",  label: "Haircare",   icon: "◉", color: "#A5B8C8", emoji: "💇🏽", cardColor: "#C8B8E8" },
  { id: "fragrance", label: "Fragrance",  icon: "◇", color: "#B8A5C8", emoji: "🌸", cardColor: "#E8D4F0" },
  { id: "body",      label: "Body & Bath",icon: "○", color: "#A5C8B8", emoji: "🌺", cardColor: "#FFD4A0" },
  { id: "wellness",  label: "Wellness",   icon: "◎", color: "#C8C4A5", emoji: "💛", cardColor: "#FFF0A0" },
];

const CABINET_THEMES = [
  { id: "wood",        label: "Warm Wood",      emoji: "🪵", shelfBg: "linear-gradient(180deg, #C4956A 0%, #A67C52 60%, #8B6340 100%)", shelfShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,200,140,0.3)", cabinetBg: "linear-gradient(160deg, #2C1810 0%, #3D2314 50%, #2A1508 100%)", cabinetBorder: "#1A0D06", mirrorBg: "linear-gradient(135deg, #F5ECD7 0%, #EDE0C4 40%, #F0E8D0 100%)", edgeBg: "#5C3D1E" },
  { id: "glass",       label: "Glass & Chrome", emoji: "🪟", shelfBg: "linear-gradient(180deg, rgba(200,220,240,0.6) 0%, rgba(180,205,230,0.4) 60%, rgba(160,190,220,0.5) 100%)", shelfShadow: "inset 0 -2px 4px rgba(100,150,200,0.2), 0 1px 0 rgba(255,255,255,0.8)", cabinetBg: "linear-gradient(160deg, #B8C8D8 0%, #C5D5E5 50%, #A8BCCF 100%)", cabinetBorder: "#8AA0B5", mirrorBg: "linear-gradient(135deg, #E8F0F8 0%, #F5F8FC 40%, #EAF2FA 100%)", edgeBg: "#9EB5C8" },
  { id: "maximalist",  label: "Maximalist",     emoji: "🌸", shelfBg: "linear-gradient(180deg, #E8A0BF 0%, #D4709A 60%, #C05080 100%)", shelfShadow: "inset 0 -3px 6px rgba(100,0,50,0.3), inset 0 2px 3px rgba(255,200,220,0.4)", cabinetBg: "linear-gradient(160deg, #2D0A1F 0%, #4A1535 50%, #1F0615 100%)", cabinetBorder: "#7A2050", mirrorBg: "linear-gradient(135deg, #FFE8F5 0%, #FFD0ED 40%, #FFE5F7 100%)", edgeBg: "#8B2060" },
  { id: "mirror",      label: "Mirror Cabinet", emoji: "🪞", shelfBg: "linear-gradient(180deg, rgba(220,230,240,0.7) 0%, rgba(200,215,230,0.5) 60%, rgba(185,205,225,0.65) 100%)", shelfShadow: "inset 0 -2px 4px rgba(80,100,130,0.15), 0 1px 0 rgba(255,255,255,0.9)", cabinetBg: "linear-gradient(160deg, #8090A0 0%, #9AAABB 50%, #788898 100%)", cabinetBorder: "#607080", mirrorBg: "linear-gradient(135deg, #E0E8F0 0%, #EEF4FA 30%, #DDE8F2 60%, #E8F0F8 100%)", edgeBg: "#7090A8" },
];

const MOCK_PRODUCTS = [
  { id: 1,  name: "Laneige Lip Sleeping Mask",             brand: "Laneige",          category: "skincare",  retailer: "Sephora", price: "$24",  emoji: "💊", color: "#FFB3C8" },
  { id: 2,  name: "Tatcha The Water Cream",                brand: "Tatcha",            category: "skincare",  retailer: "Sephora", price: "$68",  emoji: "🧴", color: "#B8D4E8" },
  { id: 3,  name: "Charlotte Tilbury Pillow Talk",         brand: "Charlotte Tilbury", category: "makeup",    retailer: "Sephora", price: "$35",  emoji: "💄", color: "#D4A0A0" },
  { id: 4,  name: "Olaplex No. 3",                         brand: "Olaplex",           category: "haircare",  retailer: "Ulta",    price: "$30",  emoji: "🧪", color: "#C8B8E8" },
  { id: 5,  name: "Sol de Janeiro Brazilian Bum Bum Cream", brand: "Sol de Janeiro",   category: "body",      retailer: "Sephora", price: "$48",  emoji: "🌺", color: "#FFD4A0" },
  { id: 6,  name: "Maison Margiela Replica",               brand: "Maison Margiela",   category: "fragrance", retailer: "Sephora", price: "$165", emoji: "🌸", color: "#E8D4F0" },
  { id: 7,  name: "Glow Recipe Watermelon Toner",          brand: "Glow Recipe",       category: "skincare",  retailer: "Sephora", price: "$39",  emoji: "🍉", color: "#FFB3C0" },
  { id: 8,  name: "Rare Beauty Soft Pinch Blush",          brand: "Rare Beauty",       category: "makeup",    retailer: "Sephora", price: "$23",  emoji: "🌷", color: "#FFB8C8" },
  { id: 9,  name: "Briogeo Scalp Revival Scrub",           brand: "Briogeo",           category: "haircare",  retailer: "Ulta",    price: "$42",  emoji: "🫧", color: "#A8D4C0" },
  { id: 10, name: "Nécessaire Body Serum",                 brand: "Nécessaire",        category: "body",      retailer: "Sephora", price: "$45",  emoji: "✨", color: "#D4E8D0" },
  { id: 11, name: "Le Labo Santal 33",                     brand: "Le Labo",           category: "fragrance", retailer: "Amazon",  price: "$220", emoji: "🕯️", color: "#D8C8B0" },
  { id: 12, name: "Ritual Multivitamin",                   brand: "Ritual",            category: "wellness",  retailer: "Amazon",  price: "$35",  emoji: "💛", color: "#FFF0A0" },
];

const SEARCH_DB = [
  ...MOCK_PRODUCTS,
  { id: 13, name: "The Ordinary Niacinamide",          brand: "The Ordinary", category: "skincare",  retailer: "Ulta",    price: "$6",   emoji: "💧", color: "#C8D8E8" },
  { id: 14, name: "NARS Orgasm Blush",                 brand: "NARS",         category: "makeup",    retailer: "Sephora", price: "$32",  emoji: "🍑", color: "#FFD4C0" },
  { id: 15, name: "Dyson Airwrap",                     brand: "Dyson",        category: "haircare",  retailer: "Amazon",  price: "$599", emoji: "💨", color: "#E0D8F0" },
  { id: 16, name: "Cetaphil Gentle Skin Cleanser",     brand: "Cetaphil",     category: "skincare",  retailer: "Amazon",  price: "$14",  emoji: "🫙", color: "#E8EEF4" },
  { id: 17, name: "Fenty Beauty Pro Filt'r Foundation",brand: "Fenty Beauty", category: "makeup",    retailer: "Sephora", price: "$38",  emoji: "🎨", color: "#DEB887" },
  { id: 18, name: "Moroccanoil Treatment",             brand: "Moroccanoil",  category: "haircare",  retailer: "Ulta",    price: "$46",  emoji: "🥜", color: "#D4B896" },
];

const FEED_POSTS = [
  { id: 1, user: "Sofia Reyes",  handle: "@sofiabeauty", avatar: "SR", avatarColor: "#D4A5A5", product: MOCK_PRODUCTS[0], time: "3m ago",  likes: 42  },
  { id: 2, user: "Jade Williams",handle: "@jadewglow",   avatar: "JW", avatarColor: "#A5C8B8", product: MOCK_PRODUCTS[2], time: "17m ago", likes: 118 },
  { id: 3, user: "Priya Patel",  handle: "@priyaglows",  avatar: "PP", avatarColor: "#B8A5C8", product: MOCK_PRODUCTS[5], time: "1h ago",  likes: 204 },
  { id: 4, user: "Mia Chen",     handle: "@miaskincare", avatar: "MC", avatarColor: "#C8B8A2", product: MOCK_PRODUCTS[6], time: "2h ago",  likes: 88  },
  { id: 5, user: "Ava Johnson",  handle: "@avajbeauty",  avatar: "AJ", avatarColor: "#A5B8C8", product: MOCK_PRODUCTS[3], time: "3h ago",  likes: 55  },
];

const MOCK_USERS = [
  { id: "u1", name: "Sofia Reyes",   handle: "@sofiabeauty", avatar: "SR", avatarColor: "#D4A5A5", bio: "Skincare obsessed · Sephora Rouge · she/her",          followers: 1240, following: 380,  cabinetTheme: CABINET_THEMES[2], products: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1], MOCK_PRODUCTS[6], MOCK_PRODUCTS[7], MOCK_PRODUCTS[9]],          posts: [{ id: "s1", product: MOCK_PRODUCTS[0], time: "3m ago",  likes: 42  }, { id: "s2", product: MOCK_PRODUCTS[6], time: "2d ago", likes: 98 }] },
  { id: "u2", name: "Jade Williams", handle: "@jadewglow",   avatar: "JW", avatarColor: "#A5C8B8", bio: "Clean beauty convert · Haircare nerd",                  followers: 3870, following: 512,  cabinetTheme: CABINET_THEMES[1], products: [MOCK_PRODUCTS[2], MOCK_PRODUCTS[3], MOCK_PRODUCTS[8], MOCK_PRODUCTS[4]],                              posts: [{ id: "j1", product: MOCK_PRODUCTS[2], time: "17m ago", likes: 118 }, { id: "j2", product: MOCK_PRODUCTS[3], time: "5d ago", likes: 74 }] },
  { id: "u3", name: "Priya Patel",   handle: "@priyaglows",  avatar: "PP", avatarColor: "#B8A5C8", bio: "Fragrance collector · Skincare minimalist",              followers: 892,  following: 220,  cabinetTheme: CABINET_THEMES[3], products: [MOCK_PRODUCTS[5], MOCK_PRODUCTS[10], MOCK_PRODUCTS[1], MOCK_PRODUCTS[11]],                           posts: [{ id: "p1", product: MOCK_PRODUCTS[5], time: "1h ago",  likes: 204 }] },
  { id: "u4", name: "Mia Chen",      handle: "@miaskincare", avatar: "MC", avatarColor: "#C8B8A2", bio: "K-beauty enthusiast · 10-step routine advocate",         followers: 5100, following: 890,  cabinetTheme: CABINET_THEMES[0], products: [MOCK_PRODUCTS[6], MOCK_PRODUCTS[0], MOCK_PRODUCTS[1], MOCK_PRODUCTS[7], MOCK_PRODUCTS[9], MOCK_PRODUCTS[11]], posts: [{ id: "m1", product: MOCK_PRODUCTS[6], time: "2h ago",  likes: 88  }, { id: "m2", product: MOCK_PRODUCTS[0], time: "1w ago", likes: 211 }] },
  { id: "u5", name: "Ava Johnson",   handle: "@avajbeauty",  avatar: "AJ", avatarColor: "#A5B8C8", bio: "Makeup artist · Ulta enthusiast",                        followers: 2340, following: 670,  cabinetTheme: CABINET_THEMES[2], products: [MOCK_PRODUCTS[3], MOCK_PRODUCTS[7], MOCK_PRODUCTS[4], MOCK_PRODUCTS[8]],                              posts: [{ id: "a1", product: MOCK_PRODUCTS[3], time: "3h ago",  likes: 55  }] },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// MOVE 3: Single retailer map — replaces retailerColor() + retailerBg()
const RETAILERS = {
  Sephora: { color: "#D4006A", bg: "#FFF0F6" },
  Ulta:    { color: "#F0006E", bg: "#FFF0F8" },
  Amazon:  { color: "#FF9900", bg: "#FFF8EC" },
};
const retailerColor = (r) => RETAILERS[r]?.color || "#888";
const retailerBg    = (r) => RETAILERS[r]?.bg    || "#F5F5F5";

// MOVE 3: Derive emoji/color from CATEGORIES — no more separate functions
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const categoryEmoji = (cat) => CAT_MAP[cat]?.emoji     || "✨";
const categoryColor = (cat) => CAT_MAP[cat]?.cardColor || "#E8E8E8";

// ─── MOVE 1: useProductSearch — shared hook, replaces duplicate search blocks ─
// Encapsulates the Supabase fan-out query used in both AddProductModal and DiscoverTab.
// Returns { results, searching } and reacts to query changes with 300ms debounce.

const BLACK_OWNED_TERMS = ["black owned", "black-owned", "blackowned", "black brand", "black beauty"];
const INDIE_TERMS       = ["indie", "independent", "indie brand"];

function useProductSearch(query) {
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const q = query.toLowerCase().trim();

  useEffect(() => {
    if (q.length < 1) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      const isBlackOwned = BLACK_OWNED_TERMS.some(t => q.includes(t));
      const isIndie      = INDIE_TERMS.some(t => q.includes(t));
      const baseSelect   = "id, name, category, brand_id, brands ( name ), products ( id, name, price_usd )";

      const brandQueries = [
        supabase.from("brands").select("id").ilike("name", `%${q}%`),
        ...(isBlackOwned ? [supabase.from("brands").select("id").eq("black_owned", true)] : []),
        ...(isIndie      ? [supabase.from("brands").select("id").eq("is_indie", true)]   : []),
      ];
      const brandResults = await Promise.all(brandQueries);
      const brandIds = [...new Set(brandResults.flatMap(r => (r.data || []).map(b => b.id)))];

      const queries = [
        supabase.from("product_lines").select(baseSelect)
          .or(brandIds.length > 0
            ? `name.ilike.%${q}%,description.ilike.%${q}%,brand_id.in.(${brandIds.join(",")})`
            : `name.ilike.%${q}%,description.ilike.%${q}%`)
          .limit(12),
        supabase.from("product_lines").select(baseSelect)
          .ilike("search_tags::text", `%${q}%`).limit(12),
        ...((isBlackOwned || isIndie) && brandIds.length > 0
          ? [supabase.from("product_lines").select(baseSelect).in("brand_id", brandIds).limit(20)]
          : []),
      ];

      const raw = await Promise.all(queries);
      const seen = new Set();
      const normalized = [];
      for (const { data } of raw) {
        for (const pl of (data || [])) {
          if (seen.has(pl.id) || !pl.products?.length) continue;
          seen.add(pl.id);
          normalized.push({
            id:       pl.products[0].id,
            name:     pl.name,
            brand:    pl.brands?.name || "",
            category: pl.category,
            price:    pl.products[0].price_usd ? `$${pl.products[0].price_usd}` : "",
            emoji:    categoryEmoji(pl.category),
            color:    categoryColor(pl.category),
          });
          if (normalized.length >= 20) break;
        }
      }
      setResults(normalized);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return { results, searching };
}

// ─── MOVE 2: BottomSheet — shared wrapper for all slide-up modals ─────────────
// Replaces the identical backdrop + slideUp + drag handle markup in
// ProductDetailModal, AddProductModal, and ThemePicker.

function BottomSheet({ onClose, children, maxHeight = "88vh", padding = "20px 20px 40px" }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,20,15,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#FDFAF7", borderRadius: "24px 24px 0 0", animation: "slideUp 0.38s cubic-bezier(0.25,0.46,0.45,0.94)", maxHeight, overflowY: "auto", position: "relative" }}>
        {/* Sticky header: decorative pill + × button */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(253,250,247,0.97)", backdropFilter: "blur(12px)", padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "0.5px solid rgba(237,233,227,0.8)" }}>
          <div style={{ width: 36, height: 4, background: "#E0DAD2", borderRadius: 2 }} />
          <button onClick={onClose} aria-label="Close" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 30, height: 30, borderRadius: "50%", background: "#F0EDE8", border: "none", fontSize: 14, color: "#888", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── SIGNAL DATA ──────────────────────────────────────────────────────────────

const MOCK_FRIEND_SIGNALS = {
  1: [{ initials: "SR", color: "#D4A5A5" }, { initials: "MC", color: "#C8B8A2" }],
  3: [{ initials: "JW", color: "#A5C8B8" }],
  5: [{ initials: "AJ", color: "#A5B8C8" }],
  6: [{ initials: "PP", color: "#B8A5C8" }],
  7: [{ initials: "MC", color: "#C8B8A2" }, { initials: "SR", color: "#D4A5A5" }],
};
const MOCK_REPURCHASE_RATES = { 2: 87, 4: 91, 8: 79, 9: 82, 10: 84, 11: 76, 12: 68 };

const friendAvatarsFor  = (id) => MOCK_FRIEND_SIGNALS[id] || [];
const repurchaseRateFor = (id) => MOCK_REPURCHASE_RATES[id] ?? null;

// ─── COMPACT PRODUCT CARD ────────────────────────────────────────────────────

function CompactCard({ product, onClick, isOwn, repurchaseStatus }) {
  return (
    <div onClick={() => onClick(product)} style={{ background: "#FFF", borderRadius: 12, overflow: "hidden", border: "1px solid #EDE9E3", cursor: "pointer" }} className="shelf-item">
      <div style={{ width: "100%", aspectRatio: "0.85", background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "12%", width: "28%", height: "55%", background: "linear-gradient(180deg,rgba(255,255,255,0.45),transparent)", borderRadius: "50%", transform: "skewX(-10deg)", pointerEvents: "none" }} />
        <span style={{ fontSize: 28, position: "relative", zIndex: 1 }}>{product.emoji}</span>
        {repurchaseStatus === "repurchase" && (
          <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "rgba(74,124,89,0.18)", border: "1px solid rgba(74,124,89,0.3)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#4A7C59" }}>↻</div>
        )}
        {repurchaseStatus === "not_repurchase" && (
          <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "rgba(160,140,128,0.15)", border: "1px solid rgba(160,140,128,0.25)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#A08C80" }}>✕</div>
        )}
        {isOwn && (!repurchaseStatus || repurchaseStatus === "using") && (
          <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: "rgba(160,140,128,0.06)", border: "1px dashed rgba(160,140,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#C8C0B8", opacity: 0.5 }}>?</div>
        )}
      </div>
      <div style={{ padding: "6px 8px 8px" }}>
        <div style={{ fontSize: 8.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#BBB", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.brand}</div>
        <div style={{ fontSize: 11, color: "#1A1A1A", lineHeight: 1.3, marginTop: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</div>
      </div>
    </div>
  );
}

// ─── CABINET GRID ────────────────────────────────────────────────────────────

function CabinetGrid({ products, onProductClick, isOwn = true, activeFilter = "all" }) {
  const activeProducts   = products.filter(p => p.status !== "not_repurchase");
  const archivedProducts = products.filter(p => p.status === "not_repurchase");
  const [showArchive, setShowArchive] = useState(false);

  const filteredActive   = activeFilter === "all" ? activeProducts   : activeProducts.filter(p => p.category === activeFilter);
  const filteredArchived = activeFilter === "all" ? archivedProducts : archivedProducts.filter(p => p.category === activeFilter);

  return (
    <div style={{ padding: "0 16px" }}>
      {filteredActive.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#BBB" }}>{activeFilter !== "all" ? "Nothing in this category yet" : "Your cabinet is empty"}</div>
          <div style={{ fontSize: 12, color: "#CCC", marginTop: 4 }}>Tap + to add your first product</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {filteredActive.map((product, i) => (
            <div key={product.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
              <CompactCard product={product} onClick={onProductClick} isOwn={isOwn} repurchaseStatus={product.status} />
            </div>
          ))}
        </div>
      )}

      {filteredArchived.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div onClick={() => setShowArchive(!showArchive)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: showArchive ? 12 : 0 }}>
            <div style={{ flex: 1, height: 0.5, background: "#E8E2D9" }} />
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C8C0B8", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              Tried & moved on
              <span style={{ fontSize: 9, background: "#FFF", border: "1px solid #EDE9E3", borderRadius: 10, padding: "1px 6px" }}>{filteredArchived.length}</span>
              <span style={{ fontSize: 8, transition: "transform 0.2s", display: "inline-block", transform: showArchive ? "rotate(180deg)" : "none" }}>▼</span>
            </div>
            <div style={{ flex: 1, height: 0.5, background: "#E8E2D9" }} />
          </div>
          {showArchive && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, opacity: 0.65, filter: "saturate(0.4)" }}>
              {filteredArchived.map((product, i) => (
                <div key={product.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                  <CompactCard product={product} onClick={onProductClick} isOwn={isOwn} repurchaseStatus={product.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT DETAIL MODAL ────────────────────────────────────────────────────

function ProductDetailModal({ product, onClose, onRemove, onRepurchaseChange, isOwn, onAdd }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving]           = useState(false);
  const [note, setNote]                   = useState("");
  const [editingNote, setEditingNote]     = useState(false);

  if (!product) return null;

  const isArchived   = product.status === "not_repurchase";
  const isRepurchase = product.status === "repurchase";
  const repurchaseRate = repurchaseRateFor(product.id);
  const friends        = friendAvatarsFor(product.id);
  const categoryLabel  = CATEGORIES.find(c => c.id === product.category)?.label || product.category;

  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove?.(product), 250); };
  const handleRepurchase = (status) => {
    onRepurchaseChange?.(product, status);
    if (status === "not_repurchase") setTimeout(onClose, 400);
  };

  return (
    <BottomSheet onClose={onClose} maxHeight="88vh">
      {confirmRemove ? (
        <div style={{ animation: "fadeUp 0.25s ease" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FFF0EB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 7V20C6 20.6 6.4 21 7 21H17C17.6 21 18 20.6 18 20V7" stroke="#D47070" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M4 7H20" stroke="#D47070" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="#D47070" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Remove this product?</div>
            <div style={{ fontSize: 13, color: "#AAA", lineHeight: 1.6 }}>{product.name} will be removed entirely.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setConfirmRemove(false)} style={{ flex: 1, padding: "14px", background: "#F0EDE8", color: "#555", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500 }}>Keep it</button>
            <button onClick={handleRemove} disabled={removing} style={{ flex: 1, padding: "14px", background: removing ? "#E0A0A0" : "#D47070", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500 }}>{removing ? "Removing…" : "Remove"}</button>
          </div>
        </div>
      ) : (
        <>
          {isOwn && isArchived && (
            <div style={{ background: "rgba(160,140,128,0.08)", border: "0.5px solid rgba(160,140,128,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#A89E94" }}>In Tried & Moved On</span>
              <button onClick={() => handleRepurchase("using")} style={{ fontSize: 11, color: "#8B6F47", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Move back</button>
            </div>
          )}

          <div style={{ width: "100%", aspectRatio: "1.4", borderRadius: 18, marginBottom: 16, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", filter: isArchived ? "saturate(0.4)" : "none" }}>
            <div style={{ position: "absolute", top: 0, left: "10%", width: "25%", height: "50%", background: "linear-gradient(180deg,rgba(255,255,255,0.4),transparent)", borderRadius: "50%", transform: "skewX(-10deg)" }} />
            <span style={{ fontSize: 64, position: "relative", zIndex: 1 }}>{product.emoji}</span>
          </div>

          <div style={{ marginBottom: 14, borderBottom: "0.5px solid #F0EDE8", paddingBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BBB", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{product.brand}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: isArchived ? "#888" : "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: "#AAA" }}>{categoryLabel}{product.price ? ` · ${product.price}` : ""}</div>
          </div>

          {isOwn && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => handleRepurchase(isRepurchase ? "using" : "repurchase")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${isRepurchase ? "#4A7C59" : "rgba(74,124,89,0.25)"}`, background: isRepurchase ? "rgba(74,124,89,0.12)" : "rgba(74,124,89,0.05)", color: "#4A7C59", fontSize: 12, fontWeight: isRepurchase ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s" }}>↻ Would buy again</button>
              <button onClick={() => handleRepurchase(isArchived ? "using" : "not_repurchase")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${isArchived ? "rgba(160,140,128,0.4)" : "rgba(160,140,128,0.2)"}`, background: isArchived ? "rgba(160,140,128,0.12)" : "rgba(160,140,128,0.05)", color: "#A89E94", fontSize: 12, fontWeight: isArchived ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s" }}>✕ Pass</button>
            </div>
          )}

          {!isOwn && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: repurchaseRate !== null ? "rgba(74,124,89,0.1)" : "rgba(160,140,128,0.08)", border: `1px solid ${repurchaseRate !== null ? "rgba(74,124,89,0.2)" : "rgba(160,140,128,0.2)"}`, borderRadius: 20, padding: "7px 14px", marginBottom: 14 }}>
              {repurchaseRate !== null
                ? <><span style={{ color: "#4A7C59", fontSize: 13 }}>↻</span><span style={{ fontSize: 12, color: "#4A7C59" }}>{repurchaseRate}% would buy again</span></>
                : <span style={{ fontSize: 12, color: "#A89E94" }}>In their cabinet</span>}
            </div>
          )}

          {isOwn && (
            <div style={{ display: "flex", borderTop: "0.5px solid #F0EDE8", borderBottom: "0.5px solid #F0EDE8", marginBottom: 14 }}>
              {[
                { val: isArchived ? "—" : "New", label: isArchived ? "tried for" : "on shelf" },
                { val: "1st", label: "bottle" },
                { val: categoryLabel, label: "category" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0", borderRight: i < 2 ? "0.5px solid #F0EDE8" : "none" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{s.val}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: "#BBB" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {!isOwn && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[categoryLabel, product.price].filter(Boolean).map(t => (
                <div key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 16, background: "#F5F0EA", border: "1px solid #EDE9E3" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#888" }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {isOwn && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BBB", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Your note</div>
              {editingNote ? (
                <div style={{ background: "#FFF", border: "1px solid #EDE9E3", borderRadius: 12, overflow: "hidden" }}>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What do you love about this?" autoFocus rows={3} style={{ width: "100%", background: "none", border: "none", outline: "none", fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#1A1A1A", lineHeight: 1.65, padding: "12px 14px", resize: "none" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px", borderTop: "0.5px solid #F0EDE8" }}>
                    <button onClick={() => setEditingNote(false)} style={{ fontSize: 11, color: "#AAA", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => setEditingNote(false)} style={{ fontSize: 11, color: "#FFF", background: "#1A1A1A", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>Save</button>
                  </div>
                </div>
              ) : note ? (
                <div style={{ background: "#FFF", border: "0.5px solid #EDE9E3", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.65, fontStyle: "italic" }}>"{note}"</div>
                  <button onClick={() => setEditingNote(true)} style={{ fontSize: 10, color: "#BBB", background: "none", border: "none", cursor: "pointer", marginTop: 6, fontFamily: "'DM Mono', monospace" }}>✎ Edit note</button>
                </div>
              ) : (
                <div onClick={() => setEditingNote(true)} style={{ border: "1px dashed #E8E2D9", borderRadius: 12, padding: "14px", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 12, color: "#C8C0B8", fontStyle: "italic" }}>What do you love about this?</div>
                  <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>✎ Add a note</div>
                </div>
              )}
            </div>
          )}

          {!isOwn && friends.length > 0 && (
            <div style={{ borderTop: "0.5px solid #F0EDE8", paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BBB", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Friends who have this</div>
              {friends.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#FFF", fontFamily: "'DM Mono', monospace" }}>{f.initials}</div>
                  <span style={{ fontSize: 12, color: "#555" }}>{f.initials}</span>
                  <span style={{ fontSize: 10, color: "#4A7C59" }}>↻</span>
                </div>
              ))}
            </div>
          )}

          {!isOwn
            ? <button onClick={() => { onAdd?.(product); onClose(); }} style={{ width: "100%", padding: "14px", background: "#1A1A1A", color: "#FFF", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500 }}>+ Add to my cabinet</button>
            : <button onClick={() => setConfirmRemove(true)} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "#D47070", fontSize: 13, cursor: "pointer" }}>Remove from cabinet</button>
          }
        </>
      )}
    </BottomSheet>
  );
}

// ─── ADD PRODUCT MODAL ───────────────────────────────────────────────────────

function AddProductModal({ onClose, onAdd }) {
  const [mode, setMode]                   = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [browseProducts, setBrowseProducts] = useState([]);
  const [adding, setAdding]               = useState(false);

  // MOVE 1: Use shared hook instead of duplicated search logic
  const { results, searching } = useProductSearch(searchQuery);

  // Category browse (Supabase — unchanged)
  useEffect(() => {
    if (!selectedCategory) { setBrowseProducts([]); return; }
    supabase.from("product_lines")
      .select("id, name, category, brands ( name ), products ( id, name, price_usd )")
      .eq("category", selectedCategory).limit(20)
      .then(({ data }) => {
        setBrowseProducts((data || []).filter(pl => pl.products?.length > 0).map(pl => ({
          id: pl.products[0].id, name: pl.name, brand: pl.brands?.name || "",
          category: pl.category, price: pl.products[0].price_usd ? `$${pl.products[0].price_usd}` : "",
          emoji: categoryEmoji(pl.category), color: categoryColor(pl.category),
        })));
      });
  }, [selectedCategory]);

  const handleAdd = (product) => { setAdding(true); setTimeout(() => { onAdd(product); onClose(); }, 600); };
  const goBack = () => { setMode(null); setSearchQuery(""); setSelectedCategory(null); };

  const ADD_METHODS = [
    { id: "search",  icon: "🔍", label: "Search by Name",    sub: "Sephora, Ulta, Amazon" },
    { id: "email",   icon: "📧", label: "Scan Email",         sub: "Find past orders" },
    { id: "barcode", icon: "📷", label: "Scan Barcode",       sub: "Point at a product" },
    { id: "browse",  icon: "✦",  label: "Browse Category",    sub: "Explore by type" },
  ];

  const SearchRow = ({ product }) => (
    <div className="search-result" onClick={() => handleAdd(product)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", borderRadius: 12, marginBottom: 6, cursor: "pointer", transition: "background 0.15s", border: "1.5px solid #EDE9E3" }}>
      <div style={{ width: 48, height: 66, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{product.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", marginBottom: 2 }}>{product.name}</div>
        <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{product.brand} · {product.price}</div>
      </div>
      {product.retailer && <span style={{ background: retailerBg(product.retailer), color: retailerColor(product.retailer), fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{product.retailer}</span>}
    </div>
  );

  return (
    <BottomSheet onClose={onClose} maxHeight="85vh" padding="24px 20px 48px">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          {mode && <button onClick={goBack} style={{ background: "none", border: "none", color: "#AAA", fontSize: 13, padding: 0, marginBottom: 2 }}>← back</button>}
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>
            {!mode ? "Add to Cabinet" : mode === "search" ? "Search Products" : mode === "email" ? "Scan Email Receipts" : mode === "barcode" ? "Scan Barcode" : "Browse by Category"}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, color: "#888" }}>✕</button>
      </div>

      {!mode && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {ADD_METHODS.map(m => (
            <button key={m.id} className="add-method-btn" onClick={() => setMode(m.id)} style={{ background: "#F7F4F0", border: "1.5px solid #EDE9E3", borderRadius: 16, padding: "18px 14px", textAlign: "left", display: "flex", flexDirection: "column", gap: 8, transition: "all 0.2s" }}>
              <span style={{ fontSize: 28 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === "search" && (
        <div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Laneige, Charlotte Tilbury…" style={{ width: "100%", padding: "14px 16px 14px 44px", background: "#F0EDE8", border: "1.5px solid #E5E0D8", borderRadius: 12, fontSize: 15, color: "#1A1A1A", fontFamily: "'Jost', sans-serif" }} />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["Sephora", "Ulta", "Amazon"].map(r => (
              <span key={r} style={{ background: retailerBg(r), color: retailerColor(r), fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{r}</span>
            ))}
          </div>
          {results.length === 0 && searchQuery.length > 1 && !searching && <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 14 }}>No products found</div>}
          {results.map(p => <SearchRow key={p.id} product={p} />)}
        </div>
      )}

      {mode === "email" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#1A1A1A", marginBottom: 8 }}>Connect Your Email</div>
          <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, marginBottom: 28 }}>We'll scan for Sephora, Ulta, and Amazon beauty order confirmations and import them automatically.</div>
          {["Google", "Apple Mail", "Outlook"].map(provider => (
            <button key={provider} style={{ width: "100%", padding: "14px", marginBottom: 10, background: "#F0EDE8", border: "1.5px solid #E5E0D8", borderRadius: 12, fontSize: 15, color: "#1A1A1A", fontWeight: 500, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{provider === "Google" ? "🔵" : provider === "Apple Mail" ? "🍎" : "📘"}</span>
              Connect {provider}
            </button>
          ))}
        </div>
      )}

      {mode === "barcode" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: "100%", aspectRatio: "4/3", background: "#1A1A1A", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: 2, background: "rgba(255,200,100,0.8)", boxShadow: "0 0 12px rgba(255,200,100,0.6)" }} />
            <div style={{ position: "absolute", top: "20%", left: "15%", right: "15%", bottom: "20%", border: "2px solid rgba(255,200,100,0.5)", borderRadius: 8 }} />
            <div style={{ fontSize: 40, position: "relative", zIndex: 1 }}>📷</div>
            <div style={{ color: "#FFF", fontSize: 13, marginTop: 8, opacity: 0.7 }}>Camera access required</div>
          </div>
          <button style={{ width: "100%", padding: "14px", background: "#1A1A1A", border: "none", borderRadius: 12, color: "#FFF", fontSize: 15, fontWeight: 500 }}>Enable Camera</button>
        </div>
      )}

      {mode === "browse" && (
        <div>
          {!selectedCategory ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ background: "#F7F4F0", border: "1.5px solid #EDE9E3", borderRadius: 14, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 40, height: 40, background: cat.color + "44", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#555" }}>{cat.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#555", textAlign: "center" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedCategory(null)} style={{ background: "none", border: "none", color: "#AAA", fontSize: 13, marginBottom: 14, padding: 0 }}>← All Categories</button>
              {browseProducts.map(p => <SearchRow key={p.id} product={p} />)}
            </div>
          )}
        </div>
      )}

      {adding && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(253,250,247,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "24px 24px 0 0" }}>
          <div style={{ fontSize: 56, animation: "popIn 0.4s ease" }}>✨</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#1A1A1A", marginTop: 12 }}>Added to your cabinet!</div>
        </div>
      )}
    </BottomSheet>
  );
}

// ─── THEME PICKER ─────────────────────────────────────────────────────────────

function ThemePicker({ current, onSelect, onClose }) {
  return (
    <BottomSheet onClose={onClose} maxHeight="80vh" padding="24px 20px 48px">
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A", marginBottom: 20 }}>Cabinet Style</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {CABINET_THEMES.map(theme => (
          <button key={theme.id} onClick={() => { onSelect(theme); onClose(); }} style={{ background: theme.cabinetBg, border: current.id === theme.id ? "3px solid #1A1A1A" : "2px solid transparent", borderRadius: 16, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}>
            {current.id === theme.id && <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, background: "#1A1A1A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#FFF" }}>✓</div>}
            <div style={{ height: 32, background: theme.mirrorBg, borderRadius: 6, display: "flex", alignItems: "flex-end", padding: "4px 8px", gap: 6 }}>
              {["💊","💄","🧴"].map((e,i) => <div key={i} style={{ width: 16, height: 22, background: ["#FFB3C8","#D4A0A0","#B8D4E8"][i], borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{e}</div>)}
            </div>
            <div style={{ height: 6, background: theme.shelfBg, borderRadius: 2 }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", textAlign: "left" }}>{theme.label}</div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

// ─── FEED POST CARD ──────────────────────────────────────────────────────────

function FeedPostCard({ post, index }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="fade-up" style={{ background: "#FFF", borderRadius: 20, border: "1.5px solid #EDE9E3", padding: "18px", marginBottom: 12, animationDelay: `${index * 0.07}s`, opacity: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: post.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>{post.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{post.user}</div>
          <div style={{ fontSize: 11, color: "#BBB", fontFamily: "'DM Mono', monospace" }}>{post.handle} · {post.time}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontStyle: "italic" }}>added to their cabinet</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#F7F4F0", borderRadius: 14, padding: "14px", marginBottom: 14 }}>
        <div style={{ width: 54, height: 76, background: `linear-gradient(145deg, ${post.product.color}FF, ${post.product.color}88)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: `0 4px 12px ${post.product.color}44` }}>{post.product.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>{post.product.name}</div>
          <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{post.product.brand}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ background: retailerBg(post.product.retailer), color: retailerColor(post.product.retailer), fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{post.product.retailer}</span>
            <span style={{ background: "#F0EDE8", color: "#888", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{post.product.price}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button onClick={() => setLiked(l => !l)} style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 5, color: liked ? "#D4006A" : "#CCC", fontSize: 14, fontWeight: 500, transition: "all 0.2s" }}>
          <span style={{ fontSize: 18, transform: liked ? "scale(1.2)" : "scale(1)", transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)", display: "block" }}>{liked ? "♥" : "♡"}</span>
          {post.likes + (liked ? 1 : 0)}
        </button>
        <button style={{ background: "none", border: "none", padding: 0, color: "#CCC", fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 16 }}>💬</span> Comment</button>
        <button style={{ background: "none", border: "none", padding: 0, color: "#CCC", fontSize: 14, marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 16 }}>↗</span> Share</button>
      </div>
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
// Renders a real image if avatarUrl exists, otherwise initials fallback.

function Avatar({ avatarUrl, initials, size = 60 }) {
  const [imgError, setImgError] = useState(false);
  const showImg = avatarUrl && !imgError;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg, #D4A5A5, #A5B8C8)", border: "2px solid #E8D5BC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {showImg
        ? <img src={avatarUrl} alt="Profile" onError={() => setImgError(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: size * 0.33, fontWeight: 700, color: "#FFF" }}>{initials}</span>
      }
    </div>
  );
}

// ─── PILL SCROLL ROW ─────────────────────────────────────────────────────────
// Hides the scrollbar; right-edge fade signals there's more to scroll.
// fadeColor must match the exact background behind the row.

function PillScrollRow({ children, fadeColor = "#FDFAF7" }) {
  return (
    <div className="pill-scroll-wrap">
      <div className="pill-row">{children}</div>
      <div style={{ position: "absolute", top: 0, right: 0, width: 44, height: "100%", background: `linear-gradient(to right, transparent, ${fadeColor})`, pointerEvents: "none" }} />
    </div>
  );
}

// ─── BEAUTY DNA PILLS ────────────────────────────────────────────────────────

const DNA_PILL_STYLES = {
  skinType:     { bg: "#FBF6F0", border: "#E8D5BC", color: "#8B6F47" },
  hairType:     { bg: "#F2F8F4", border: "#C0DBC8", color: "#4A7C59" },
  skinConcern:  { bg: "#FDF2F0", border: "#F5C6C0", color: "#C0392B" },
};

function BeautyDNA({ skinType, skinConcerns = [], hairType }) {
  const hasDNA = skinType || hairType || skinConcerns.length > 0;
  if (!hasDNA) return null;
  const s = DNA_PILL_STYLES;
  return (
    <div style={{ background: "#F5F1EC", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#AAA", marginBottom: 7 }}>Beauty DNA</div>
      <PillScrollRow fadeColor="#F5F1EC">
        {skinType && <span style={{ ...dnaPill(s.skinType) }}>✦ {skinType}</span>}
        {hairType && <span style={{ ...dnaPill(s.hairType) }}>◉ {hairType}</span>}
        {skinConcerns.map((c, i) => <span key={i} style={{ ...dnaPill(s.skinConcern) }}>◈ {c}</span>)}
      </PillScrollRow>
    </div>
  );
}

function dnaPill({ bg, border, color }) {
  return { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em", whiteSpace: "nowrap", flexShrink: 0, background: bg, border: `1px solid ${border}`, color };
}

// ─── EDIT PROFILE MODAL ──────────────────────────────────────────────────────
// Handles: avatar upload → Supabase Storage, then writes public URL to profiles.
// Bio capped at 120 chars. Skin concerns multi-select (max 3). All saves via upsert.

const SKIN_TYPES   = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const HAIR_TYPES   = ["Fine / Straight", "Wavy", "Curly (3a–3c)", "Coily (4a–4c)", "Color-treated", "Natural / Protective styles"];
const SKIN_CONCERN_OPTIONS = ["Acne", "Dryness", "Hyperpigmentation", "Fine lines", "Redness", "Sensitivity", "Uneven texture", "Pores"];

function EditProfileModal({ user, onClose, onUpdate }) {
  const [displayName,   setDisplayName]   = useState(user?.name?.includes("@") ? user.name.split("@")[0] : user?.name || "");
  const [username,      setUsername]      = useState((user?.handle || "").replace("@", ""));
  const [cabinetName,   setCabinetName]   = useState(user?.cabinetName || "");
  const [bio,           setBio]           = useState(user?.bio || "");
  const [skinType,      setSkinType]      = useState(user?.skinType || "");
  const [hairType,      setHairType]      = useState(user?.hairType || "");
  const [skinConcerns,  setSkinConcerns]  = useState(user?.skinConcerns || []);
  const [avatarUrl,     setAvatarUrl]     = useState(user?.avatarUrl || null);
  const [uploading,     setUploading]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const fileRef = useRef(null);

  const BIO_MAX = 120;

  const toggleConcern = (concern) => {
    setSkinConcerns(prev =>
      prev.includes(concern) ? prev.filter(c => c !== concern)
      : prev.length < 3 ? [...prev, concern] : prev
    );
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 2 * 1024 * 1024) { setErrors(p => ({ ...p, avatar: "Max 2MB" })); return; }
    setUploading(true);
    setErrors(p => ({ ...p, avatar: null }));
    // Upload to Supabase Storage bucket "avatars", named by user UUID (overwrites on update)
    const { error: uploadError } = await supabase.storage.from("avatars").upload(user.id, file, { upsert: true, contentType: file.type });
    if (uploadError) { setErrors(p => ({ ...p, avatar: "Upload failed — try again" })); setUploading(false); return; }
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(user.id);
    // Bust cache by appending a timestamp so the browser reloads the new image
    setAvatarUrl(publicUrl + "?t=" + Date.now());
    setUploading(false);
  };

  const save = async () => {
    const e = {};
    if (!displayName.trim()) e.displayName = "Name is required";
    if (!username.trim()) e.username = "Handle is required";
    else if (!/^[a-z0-9_]+$/.test(username)) e.username = "Lowercase, numbers, underscores only";
    if (bio.length > BIO_MAX) e.bio = `${bio.length - BIO_MAX} chars over limit`;
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const finalCabinetName = cabinetName.trim() || `${displayName.trim().split(" ")[0]}'s Cabinet`;
    if (user?.id) {
      const { error } = await supabase.from("profiles").update({
        display_name:  displayName.trim(),
        username:      username.trim(),
        bio:           bio.trim() || null,
        cabinet_name:  finalCabinetName,
        skin_type:     skinType || null,
        skin_concerns: skinConcerns,
        hair_type:     hairType || null,
        avatar_url:    avatarUrl,
      }).eq("id", user.id);

      if (error) {
        console.warn("[EditProfile] save error:", error.message);
        setErrors({ displayName: "Save failed — " + error.message });
        setSaving(false);
        return;
      }

      // Re-read from DB to confirm write succeeded and surface the true stored values
      const { data: fresh } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url, bio, skin_type, skin_concerns, hair_type, cabinet_name, role")
        .eq("id", user.id)
        .maybeSingle();

      setSaving(false);
      onUpdate({
        ...user,
        name:         fresh?.display_name  || displayName.trim(),
        handle:       fresh?.username      ? "@" + fresh.username : "@" + username.trim(),
        cabinetName:  fresh?.cabinet_name  || finalCabinetName,
        bio:          fresh?.bio           || null,
        skinType:     fresh?.skin_type     || null,
        skinConcerns: fresh?.skin_concerns || [],
        hairType:     fresh?.hair_type     || null,
        avatarUrl:    fresh?.avatar_url    || avatarUrl,
      });
    } else {
      setSaving(false);
    }
    onClose();
  };

  const initials = displayName.split(/[\s._-]/).map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "ME";
  const fieldLabel = (text) => <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#AAA", marginBottom: 6 }}>{text}</div>;
  const fieldInput = (props) => <input {...props} style={{ width: "100%", padding: "11px 13px", background: "#FFF", border: `1.5px solid ${errors[props.name] ? "#E07070" : "#E5E0D8"}`, borderRadius: 10, fontSize: 13, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", boxSizing: "border-box", ...(props.style || {}) }} onFocus={e => e.target.style.borderColor = "#C8B8A2"} onBlur={e => e.target.style.borderColor = errors[props.name] ? "#E07070" : "#E5E0D8"} />;
  const errMsg = (key) => errors[key] ? <div style={{ fontSize: 11, color: "#E07070", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{errors[key]}</div> : null;

  return (
    <BottomSheet onClose={onClose} maxHeight="92vh" padding="16px 20px 48px">
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: "0.5px solid #EDE9E3" }}>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
          <Avatar avatarUrl={avatarUrl} initials={initials} size={64} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, background: uploading ? "#AAA" : "#1A1A1A", borderRadius: "50%", border: "2px solid #FDFAF7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#FFF" }}>
            {uploading ? <span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : "✎"}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleAvatarPick} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A", marginBottom: 3 }}>Profile photo</div>
          <div style={{ fontSize: 11, color: "#AAA", lineHeight: 1.5 }}>JPG, PNG or WebP · Max 2MB</div>
          {errMsg("avatar")}
        </div>
      </div>

      {/* Name + Handle + Cabinet name */}
      <div style={{ marginBottom: 14 }}>{fieldLabel("Full name")}{fieldInput({ name: "displayName", value: displayName, onChange: e => setDisplayName(e.target.value), placeholder: "Your name" })}{errMsg("displayName")}</div>
      <div style={{ marginBottom: 14 }}>
        {fieldLabel("Handle")}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#C8B8A2", fontWeight: 600, fontSize: 14 }}>@</span>
          {fieldInput({ name: "username", value: username, onChange: e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")), placeholder: "yourhandle", style: { paddingLeft: 28 } })}
        </div>
        {errMsg("username")}
      </div>
      <div style={{ marginBottom: 14 }}>{fieldLabel("Cabinet name")}{fieldInput({ name: "cabinetName", value: cabinetName, onChange: e => setCabinetName(e.target.value), placeholder: `${displayName.split(" ")[0] || "My"}'s Cabinet`, maxLength: 40, style: { fontFamily: "'Cormorant Garamond', serif", fontSize: 15 } })}</div>

      {/* Bio */}
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "0.5px solid #EDE9E3" }}>
        {fieldLabel(`Bio · ${bio.length} / ${BIO_MAX}`)}
        <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, BIO_MAX))} placeholder="Skincare minimalist. Fragrance maximalist…" rows={3} style={{ width: "100%", padding: "11px 13px", background: "#FFF", border: `1.5px solid ${errors.bio ? "#E07070" : "#E5E0D8"}`, borderRadius: 10, fontSize: 13, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", lineHeight: 1.6, resize: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#C8B8A2"} onBlur={e => e.target.style.borderColor = "#E5E0D8"} />
        {errMsg("bio")}
      </div>

      {/* Beauty DNA */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 14 }}>Beauty DNA</div>
        <div style={{ marginBottom: 12 }}>
          {fieldLabel("Skin type")}
          <select value={skinType} onChange={e => setSkinType(e.target.value)} style={{ width: "100%", padding: "11px 13px", background: "#FFF", border: "1.5px solid #E5E0D8", borderRadius: 10, fontSize: 13, color: skinType ? "#1A1A1A" : "#AAA", fontFamily: "'Jost', sans-serif", appearance: "none" }}>
            <option value="">Select skin type…</option>
            {SKIN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          {fieldLabel("Skin concerns · pick up to 3")}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SKIN_CONCERN_OPTIONS.map(c => {
              const active = skinConcerns.includes(c);
              return <button key={c} onClick={() => toggleConcern(c)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 10, fontFamily: "'DM Mono', monospace", border: "1.5px solid", background: active ? "#1A1A1A" : "transparent", color: active ? "#FFF" : "#888", borderColor: active ? "#1A1A1A" : "#E5E0D8", cursor: "pointer", transition: "all 0.15s" }}>{c}</button>;
            })}
          </div>
        </div>
        <div>
          {fieldLabel("Hair type")}
          <select value={hairType} onChange={e => setHairType(e.target.value)} style={{ width: "100%", padding: "11px 13px", background: "#FFF", border: "1.5px solid #E5E0D8", borderRadius: 10, fontSize: 13, color: hairType ? "#1A1A1A" : "#AAA", fontFamily: "'Jost', sans-serif", appearance: "none" }}>
            <option value="">Select hair type…</option>
            {HAIR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ width: "100%", padding: "14px", background: saving ? "#C8BFB5" : "#1A1A1A", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, color: "#FFF", cursor: saving ? "default" : "pointer", fontFamily: "'Jost', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {saving ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : "Save changes"}
      </button>
    </BottomSheet>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab({ user, products, theme, onThemeChange, onAddProduct, onRemoveProduct, onRepurchaseChange, onSignOut, onUpdateUser, loading }) {
  const [showThemePicker,  setShowThemePicker]  = useState(false);
  const [showEditProfile,  setShowEditProfile]  = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [showSettings,     setShowSettings]     = useState(false);
  const [signingOut,       setSigningOut]       = useState(false);
  const [activeFilter,     setActiveFilter]     = useState("all");
  const [toast,            setToast]            = useState(null);
  const undoRef = useRef(null);

  // Clean identity — never render a raw email as a display name
  const rawName     = user?.name || "";
  const displayName = rawName.includes("@") ? rawName.split("@")[0] : rawName || "User";
  const handle      = user?.handle || "@user";
  const cabinetName = user?.cabinetName || `${displayName.split(" ")[0]}'s Cabinet`;
  const initials    = displayName.split(/[\s._-]/).map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "ME";
  const isBeta      = user?.role === "beta" || user?.role === "admin";
  const activeProducts = products.filter(p => p.status !== "not_repurchase");

  const handleSignOut = async () => { setSigningOut(true); await supabase.auth.signOut(); onSignOut(); };

  const handleRemove = (product) => {
    onRemoveProduct(product, false);
    setSelectedProduct(null);
    setToast({ product, visible: true });
    if (undoRef.current) clearTimeout(undoRef.current);
    undoRef.current = setTimeout(() => { onRemoveProduct(product, true); setToast(null); }, 5000);
  };

  const handleRepurchase = (product, status) => {
    setSelectedProduct(prev => prev?.id === product.id ? { ...prev, status } : prev);
    onRepurchaseChange(product, status);
    if (status === "not_repurchase") setTimeout(() => setSelectedProduct(null), 400);
  };

  const handleUndo = () => {
    if (undoRef.current) clearTimeout(undoRef.current);
    if (toast?.product) onAddProduct(toast.product);
    setToast(null);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      <div style={{ padding: "20px 20px 14px", background: "#FDFAF7" }}>

        {/* ── Avatar + identity ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar avatarUrl={user?.avatarUrl} initials={initials} size={60} />
            <div onClick={() => setShowEditProfile(true)} style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: "#1A1A1A", borderRadius: "50%", border: "2px solid #FDFAF7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#FFF", cursor: "pointer" }}>✎</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.15 }}>{cabinetName}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#AAA", marginTop: 1 }}>{handle}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setShowEditProfile(true)} style={{ background: "#F0EDE8", border: "1.5px solid #E5E0D8", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#888", fontFamily: "'Jost', sans-serif" }}>Edit</button>
            <button onClick={() => setShowSettings(s => !s)} style={{ background: "#F0EDE8", border: "1.5px solid #E5E0D8", borderRadius: 8, width: 32, height: 30, fontSize: 15, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
          </div>
        </div>

        {/* ── Bio ── */}
        {user?.bio ? (
          <p style={{ fontSize: 12, color: "#666", lineHeight: 1.65, fontStyle: "italic", margin: "0 0 12px", paddingBottom: 12, borderBottom: "0.5px solid #EDE9E3" }}>"{user.bio}"</p>
        ) : null}

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
          <div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>{activeProducts.length}</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#BBB", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>products</div></div>
          <div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>0</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#BBB", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>followers</div></div>
          <div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>0</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#BBB", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>following</div></div>
        </div>

        {/* ── Beauty DNA (from profile) ── */}
        <BeautyDNA skinType={user?.skinType} skinConcerns={user?.skinConcerns} hairType={user?.hairType} />

        {/* ── Beta badge ── */}
        {isBeta && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", background: "#1A1A1A", color: "#C8B8A2" }}>◈ BETA MEMBER</span>
          </div>
        )}

        {/* ── Settings drawer ── */}
        {showSettings && (
          <div style={{ background: "#FFF", border: "1.5px solid #EDE9E3", borderRadius: 12, padding: "12px 14px", marginBottom: 12, animation: "fadeUp 0.2s ease" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#BBB", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>Settings</div>
            <button onClick={() => setShowThemePicker(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 0", background: "none", border: "none", borderBottom: "0.5px solid #F0EDE8", color: "#1A1A1A", fontSize: 13, textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{theme.emoji}</span><span style={{ flex: 1 }}>Cabinet Style</span><span style={{ fontSize: 12, color: "#AAA" }}>→</span>
            </button>
            <button onClick={handleSignOut} disabled={signingOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 0", background: "none", border: "none", color: "#E07070", fontSize: 13, textAlign: "left", cursor: signingOut ? "default" : "pointer" }}>
              <span style={{ fontSize: 16 }}>↪</span><span>{signingOut ? "Signing out…" : "Sign Out"}</span>
            </button>
          </div>
        )}

        {/* ── Category filter pills with fade scroll ── */}
        <PillScrollRow fadeColor="#FDFAF7">
          {[{ id: "all", label: `All · ${activeProducts.length}` }, ...CATEGORIES.map(cat => {
            const count = activeProducts.filter(p => p.category === cat.id).length;
            if (!count && activeFilter !== cat.id) return null;
            return { id: cat.id, label: `${cat.label} · ${count}` };
          }).filter(Boolean)].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{ background: activeFilter === f.id ? "#1A1A1A" : "transparent", border: `1.5px solid ${activeFilter === f.id ? "#1A1A1A" : "#E5E0D8"}`, borderRadius: 20, padding: "5px 12px", fontSize: 10, fontWeight: 500, color: activeFilter === f.id ? "#FFF" : "#888", whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace", flexShrink: 0, cursor: "pointer", transition: "all 0.2s" }}>{f.label}</button>
          ))}
        </PillScrollRow>
      </div>

      <div style={{ height: "0.5px", background: "#EDE9E3" }} />

      <div style={{ paddingTop: 12 }}>
        <CabinetGrid products={products} onProductClick={setSelectedProduct} isOwn={true} activeFilter={activeFilter} />
      </div>

      {toast?.visible && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", maxWidth: 440, width: "calc(100% - 32px)", background: "#1A140F", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, zIndex: 60, animation: "fadeUp 0.25s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#7EC8A0" strokeWidth="1.2"/><path d="M5 8L7 10L11 6" stroke="#7EC8A0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ flex: 1, fontSize: 13, color: "#FDFAF7" }}>{toast.product?.name || "Product"} removed</span>
          <button onClick={handleUndo} style={{ background: "none", border: "none", color: "#C8B8A2", fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: "pointer", padding: "2px 4px" }}>Undo</button>
        </div>
      )}

      {showThemePicker && <ThemePicker current={theme} onSelect={onThemeChange} onClose={() => setShowThemePicker(false)} />}
      {showEditProfile  && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onUpdate={onUpdateUser} />}
      {selectedProduct  && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onRemove={handleRemove} onRepurchaseChange={handleRepurchase} isOwn={true} />}
    </div>
  );
}

// ─── FEED TAB ────────────────────────────────────────────────────────────────

function FeedTab() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? FEED_POSTS : FEED_POSTS.filter(p => p.product.category === CATEGORIES.find(c => c.label === filter)?.id);
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      <div style={{ padding: "20px 20px 0", background: "#FDFAF7", position: "sticky", top: 0, zIndex: 5, borderBottom: "1px solid #EDE9E3" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#1A1A1A", marginBottom: 14 }}>cabinet<span style={{ fontStyle: "italic", color: "#C8B8A2" }}>.</span></div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
          {["All", ...CATEGORIES.map(c => c.label)].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#1A1A1A" : "transparent", border: `1.5px solid ${filter === f ? "#1A1A1A" : "#DDD"}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: filter === f ? "#FFF" : "#888", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "14px 16px 0" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#CCC" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Nothing here yet</div>
          </div>
        ) : filtered.map((post, i) => <FeedPostCard key={post.id} post={post} index={i} />)}
      </div>
    </div>
  );
}

// ─── USER PROFILE VIEW ───────────────────────────────────────────────────────

function UserProfileView({ user, onBack }) {
  const [tab, setTab]                     = useState("cabinet");
  const [following, setFollowing]         = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "#F7F5F2", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", animation: "slideUp 0.35s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "rgba(247,245,242,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #EDE9E3", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: "#666", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.1 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{user.handle}</div>
        </div>
        <button onClick={() => setFollowing(f => !f)} style={{ background: following ? "#F0EDE8" : "#1A1A1A", border: "none", borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 500, color: following ? "#666" : "#FFF", transition: "all 0.2s", flexShrink: 0 }}>{following ? "Following" : "Follow"}</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 32 }}>
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 12 }}>{user.bio}</div>
              <div style={{ display: "flex", gap: 20 }}>
                {[{ label: "products", val: user.products.length }, { label: "followers", val: user.followers.toLocaleString() }, { label: "following", val: user.following }].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#1A1A1A", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "#AAA", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, borderBottom: "1.5px solid #EDE9E3", marginBottom: 20 }}>
            {[{ id: "cabinet", label: "🪞 Cabinet" }, { id: "posts", label: "⚡ Posts" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0", fontSize: 13, fontWeight: 500, color: tab === t.id ? "#1A1A1A" : "#BBB", borderBottom: tab === t.id ? "2px solid #1A1A1A" : "2px solid transparent", marginBottom: -1.5, transition: "all 0.2s" }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === "cabinet" && <CabinetGrid products={user.products} onProductClick={setSelectedProduct} isOwn={false} />}
        {tab === "posts" && (
          <div style={{ padding: "0 16px" }}>
            {user.posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#CCC" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>No posts yet</div>
              </div>
            ) : user.posts.map((post, i) => <FeedPostCard key={post.id} post={{ ...post, user: user.name, handle: user.handle, avatar: user.avatar, avatarColor: user.avatarColor }} index={i} />)}
          </div>
        )}
      </div>
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} isOwn={false} />}
    </div>
  );
}

// ─── DISCOVER TAB ─────────────────────────────────────────────────────────────

function DiscoverTab({ myProducts = [], onAddProduct }) {
  const [query, setQuery]                 = useState("");
  const [activeFilter, setActiveFilter]   = useState("all");
  const [selectedUser, setSelectedUser]   = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryResults, setCategoryResults] = useState([]);
  const [addedIds, setAddedIds]           = useState(new Set(myProducts.map(p => p.id)));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const inputRef = useRef(null);

  // MOVE 1: Use shared hook
  const { results: productResults, searching } = useProductSearch(query);

  useEffect(() => { setAddedIds(new Set(myProducts.map(p => p.id))); }, [myProducts]);

  useEffect(() => {
    if (!activeCategory) { setCategoryResults([]); return; }
    supabase.from("product_lines")
      .select("id, name, category, brands ( name ), products ( id, name, price_usd )")
      .eq("category", activeCategory).limit(20)
      .then(({ data }) => {
        setCategoryResults((data || []).filter(pl => pl.products?.length > 0).map(pl => ({
          id: pl.products[0].id, name: pl.name, brand: pl.brands?.name || "",
          category: pl.category, emoji: categoryEmoji(pl.category), color: categoryColor(pl.category),
        })));
      });
  }, [activeCategory]);

  const handleTopicTap = (cat) => { setQuery(""); setActiveCategory(cat.id); };
  const clearCategory  = () => { setActiveCategory(null); setCategoryResults([]); };
  const handleAdd      = (product) => { setAddedIds(prev => new Set([...prev, product.id])); onAddProduct?.(product); };

  const q = query.toLowerCase().trim();
  const userResults  = q.length > 0 ? MOCK_USERS.filter(u => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q)) : [];
  const topicResults = q.length > 0 ? CATEGORIES.filter(c => c.label.toLowerCase().includes(q)) : [];
  const hasResults   = userResults.length > 0 || productResults.length > 0 || topicResults.length > 0;
  const showPeople   = activeFilter === "all" || activeFilter === "people";
  const showProducts = activeFilter === "all" || activeFilter === "products";
  const showTopics   = activeFilter === "all" || activeFilter === "topics";

  if (selectedUser) return <UserProfileView user={selectedUser} onBack={() => setSelectedUser(null)} />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 16px 0", background: "#F7F5F2", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#1A1A1A", marginBottom: 14 }}>Discover</div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#C8B8A2" strokeWidth="1.5"/><path d="M11 11L14 14" stroke="#C8B8A2" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Products, people, categories…" style={{ width: "100%", padding: "13px 40px 13px 40px", background: "#FFF", border: "1.5px solid #EDE9E3", borderRadius: 14, fontSize: 15, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#C8B8A2"} onBlur={e => e.target.style.borderColor = "#EDE9E3"} />
          {query.length > 0 && (
            <button onClick={() => { setQuery(""); setActiveCategory(null); setCategoryResults([]); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "#E5E0D8", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          )}
        </div>
        {query.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
            {[{ id: "all", label: "All" }, { id: "products", label: "Products" }, { id: "people", label: "People" }, { id: "topics", label: "Categories" }].map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{ background: activeFilter === f.id ? "#1A1A1A" : "transparent", border: `1.5px solid ${activeFilter === f.id ? "#1A1A1A" : "#DDD"}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 500, color: activeFilter === f.id ? "#FFF" : "#888", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s" }}>{f.label}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 120px" }}>
        {query.length === 0 && (
          <div>
            <TrendingSection addedIds={addedIds} onAdd={handleAdd} onProductClick={setSelectedProduct} />
            <div style={{ marginTop: 24 }}>
              <SectionLabel>Browse by category</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
                {CATEGORIES.map((cat, i) => (
                  <button key={cat.id} className="fade-up" onClick={() => handleTopicTap(cat)} style={{ background: activeCategory === cat.id ? cat.color + "55" : "#FFF", border: `1.5px solid ${activeCategory === cat.id ? cat.color + "CC" : "#EDE9E3"}`, borderRadius: 16, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.18s", animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                    <div style={{ width: 36, height: 36, background: cat.color + "33", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cat.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#555", textAlign: "center" }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {activeCategory && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <SectionLabel>{CATEGORIES.find(c => c.id === activeCategory)?.label}</SectionLabel>
                  <button onClick={clearCategory} style={{ background: "none", border: "none", color: "#C8B8A2", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>CLEAR ✕</button>
                </div>
                {categoryResults.length === 0 && [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 8 }} />)}
                {categoryResults.map((product, i) => <ProductCard key={product.id} product={product} index={i} owned={addedIds.has(product.id)} onAdd={() => handleAdd(product)} onProductClick={setSelectedProduct} friendAvatars={friendAvatarsFor(product.id)} repurchaseRate={repurchaseRateFor(product.id)} />)}
              </div>
            )}
          </div>
        )}

        {query.length > 0 && (
          !hasResults && !searching ? (
            <div style={{ textAlign: "center", padding: "56px 0", color: "#CCC" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#BBB", marginBottom: 6 }}>No results for "{query}"</div>
              <div style={{ fontSize: 13, color: "#CCC" }}>Try a product name, brand, skin concern, or @handle</div>
            </div>
          ) : (
            <div>
              {showProducts && (searching || productResults.length > 0) && (
                <div style={{ paddingTop: 20 }}>
                  <SectionLabel>Products</SectionLabel>
                  {searching && productResults.length === 0 && [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 8 }} />)}
                  {productResults.map((product, i) => <ProductCard key={product.id} product={product} index={i} owned={addedIds.has(product.id)} onAdd={() => handleAdd(product)} onProductClick={setSelectedProduct} friendAvatars={friendAvatarsFor(product.id)} repurchaseRate={repurchaseRateFor(product.id)} />)}
                </div>
              )}
              {showTopics && topicResults.length > 0 && (
                <div style={{ paddingTop: 20 }}>
                  <SectionLabel>Categories</SectionLabel>
                  {topicResults.map((cat, i) => (
                    <div key={cat.id} className="fade-up" onClick={() => handleTopicTap(cat)} style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFF", borderRadius: 14, padding: "14px 16px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: cat.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{cat.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{cat.label}</div>
                        <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>browse {cat.label.toLowerCase()} →</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 18, color: "#DDD" }}>›</span>
                    </div>
                  ))}
                </div>
              )}
              {showPeople && userResults.length > 0 && (
                <div style={{ paddingTop: 20 }}>
                  <SectionLabel>People</SectionLabel>
                  {userResults.map((user, i) => <UserRow key={user.id} user={user} index={i} onTap={() => setSelectedUser(user)} />)}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} isOwn={addedIds.has(selectedProduct.id)} onAdd={(p) => { handleAdd(p); setSelectedProduct(null); }} />}
    </div>
  );
}

// ─── TRENDING SECTION ─────────────────────────────────────────────────────────

function TrendingSection({ addedIds, onAdd, onProductClick }) {
  return (
    <div style={{ paddingTop: 20 }}>
      <SectionLabel>Trending in cabinet.</SectionLabel>
      {MOCK_PRODUCTS.slice(0, 6).map((product, i) => (
        <TrendingRow key={product.id} product={product} rank={i + 1} index={i} owned={addedIds.has(product.id)} onAdd={() => onAdd(product)} onProductClick={onProductClick} friendAvatars={friendAvatarsFor(product.id)} repurchaseRate={repurchaseRateFor(product.id)} />
      ))}
    </div>
  );
}

function TrendingRow({ product, rank, index, owned, onAdd, onProductClick, friendAvatars, repurchaseRate }) {
  return (
    <div className="fade-up" onClick={() => onProductClick?.(product)} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${index * 0.05}s`, opacity: 0 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#DDD", width: 22, textAlign: "center", flexShrink: 0 }}>{String(rank).padStart(2, "0")}</span>
      <div style={{ width: 44, height: 60, flexShrink: 0, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 3px 10px ${product.color}44` }}>{product.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{product.name}</div>
        <div style={{ fontSize: 10, color: "#BBB", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{product.brand}</div>
        <SignalRow friendAvatars={friendAvatars} repurchaseRate={repurchaseRate} />
      </div>
      <AddButton owned={owned} onAdd={onAdd} />
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({ product, index, owned, onAdd, onProductClick, friendAvatars, repurchaseRate }) {
  return (
    <div className="fade-up" onClick={() => onProductClick?.(product)} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${index * 0.04}s`, opacity: 0, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "#FBF9F6"} onMouseLeave={e => e.currentTarget.style.background = "#FFF"}>
      <div style={{ width: 44, height: 60, flexShrink: 0, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 3px 10px ${product.color}44` }}>{product.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#CCC", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{product.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{product.name}</div>
        <SignalRow friendAvatars={friendAvatars} repurchaseRate={repurchaseRate} />
      </div>
      <AddButton owned={owned} onAdd={onAdd} />
    </div>
  );
}

// ─── SIGNAL ROW ──────────────────────────────────────────────────────────────

function SignalRow({ friendAvatars = [], repurchaseRate = null }) {
  if (friendAvatars.length > 0) return (
    <div style={{ display: "flex", alignItems: "center", height: 18 }}>
      {friendAvatars.slice(0, 4).map((av, i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: av.color, border: "1.5px solid #FFF", marginLeft: i === 0 ? 0 : -4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 700, color: "#FFF", fontFamily: "'DM Mono', monospace" }}>{av.initials}</div>
      ))}
    </div>
  );
  if (repurchaseRate !== null) return (
    <div style={{ height: 18, display: "flex", alignItems: "center" }}>
      <span style={{ fontSize: 10, color: "#7AAF8A", fontFamily: "'DM Mono', monospace", letterSpacing: "0.02em" }}>↻ {repurchaseRate}%</span>
    </div>
  );
  return <div style={{ height: 18 }} />;
}

// ─── ADD BUTTON ───────────────────────────────────────────────────────────────

function AddButton({ owned, onAdd }) {
  return (
    <button onClick={e => { e.stopPropagation(); if (!owned) onAdd(); }} style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: owned ? "1.5px solid rgba(122,175,138,0.3)" : "1.5px solid #E5E0D8", background: owned ? "rgba(122,175,138,0.1)" : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: owned ? "default" : "pointer", transition: "all 0.2s ease", color: owned ? "#7AAF8A" : "#999" }} aria-label={owned ? "In your cabinet" : "Add to cabinet"}>
      {owned
        ? <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="#7AAF8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5V10.5M1.5 6H10.5" stroke="#BBB" strokeWidth="1.6" strokeLinecap="round"/></svg>
      }
    </button>
  );
}

// ─── SECTION LABEL ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

// ─── USER ROW ────────────────────────────────────────────────────────────────

function UserRow({ user, index = 0, onTap }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className="fade-up" onClick={onTap} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF", borderRadius: 16, padding: "13px 14px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${index * 0.06}s`, opacity: 0, transition: "background 0.15s" }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>{user.avatar}</div>
      <div style={{ width: 36, height: 46, borderRadius: 6, overflow: "hidden", border: `2px solid ${user.cabinetTheme.cabinetBorder}`, flexShrink: 0, background: user.cabinetTheme.cabinetBg, display: "flex", flexDirection: "column" }}>
        {[0,1].map(r => (
          <div key={r} style={{ flex: 1, background: user.cabinetTheme.mirrorBg, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "2px" }}>
            {user.products.slice(r*2, r*2+2).map((p,i) => <div key={i} style={{ width: 8, height: 12, background: p?.color || "transparent", borderRadius: 2 }} />)}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{user.name}</div>
        <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{user.handle}</div>
        <div style={{ fontSize: 11, color: "#BBB", marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user.products.length} products</div>
      </div>
      <button onClick={e => { e.stopPropagation(); setFollowing(f => !f); }} style={{ background: following ? "#F0EDE8" : "#1A1A1A", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: following ? "#666" : "#FFF", flexShrink: 0, transition: "all 0.2s" }}>{following ? "✓" : "+ Follow"}</button>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

function BottomNav({ active, onChange, onAddPress }) {
  const TABS = [
    { id: "feed",     label: "Feed",     icon: FeedIcon },
    { id: "discover", label: "Discover", icon: DiscoverIcon },
    { id: "cabinet",  label: "Cabinet",  icon: CabinetIcon },
  ];
  const [fabVisible, setFabVisible] = useState(true);
  const lastScrollY = useRef(0);
  const fabTimer    = useRef(null);

  useEffect(() => {
    const handleScroll = (e) => {
      const target = e.target;
      if (!target || (!target.scrollTop && target.scrollTop !== 0)) return;
      const delta = target.scrollTop - lastScrollY.current;
      if (delta > 10)       setFabVisible(false);
      else if (delta < -10) setFabVisible(true);
      lastScrollY.current = target.scrollTop;
      if (fabTimer.current) clearTimeout(fabTimer.current);
      fabTimer.current = setTimeout(() => setFabVisible(true), 1500);
    };
    document.addEventListener("scroll", handleScroll, true);
    return () => { document.removeEventListener("scroll", handleScroll, true); if (fabTimer.current) clearTimeout(fabTimer.current); };
  }, []);

  return (
    <>
      <style>{`
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(253,250,247,0.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-top: 0.5px solid #EDE9E3; display: flex; align-items: center; justify-content: space-around; padding: 10px 24px 0; padding-bottom: calc(14px + env(safe-area-inset-bottom)); z-index: 50; }
        .nav-tab-btn { flex: 1; background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; }
        .nav-tab-btn:active { opacity: 0.6; }
        .nav-tab-indicator { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 18px; height: 2px; background: #1A1A1A; border-radius: 0 0 2px 2px; }
        .nav-tab-label { font-family: 'DM Mono', monospace; font-size: 9.5px; font-weight: 500; letter-spacing: 0.05em; transition: color 0.2s ease; }
        .fab { position: fixed; bottom: calc(80px + env(safe-area-inset-bottom)); right: max(16px, calc((100vw - 480px) / 2 + 16px)); width: 52px; height: 52px; background: #1A1A1A; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(26,26,26,0.24), 0 1px 4px rgba(26,26,26,0.12); cursor: pointer; z-index: 51; -webkit-tap-highlight-color: transparent; transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease; }
        .fab:active { transform: scale(0.9); box-shadow: 0 2px 10px rgba(26,26,26,0.18); }
      `}</style>

      <button className="fab" onClick={onAddPress} aria-label="Add product" style={{ transform: fabVisible ? "scale(1)" : "scale(0)", opacity: fabVisible ? 1 : 0, transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease", pointerEvents: fabVisible ? "auto" : "none" }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 4V18M4 11H18" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button key={tab.id} className="nav-tab-btn" onClick={() => onChange(tab.id)} aria-label={tab.label} aria-current={active === tab.id ? "page" : undefined}>
            {active === tab.id && <div className="nav-tab-indicator" />}
            <tab.icon active={active === tab.id} />
            <span className="nav-tab-label" style={{ color: active === tab.id ? "#1A1A1A" : "#C8C0B8" }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

function FeedIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h8" stroke={active ? "#1A1A1A" : "#C8C0B8"} strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function DiscoverIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke={active ? "#1A1A1A" : "#C8C0B8"} strokeWidth="1.6"/><path d="M14 14L17 17" stroke={active ? "#1A1A1A" : "#C8C0B8"} strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function CabinetIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2.5" width="14" height="15" rx="2" stroke={active ? "#1A1A1A" : "#C8C0B8"} strokeWidth="1.6"/><path d="M3 7h14M3 12h14" stroke={active ? "#1A1A1A" : "#C8C0B8"} strokeWidth="1.6"/><circle cx="10" cy="9.5" r="1" fill={active ? "#1A1A1A" : "#C8C0B8"} /></svg>;
}

// ─── AUTH COMPONENTS ─────────────────────────────────────────────────────────

function AuthInput({ label, type = "text", value, onChange, placeholder, error, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: error ? 6 : 18 }}>
      {label && <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#AAA", letterSpacing: "0.08em", marginBottom: 7 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ width: "100%", padding: "14px 16px", background: "#FFF", border: `1.5px solid ${error ? "#E07070" : focused ? "#C8B8A2" : "#E5E0D8"}`, borderRadius: 12, fontSize: 15, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", outline: "none", transition: "border-color 0.2s" }} />
      {error && <div style={{ fontSize: 12, color: "#E07070", marginTop: 5, fontFamily: "'DM Mono', monospace" }}>{error}</div>}
    </div>
  );
}

function AuthBtn({ label, onClick, loading, secondary, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ width: "100%", padding: "15px", background: secondary ? "transparent" : (disabled || loading) ? "#C8BFB5" : "#1A1A1A", border: secondary ? "1.5px solid #E5E0D8" : "none", borderRadius: 14, fontSize: 15, fontWeight: 600, color: secondary ? "#888" : "#FFF", cursor: (disabled || loading) ? "default" : "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {loading ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : label}
    </button>
  );
}

function SplashScreen({ onSignIn, onSignUp }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0F0D0B", padding: "0 28px", animation: "fadeUp 0.5s ease forwards" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
        <div style={{ position: "relative", width: 220, height: 280 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #2C1810 0%, #3D2314 50%, #2A1508 100%)", border: "5px solid #1A0D06", borderRadius: 20, boxShadow: "0 30px 80px rgba(0,0,0,0.7)", overflow: "hidden" }}>
            <div style={{ height: 10, background: "#5C3D1E", borderBottom: "2px solid #1A0D06" }} />
            {[0,1,2].map(row => (
              <div key={row}>
                <div style={{ height: 72, background: "linear-gradient(135deg, #F5ECD7 0%, #EDE0C4 100%)", display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "8px 16px 0" }}>
                  {[{color:"#FFB3C8",emoji:"💊"},{color:"#B8D4E8",emoji:"🧴"},{color:"#D4A0A0",emoji:"💄"}].map((p,i) => (
                    <div key={i} style={{ width: 34, height: 48, background: `linear-gradient(145deg,${p.color}FF,${p.color}88)`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 3px 8px ${p.color}55, inset 0 1px 0 rgba(255,255,255,0.5)` }}>{p.emoji}</div>
                  ))}
                </div>
                <div style={{ height: 10, background: "linear-gradient(180deg,#C4956A 0%,#A67C52 60%,#8B6340 100%)", boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.25)" }} />
              </div>
            ))}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, background: "#5C3D1E", borderTop: "2px solid #1A0D06" }} />
          </div>
          <div style={{ position: "absolute", inset: -20, background: "radial-gradient(ellipse at 50% 50%, rgba(200,184,162,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>
      </div>
      <div style={{ paddingBottom: 56, textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 600, color: "#FDFAF7", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6 }}>cabinet<span style={{ color: "#C8B8A2", fontStyle: "italic" }}>.</span></div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#665C52", letterSpacing: "0.12em", marginBottom: 40 }}>YOUR BEAUTY. YOUR SHELF.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <AuthBtn label="Create account" onClick={onSignUp} />
          <AuthBtn label="Sign in" onClick={onSignIn} secondary />
        </div>
        <div style={{ marginTop: 24, fontSize: 11, color: "#443C35", lineHeight: 1.6 }}>
          By continuing you agree to our <span style={{ color: "#665C52", textDecoration: "underline" }}>Terms</span> and <span style={{ color: "#665C52", textDecoration: "underline" }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

function SignUpScreen({ onBack, onSuccess }) {
  const [step, setStep]         = useState(1);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [handle, setHandle]     = useState("");
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const next = async () => {
    if (step === 1) {
      if (!email.includes("@") || !email.includes(".")) { setErrors({ email: "Enter a valid email address" }); return; }
      setErrors({}); setStep(2);
    } else if (step === 2) {
      if (password.length < 8) { setErrors({ password: "Must be at least 8 characters" }); return; }
      setErrors({}); setStep(3);
    } else {
      const e = {};
      if (!name.trim()) e.name = "Name is required";
      if (!handle.trim()) e.handle = "Handle is required";
      else if (!/^[a-z0-9_]+$/.test(handle)) e.handle = "Lowercase, numbers, underscores only";
      if (Object.keys(e).length) { setErrors(e); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, display_name: name } } });
        if (error) { setErrors({ name: error.message.includes("already registered") ? "This email is already registered. Try signing in." : error.message }); setLoading(false); return; }
        if (data.user) {
          const userId = data.user.id;
          let attempts = 0;
          while (attempts < 10) {
            const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).single();
            if (existing) break;
            await new Promise(r => setTimeout(r, 300));
            attempts++;
          }
          await supabase.from("profiles").update({ display_name: name, username: handle }).eq("id", userId);
        }
        setLoading(false);
        onSuccess({ email, name, handle: "@" + handle, id: data.user?.id });
      } catch (err) {
        setErrors({ name: "Something went wrong. Please try again." });
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease" }}>
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: "#666" }}>←</button>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>Create account</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#AAA" }}>Step {step} of 3 — {["Email","Password","Profile"][step-1]}</div>
        </div>
      </div>
      <div style={{ margin: "16px 24px 0", height: 3, background: "#E5E0D8", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${(step/3)*100}%`, background: "#1A1A1A", borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ flex: 1, padding: "32px 24px 0", display: "flex", flexDirection: "column" }}>
        {step === 1 && (<>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>What's your email?</div>
          <div style={{ fontSize: 14, color: "#AAA", marginBottom: 28 }}>You'll use this to sign in and verify your account.</div>
          <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} autoFocus />
        </>)}
        {step === 2 && (<>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Create a password</div>
          <div style={{ fontSize: 14, color: "#AAA", marginBottom: 28 }}>At least 8 characters.</div>
          <AuthInput label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={errors.password} autoFocus />
          {password.length > 0 && (
            <div style={{ marginTop: -10, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= i*3 ? (password.length >= 12 ? "#7EC8A0" : password.length >= 8 ? "#C8B87E" : "#E07070") : "#E5E0D8", transition: "background 0.3s" }} />)}
              </div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: password.length >= 12 ? "#7EC8A0" : password.length >= 8 ? "#C8B87E" : "#E07070" }}>{password.length >= 12 ? "Strong" : password.length >= 8 ? "Good" : "Too short"}</div>
            </div>
          )}
        </>)}
        {step === 3 && (<>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Set up your profile</div>
          <div style={{ fontSize: 14, color: "#AAA", marginBottom: 28 }}>How others will find and recognize you.</div>
          <AuthInput label="FULL NAME" value={name} onChange={setName} placeholder="Jane Doe" error={errors.name} autoFocus />
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#AAA", letterSpacing: "0.08em", marginBottom: 7 }}>HANDLE</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#C8B8A2", fontSize: 15, fontWeight: 600 }}>@</span>
              <input value={handle} onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="yourhandle" style={{ width: "100%", padding: "14px 16px 14px 30px", background: "#FFF", border: `1.5px solid ${errors.handle ? "#E07070" : "#E5E0D8"}`, borderRadius: 12, fontSize: 15, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", outline: "none" }} />
            </div>
            {errors.handle && <div style={{ fontSize: 12, color: "#E07070", marginTop: 5, fontFamily: "'DM Mono', monospace" }}>{errors.handle}</div>}
          </div>
        </>)}
        <div style={{ marginTop: "auto", paddingBottom: 40 }}>
          <AuthBtn label={step < 3 ? "Continue →" : "Create my cabinet"} onClick={next} loading={loading} />
          {step > 1 && <button onClick={() => { setStep(s => s-1); setErrors({}); }} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "#AAA", fontSize: 14, marginTop: 8, cursor: "pointer" }}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

function SignInScreen({ onBack, onSuccess, onForgot }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    const e = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrors({ password: error.message.includes("Invalid login credentials") ? "Incorrect email or password" : error.message.includes("Email not confirmed") ? "Please verify your email first — check your inbox" : error.message });
        setLoading(false); return;
      }
      const { data: profile } = await supabase.from("profiles").select("id, username, display_name, avatar_url, bio, skin_type, skin_concerns, hair_type, cabinet_name, role")
        .eq("id", data.user.id)
        .maybeSingle();
      const savedThemeId = localStorage.getItem("cabinet_theme_" + data.user.id);
      const savedTheme = savedThemeId ? CABINET_THEMES.find(t => t.id === savedThemeId) || CABINET_THEMES[0] : CABINET_THEMES[0];
      setLoading(false);
      onSuccess({
        id: data.user.id, email: data.user.email,
        name: profile?.display_name || data.user.email,
        handle: profile?.username ? "@" + profile.username : "@" + data.user.email.split("@")[0],
        avatarUrl: profile?.avatar_url || null,
        bio: profile?.bio || null,
        skinType: profile?.skin_type || null,
        skinConcerns: profile?.skin_concerns || [],
        hairType: profile?.hair_type || null,
        cabinetName: profile?.cabinet_name || null,
        cabinetTheme: savedTheme,
        role: profile?.role || "user",
      });
    } catch (err) {
      setErrors({ password: "Something went wrong. Please try again." });
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease" }}>
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: "#666" }}>←</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>Welcome back</div>
      </div>
      <div style={{ flex: 1, padding: "40px 24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Sign in to your cabinet</div>
        <div style={{ fontSize: 14, color: "#AAA", marginBottom: 36 }}>Good to see you again.</div>
        <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} autoFocus />
        <AuthInput label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={errors.password} />
        <button onClick={onForgot} style={{ background: "none", border: "none", color: "#C8B8A2", fontSize: 13, textAlign: "right", padding: "0 0 28px", cursor: "pointer" }}>Forgot password?</button>
        <div style={{ marginTop: "auto", paddingBottom: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          <AuthBtn label="Sign in →" onClick={submit} loading={loading} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E0D8" }} /><span style={{ fontSize: 11, color: "#CCC", fontFamily: "'DM Mono', monospace" }}>OR</span><div style={{ flex: 1, height: 1, background: "#E5E0D8" }} />
          </div>
          <button onClick={onBack} style={{ width: "100%", padding: "14px", background: "none", border: "1.5px solid #E5E0D8", borderRadius: 14, fontSize: 14, color: "#888", cursor: "pointer" }}>Create a new account</button>
        </div>
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    setError(""); setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false); setSent(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease" }}>
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: "#666" }}>←</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>Reset password</div>
      </div>
      <div style={{ flex: 1, padding: "40px 24px 0", display: "flex", flexDirection: "column" }}>
        {!sent ? (<>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Forgot your password?</div>
          <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, marginBottom: 36 }}>Enter your email and we'll send you a reset link.</div>
          <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={error} autoFocus />
          <div style={{ marginTop: "auto", paddingBottom: 40 }}><AuthBtn label="Send reset link" onClick={submit} loading={loading} /></div>
        </>) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#1A1A1A", marginBottom: 10, textAlign: "center" }}>Check your inbox</div>
            <div style={{ fontSize: 14, color: "#AAA", textAlign: "center", lineHeight: 1.7, maxWidth: 280, marginBottom: 36 }}>We sent a reset link to <strong style={{ color: "#1A1A1A" }}>{email}</strong>. Expires in 15 minutes.</div>
            <AuthBtn label="Back to sign in" onClick={onBack} secondary />
          </div>
        )}
      </div>
    </div>
  );
}

function VerifyEmailScreen({ user, onVerified }) {
  const [code, setCode]       = useState(["","","","","",""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);
  const inputRefs             = useRef([]);

  const handleDigit = (val, i) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g,"").slice(0,6).split("");
      setCode(["","","","","",""].map((_,j) => digits[j] || ""));
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const digit = val.replace(/\D/g,"").slice(-1);
    const next = [...code]; next[i] = digit; setCode(next);
    if (digit && i < 5) inputRefs.current[i+1]?.focus();
  };
  const handleKey = (e, i) => { if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i-1]?.focus(); };

  const submit = async () => {
    const token = code.join("");
    if (token.length < 6) { setError("Enter the full 6-digit code"); return; }
    setError(""); setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: user?.email, token, type: "signup" });
    if (verifyError) { setError("Invalid or expired code. Try resending."); setLoading(false); return; }
    setLoading(false); onVerified();
  };

  const resend = async () => {
    await supabase.auth.resend({ type: "signup", email: user?.email });
    setResent(true); setTimeout(() => setResent(false), 4000);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease" }}>
      <div style={{ flex: 1, padding: "56px 24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 48, marginBottom: 20, textAlign: "center" }}>✉️</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: "#1A1A1A", textAlign: "center", marginBottom: 10 }}>Verify your email</div>
        <div style={{ fontSize: 14, color: "#AAA", textAlign: "center", lineHeight: 1.7, marginBottom: 40 }}>We sent a 6-digit code to<br /><strong style={{ color: "#1A1A1A" }}>{user?.email}</strong></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
          {code.map((digit, i) => (
            <input key={i} ref={el => inputRefs.current[i] = el} value={digit} onChange={e => handleDigit(e.target.value, i)} onKeyDown={e => handleKey(e, i)} maxLength={6} style={{ width: 46, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", background: "#FFF", border: `2px solid ${digit ? "#1A1A1A" : "#E5E0D8"}`, borderRadius: 12, color: "#1A1A1A", outline: "none", transition: "border-color 0.2s" }} />
          ))}
        </div>
        {error && <div style={{ textAlign: "center", fontSize: 12, color: "#E07070", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>{error}</div>}
        <button onClick={resend} style={{ background: "none", border: "none", color: resent ? "#7EC8A0" : "#C8B8A2", fontSize: 13, textAlign: "center", cursor: "pointer", marginBottom: 36 }}>{resent ? "✓ Code resent!" : "Didn't get it? Resend code"}</button>
        <div style={{ marginTop: "auto", paddingBottom: 48 }}>
          <AuthBtn label="Verify →" onClick={submit} loading={loading} disabled={code.join("").length < 6} />
        </div>
      </div>
    </div>
  );
}

function OnboardingScreen({ user, onComplete }) {
  const [selectedTheme, setSelectedTheme] = useState(CABINET_THEMES[0].id);
  const [cabinetName, setCabinetName]     = useState(user?.name ? `${user.name.split(" ")[0]}'s Cabinet` : "My Cabinet");
  const [loading, setLoading]             = useState(false);

  const finish = async () => {
    setLoading(true);
    const theme     = CABINET_THEMES.find(t => t.id === selectedTheme);
    const finalName = cabinetName.trim() || (user?.name ? `${user.name.split(" ")[0]}'s Cabinet` : "My Cabinet");
    if (user?.id) {
      await supabase.from("profiles").update({ onboarding_complete: true, cabinet_name: finalName }).eq("id", user.id);
      localStorage.setItem("cabinet_theme_" + user.id, selectedTheme);
    }
    setLoading(false);
    onComplete(theme, finalName);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease", overflowY: "auto" }}>
      <div style={{ padding: "48px 24px 0", flex: 1 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C8B8A2", letterSpacing: "0.15em", marginBottom: 10 }}>ALMOST THERE</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }}>Make it yours{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</div>
        <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, marginBottom: 28 }}>Name your cabinet, then pick your style.</div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#AAA", letterSpacing: "0.08em", marginBottom: 8 }}>CABINET NAME</div>
          <input value={cabinetName} onChange={e => setCabinetName(e.target.value)} maxLength={40} style={{ width: "100%", padding: "14px 16px", background: "#FFF", border: "1.5px solid #E5E0D8", borderRadius: 12, fontSize: 15, color: "#1A1A1A", fontFamily: "'Cormorant Garamond', serif" }} onFocus={e => e.target.style.borderColor = "#C8B8A2"} onBlur={e => e.target.style.borderColor = "#E5E0D8"} />
          <div style={{ fontSize: 11, color: "#CCC", fontFamily: "'DM Mono', monospace", marginTop: 6 }}>This appears on your profile. You can change it anytime.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 36 }}>
          {CABINET_THEMES.map(theme => (
            <button key={theme.id} onClick={() => setSelectedTheme(theme.id)} style={{ background: theme.cabinetBg, border: selectedTheme === theme.id ? "3px solid #1A1A1A" : "2px solid transparent", borderRadius: 18, padding: "16px 14px 14px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.2s, border 0.2s", transform: selectedTheme === theme.id ? "scale(1.02)" : "scale(1)", display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedTheme === theme.id && <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, background: "#FFF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#1A1A1A", fontWeight: 700 }}>✓</div>}
              <div style={{ borderRadius: 10, overflow: "hidden", border: `3px solid ${theme.cabinetBorder}` }}>
                <div style={{ height: 6, background: theme.edgeBg }} />
                {[0,1].map(row => (
                  <div key={row}>
                    <div style={{ height: 40, background: theme.mirrorBg, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "6px 10px 0" }}>
                      {["💊","💄","🧴"].map((e,i) => <div key={i} style={{ width: 18, height: 26, background: ["#FFB3C8","#D4A0A0","#B8D4E8"][i], borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{e}</div>)}
                    </div>
                    <div style={{ height: 8, background: theme.shelfBg }} />
                  </div>
                ))}
                <div style={{ height: 6, background: theme.edgeBg }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", textAlign: "left" }}>{theme.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 24px 48px" }}>
        <AuthBtn label="Open my cabinet ✦" onClick={finish} loading={loading} />
      </div>
    </div>
  );
}

function AuthGate({ onAuthenticated }) {
  const [screen, setScreen]         = useState("splash");
  const [pendingUser, setPendingUser] = useState(null);
  const [checking, setChecking]     = useState(true);

  useEffect(() => {
    // onAuthStateChange fires after the JWT is verified — safer than getSession
    // which can fire before the session is ready, causing profile reads to fail silently.
    // getSession handles the initial load — it reads from local storage immediately
    // so the splash never hangs. onAuthStateChange then keeps the session live.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setChecking(false); return; }

      const { data: profile, error } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url, bio, skin_type, skin_concerns, hair_type, cabinet_name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) console.warn("[AuthGate] profile fetch error:", error.message);

      const savedThemeId = localStorage.getItem("cabinet_theme_" + session.user.id);
      const savedTheme = savedThemeId ? CABINET_THEMES.find(t => t.id === savedThemeId) || CABINET_THEMES[0] : CABINET_THEMES[0];

      onAuthenticated({
        id:           session.user.id,
        email:        session.user.email,
        name:         profile?.display_name || session.user.email,
        handle:       profile?.username ? "@" + profile.username : "@" + session.user.email.split("@")[0],
        avatarUrl:    profile?.avatar_url || null,
        bio:          profile?.bio || null,
        skinType:     profile?.skin_type || null,
        skinConcerns: profile?.skin_concerns || [],
        hairType:     profile?.hair_type || null,
        cabinetName:  profile?.cabinet_name || null,
        cabinetTheme: savedTheme,
        role:         profile?.role || "user",
      });
    });
  }, []);

  if (checking) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F0D0B" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 600, color: "#FDFAF7", letterSpacing: "-0.02em" }}>cabinet<span style={{ color: "#C8B8A2", fontStyle: "italic" }}>.</span></div>
    </div>
  );

  if (screen === "splash")     return <SplashScreen onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />;
  if (screen === "signin")     return <SignInScreen onBack={() => setScreen("splash")} onForgot={() => setScreen("forgot")} onSuccess={user => onAuthenticated(user)} />;
  if (screen === "signup")     return <SignUpScreen onBack={() => setScreen("splash")} onSuccess={user => { setPendingUser(user); setScreen("verify"); }} />;
  if (screen === "forgot")     return <ForgotPasswordScreen onBack={() => setScreen("signin")} />;
  if (screen === "verify")     return <VerifyEmailScreen user={pendingUser} onVerified={() => setScreen("onboarding")} />;
  if (screen === "onboarding") return <OnboardingScreen user={pendingUser} onComplete={(theme, cabinetName) => onAuthenticated({ ...pendingUser, cabinetTheme: theme, cabinetName })} />;
  return null;
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [authedUser, setAuthedUser]     = useState(null);
  const [activeTab, setActiveTab]       = useState("feed");
  const [cabinetTheme, setCabinetTheme] = useState(CABINET_THEMES[0]);
  const [myProducts, setMyProducts]     = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loadingCabinet, setLoadingCabinet] = useState(false);

  const loadCabinet = async (userId) => {
    setLoadingCabinet(true);
    // cabinet_theme is stored in localStorage keyed by user ID (not in DB)
    const savedThemeId = localStorage.getItem("cabinet_theme_" + userId);
    if (savedThemeId) { const saved = CABINET_THEMES.find(t => t.id === savedThemeId); if (saved) setCabinetTheme(saved); }

    const { data: userProducts } = await supabase.from("user_products")
      .select("id, product_id, status, notes, products ( id, name, price_usd, image_url, product_lines ( name, category, brands ( name ) ) )")
      .eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false });

    if (userProducts?.length > 0) {
      const seen = new Set();
      const products = [];
      for (const up of userProducts) {
        if (seen.has(up.product_id) || !up.products) continue;
        seen.add(up.product_id);
        const p = up.products;
        const pl = p.product_lines;
        products.push({ id: p.id, user_product_id: up.id, name: pl?.name || p.name, sku: p.name, brand: pl?.brands?.name || "", category: pl?.category || "other", price: p.price_usd ? `$${p.price_usd}` : "", emoji: categoryEmoji(pl?.category), color: categoryColor(pl?.category), status: up.status });
      }
      setMyProducts(products);
    }
    setLoadingCabinet(false);
  };

  const handleAuthenticated = (user) => { if (user.cabinetTheme) setCabinetTheme(user.cabinetTheme); setAuthedUser(user); if (user.id) loadCabinet(user.id); };
  const handleSignOut       = () => { setAuthedUser(null); setActiveTab("feed"); setCabinetTheme(CABINET_THEMES[0]); setMyProducts([]); };

  const handleAddProduct = async (product) => {
    // Optimistic local update first so UI feels instant
    setMyProducts(prev => prev.find(p => p.id === product.id) ? prev : [...prev, { ...product, status: "using" }]);

    if (authedUser?.id && product.id) {
      const { data, error } = await supabase
        .from("user_products")
        .insert({ user_id: authedUser.id, product_id: product.id, status: "using" })
        .select("id")
        .single();

      if (error) {
        console.warn("[handleAddProduct] insert error:", error.message);
      } else if (data?.id) {
        // Stamp user_product_id onto the local record so repurchase updates target the right row
        setMyProducts(prev => prev.map(p => p.id === product.id ? { ...p, user_product_id: data.id } : p));
      }
    }
  };

  const handleRemoveProduct = async (product, persist) => {
    if (!persist) { setMyProducts(prev => prev.filter(p => p.id !== product.id)); return; }

    if (!authedUser?.id) return;

    const query = supabase.from("user_products")
      .update({ deleted_at: new Date().toISOString() })
      .is("deleted_at", null);

    const { error } = product.user_product_id
      ? await query.eq("id", product.user_product_id)
      : await query.eq("user_id", authedUser.id).eq("product_id", product.id);

    if (error) console.warn("[handleRemoveProduct] update error:", error.message);
  };

  const handleThemeChange = (theme) => {
    setCabinetTheme(theme);
    if (authedUser?.id) localStorage.setItem("cabinet_theme_" + authedUser.id, theme.id);
  };

  const handleRepurchaseChange = async (product, status) => {
    // Optimistic update
    setMyProducts(prev => prev.map(p => p.id === product.id ? { ...p, status } : p));

    if (!authedUser?.id) return;

    // Prefer targeting by user_product_id (the PK) — unambiguous even with soft-deleted rows.
    // Fall back to product_id filter if user_product_id isn't stamped yet.
    const query = supabase.from("user_products").update({ status }).is("deleted_at", null);

    const { error } = product.user_product_id
      ? await query.eq("id", product.user_product_id)
      : await query.eq("user_id", authedUser.id).eq("product_id", product.id);

    if (error) console.warn("[handleRepurchaseChange] update error:", error.message);
  };

  const shell = (children) => (
    <div style={{ maxWidth: 480, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", background: "#F7F5F2", position: "relative", overflow: "hidden" }}>
      <GlobalStyles />
      {children}
    </div>
  );

  if (!authedUser) return shell(<AuthGate onAuthenticated={handleAuthenticated} />);

  return shell(<>
    {activeTab === "feed"     && <FeedTab />}
    {activeTab === "discover" && <DiscoverTab myProducts={myProducts} onAddProduct={handleAddProduct} />}
    {activeTab === "cabinet"  && <ProfileTab user={authedUser} products={myProducts} theme={cabinetTheme} onThemeChange={handleThemeChange} onAddProduct={handleAddProduct} onRemoveProduct={handleRemoveProduct} onRepurchaseChange={handleRepurchaseChange} onSignOut={handleSignOut} onUpdateUser={u => setAuthedUser(u)} loading={loadingCabinet} />}
    {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdd={handleAddProduct} />}
    <BottomNav active={activeTab} onChange={setActiveTab} onAddPress={() => setShowAddModal(true)} />
  </>);
}
