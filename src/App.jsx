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

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes popIn {
      0% { transform: scale(0.8); opacity: 0; }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes doorOpen {
      from { transform: perspective(800px) rotateY(-90deg); opacity: 0; }
      to { transform: perspective(800px) rotateY(0deg); opacity: 1; }
    }
    @keyframes cabinetReveal {
      from { opacity: 0; transform: scaleY(0.95); }
      to { opacity: 1; transform: scaleY(1); }
    }
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
  `}</style>
);

// ─── DATA ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "skincare", label: "Skincare", icon: "✦", color: "#C8B8A2" },
  { id: "makeup", label: "Makeup", icon: "◈", color: "#D4A5A5" },
  { id: "haircare", label: "Haircare", icon: "◉", color: "#A5B8C8" },
  { id: "fragrance", label: "Fragrance", icon: "◇", color: "#B8A5C8" },
  { id: "body", label: "Body & Bath", icon: "○", color: "#A5C8B8" },
  { id: "wellness", label: "Wellness", icon: "◎", color: "#C8C4A5" },
];

const CABINET_THEMES = [
  {
    id: "wood",
    label: "Warm Wood",
    shelfBg: "linear-gradient(180deg, #C4956A 0%, #A67C52 60%, #8B6340 100%)",
    shelfShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 2px 3px rgba(255,200,140,0.3)",
    cabinetBg: "linear-gradient(160deg, #2C1810 0%, #3D2314 50%, #2A1508 100%)",
    cabinetBorder: "#1A0D06",
    mirrorBg: "linear-gradient(135deg, #F5ECD7 0%, #EDE0C4 40%, #F0E8D0 100%)",
    edgeBg: "#5C3D1E",
    label: "🪵",
  },
  {
    id: "glass",
    label: "Glass & Chrome",
    shelfBg: "linear-gradient(180deg, rgba(200,220,240,0.6) 0%, rgba(180,205,230,0.4) 60%, rgba(160,190,220,0.5) 100%)",
    shelfShadow: "inset 0 -2px 4px rgba(100,150,200,0.2), 0 1px 0 rgba(255,255,255,0.8)",
    cabinetBg: "linear-gradient(160deg, #B8C8D8 0%, #C5D5E5 50%, #A8BCCF 100%)",
    cabinetBorder: "#8AA0B5",
    mirrorBg: "linear-gradient(135deg, #E8F0F8 0%, #F5F8FC 40%, #EAF2FA 100%)",
    edgeBg: "#9EB5C8",
    label: "🪟",
  },
  {
    id: "maximalist",
    label: "Maximalist",
    shelfBg: "linear-gradient(180deg, #E8A0BF 0%, #D4709A 60%, #C05080 100%)",
    shelfShadow: "inset 0 -3px 6px rgba(100,0,50,0.3), inset 0 2px 3px rgba(255,200,220,0.4)",
    cabinetBg: "linear-gradient(160deg, #2D0A1F 0%, #4A1535 50%, #1F0615 100%)",
    cabinetBorder: "#7A2050",
    mirrorBg: "linear-gradient(135deg, #FFE8F5 0%, #FFD0ED 40%, #FFE5F7 100%)",
    edgeBg: "#8B2060",
    label: "🌸",
  },
  {
    id: "mirror",
    label: "Mirror Cabinet",
    shelfBg: "linear-gradient(180deg, rgba(220,230,240,0.7) 0%, rgba(200,215,230,0.5) 60%, rgba(185,205,225,0.65) 100%)",
    shelfShadow: "inset 0 -2px 4px rgba(80,100,130,0.15), 0 1px 0 rgba(255,255,255,0.9)",
    cabinetBg: "linear-gradient(160deg, #8090A0 0%, #9AAABB 50%, #788898 100%)",
    cabinetBorder: "#607080",
    mirrorBg: "linear-gradient(135deg, #E0E8F0 0%, #EEF4FA 30%, #DDE8F2 60%, #E8F0F8 100%)",
    edgeBg: "#7090A8",
    label: "🪞",
  },
];

const MOCK_PRODUCTS = [
  { id: 1, name: "Laneige Lip Sleeping Mask", brand: "Laneige", category: "skincare", retailer: "Sephora", price: "$24", emoji: "💊", color: "#FFB3C8" },
  { id: 2, name: "Tatcha The Water Cream", brand: "Tatcha", category: "skincare", retailer: "Sephora", price: "$68", emoji: "🧴", color: "#B8D4E8" },
  { id: 3, name: "Charlotte Tilbury Pillow Talk", brand: "Charlotte Tilbury", category: "makeup", retailer: "Sephora", price: "$35", emoji: "💄", color: "#D4A0A0" },
  { id: 4, name: "Olaplex No. 3", brand: "Olaplex", category: "haircare", retailer: "Ulta", price: "$30", emoji: "🧪", color: "#C8B8E8" },
  { id: 5, name: "Sol de Janeiro Brazilian Bum Bum Cream", brand: "Sol de Janeiro", category: "body", retailer: "Sephora", price: "$48", emoji: "🌺", color: "#FFD4A0" },
  { id: 6, name: "Maison Margiela Replica", brand: "Maison Margiela", category: "fragrance", retailer: "Sephora", price: "$165", emoji: "🌸", color: "#E8D4F0" },
  { id: 7, name: "Glow Recipe Watermelon Toner", brand: "Glow Recipe", category: "skincare", retailer: "Sephora", price: "$39", emoji: "🍉", color: "#FFB3C0" },
  { id: 8, name: "Rare Beauty Soft Pinch Blush", brand: "Rare Beauty", category: "makeup", retailer: "Sephora", price: "$23", emoji: "🌷", color: "#FFB8C8" },
  { id: 9, name: "Briogeo Scalp Revival Scrub", brand: "Briogeo", category: "haircare", retailer: "Ulta", price: "$42", emoji: "🫧", color: "#A8D4C0" },
  { id: 10, name: "Nécessaire Body Serum", brand: "Nécessaire", category: "body", retailer: "Sephora", price: "$45", emoji: "✨", color: "#D4E8D0" },
  { id: 11, name: "Le Labo Santal 33", brand: "Le Labo", category: "fragrance", retailer: "Amazon", price: "$220", emoji: "🕯️", color: "#D8C8B0" },
  { id: 12, name: "Ritual Multivitamin", brand: "Ritual", category: "wellness", retailer: "Amazon", price: "$35", emoji: "💛", color: "#FFF0A0" },
];

const SEARCH_DB = [
  ...MOCK_PRODUCTS,
  { id: 13, name: "The Ordinary Niacinamide", brand: "The Ordinary", category: "skincare", retailer: "Ulta", price: "$6", emoji: "💧", color: "#C8D8E8" },
  { id: 14, name: "NARS Orgasm Blush", brand: "NARS", category: "makeup", retailer: "Sephora", price: "$32", emoji: "🍑", color: "#FFD4C0" },
  { id: 15, name: "Dyson Airwrap", brand: "Dyson", category: "haircare", retailer: "Amazon", price: "$599", emoji: "💨", color: "#E0D8F0" },
  { id: 16, name: "Cetaphil Gentle Skin Cleanser", brand: "Cetaphil", category: "skincare", retailer: "Amazon", price: "$14", emoji: "🫙", color: "#E8EEF4" },
  { id: 17, name: "Fenty Beauty Pro Filt'r Foundation", brand: "Fenty Beauty", category: "makeup", retailer: "Sephora", price: "$38", emoji: "🎨", color: "#DEB887" },
  { id: 18, name: "Moroccanoil Treatment", brand: "Moroccanoil", category: "haircare", retailer: "Ulta", price: "$46", emoji: "🥜", color: "#D4B896" },
];

const FEED_POSTS = [
  { id: 1, user: "Sofia Reyes", handle: "@sofiabeauty", avatar: "SR", avatarColor: "#D4A5A5", product: MOCK_PRODUCTS[0], time: "3m ago", likes: 42 },
  { id: 2, user: "Jade Williams", handle: "@jadewglow", avatar: "JW", avatarColor: "#A5C8B8", product: MOCK_PRODUCTS[2], time: "17m ago", likes: 118 },
  { id: 3, user: "Priya Patel", handle: "@priyaglows", avatar: "PP", avatarColor: "#B8A5C8", product: MOCK_PRODUCTS[5], time: "1h ago", likes: 204 },
  { id: 4, user: "Mia Chen", handle: "@miaskincare", avatar: "MC", avatarColor: "#C8B8A2", product: MOCK_PRODUCTS[6], time: "2h ago", likes: 88 },
  { id: 5, user: "Ava Johnson", handle: "@avajbeauty", avatar: "AJ", avatarColor: "#A5B8C8", product: MOCK_PRODUCTS[3], time: "3h ago", likes: 55 },
];

const MOCK_USERS = [
  {
    id: "u1", name: "Sofia Reyes", handle: "@sofiabeauty",
    avatar: "SR", avatarColor: "#D4A5A5",
    bio: "Skincare obsessed · Sephora Rouge · she/her",
    followers: 1240, following: 380,
    cabinetTheme: CABINET_THEMES[2],
    products: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1], MOCK_PRODUCTS[6], MOCK_PRODUCTS[7], MOCK_PRODUCTS[9]],
    posts: [
      { id: "s1", product: MOCK_PRODUCTS[0], time: "3m ago", likes: 42 },
      { id: "s2", product: MOCK_PRODUCTS[6], time: "2d ago", likes: 98 },
    ],
  },
  {
    id: "u2", name: "Jade Williams", handle: "@jadewglow",
    avatar: "JW", avatarColor: "#A5C8B8",
    bio: "Clean beauty convert · Haircare nerd",
    followers: 3870, following: 512,
    cabinetTheme: CABINET_THEMES[1],
    products: [MOCK_PRODUCTS[2], MOCK_PRODUCTS[3], MOCK_PRODUCTS[8], MOCK_PRODUCTS[4]],
    posts: [
      { id: "j1", product: MOCK_PRODUCTS[2], time: "17m ago", likes: 118 },
      { id: "j2", product: MOCK_PRODUCTS[3], time: "5d ago", likes: 74 },
    ],
  },
  {
    id: "u3", name: "Priya Patel", handle: "@priyaglows",
    avatar: "PP", avatarColor: "#B8A5C8",
    bio: "Fragrance collector · Skincare minimalist",
    followers: 892, following: 220,
    cabinetTheme: CABINET_THEMES[3],
    products: [MOCK_PRODUCTS[5], MOCK_PRODUCTS[10], MOCK_PRODUCTS[1], MOCK_PRODUCTS[11]],
    posts: [{ id: "p1", product: MOCK_PRODUCTS[5], time: "1h ago", likes: 204 }],
  },
  {
    id: "u4", name: "Mia Chen", handle: "@miaskincare",
    avatar: "MC", avatarColor: "#C8B8A2",
    bio: "K-beauty enthusiast · 10-step routine advocate",
    followers: 5100, following: 890,
    cabinetTheme: CABINET_THEMES[0],
    products: [MOCK_PRODUCTS[6], MOCK_PRODUCTS[0], MOCK_PRODUCTS[1], MOCK_PRODUCTS[7], MOCK_PRODUCTS[9], MOCK_PRODUCTS[11]],
    posts: [
      { id: "m1", product: MOCK_PRODUCTS[6], time: "2h ago", likes: 88 },
      { id: "m2", product: MOCK_PRODUCTS[0], time: "1w ago", likes: 211 },
    ],
  },
  {
    id: "u5", name: "Ava Johnson", handle: "@avajbeauty",
    avatar: "AJ", avatarColor: "#A5B8C8",
    bio: "Makeup artist · Ulta enthusiast",
    followers: 2340, following: 670,
    cabinetTheme: CABINET_THEMES[2],
    products: [MOCK_PRODUCTS[3], MOCK_PRODUCTS[7], MOCK_PRODUCTS[4], MOCK_PRODUCTS[8]],
    posts: [{ id: "a1", product: MOCK_PRODUCTS[3], time: "3h ago", likes: 55 }],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const retailerColor = (r) => ({ Sephora: "#D4006A", Ulta: "#F0006E", Amazon: "#FF9900" }[r] || "#888");
const retailerBg = (r) => ({ Sephora: "#FFF0F6", Ulta: "#FFF0F8", Amazon: "#FFF8EC" }[r] || "#F5F5F5");

// ─── PRODUCT BOTTLE ──────────────────────────────────────────────────────────

function ProductBottle({ product, size = 64, onClick, showLabel = true }) {
  return (
    <div className="product-slot" onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", position: "relative", width: size + 16 }}>
      <div style={{ width: size, height: size * 1.4, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}99)`, borderRadius: size * 0.18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${product.color}66, inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.1)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "15%", width: "30%", height: "60%", background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)", borderRadius: "50%", transform: "skewX(-10deg)" }} />
        <span style={{ fontSize: size * 0.38, position: "relative", zIndex: 1 }}>{product.emoji}</span>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.15)", padding: "3px 4px", textAlign: "center" }}>
          <span style={{ fontSize: Math.max(7, size * 0.12), fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.9)", fontWeight: 500, letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{product.brand.split(" ")[0].toUpperCase()}</span>
        </div>
      </div>
      {showLabel && (
        <div className="product-label" style={{ fontSize: 10, color: "#555", textAlign: "center", lineHeight: 1.3, maxWidth: size + 16, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontFamily: "'Jost', sans-serif", fontWeight: 400, opacity: 0.85 }}>
          {product.name.length > 22 ? product.name.slice(0, 22) + "…" : product.name}
        </div>
      )}
    </div>
  );
}

// ─── SHELF ROW ───────────────────────────────────────────────────────────────

function ShelfRow({ products, theme, onProductClick, onAddClick, rowIndex }) {
  const slots = [products[0], products[1], products[2]];
  return (
    <div style={{ marginBottom: 0, animationDelay: `${rowIndex * 0.08}s` }} className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", padding: "14px 20px 0", minHeight: 120, background: theme.mirrorBg, position: "relative" }}>
        {(theme.id === "glass" || theme.id === "mirror") && (
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.08) 30px, rgba(255,255,255,0.08) 31px)", pointerEvents: "none" }} />
        )}
        {slots.map((product, i) => (
          <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {product ? (
              <ProductBottle product={product} size={62} onClick={() => onProductClick(product)} />
            ) : (
              <div onClick={onAddClick} style={{ width: 62, height: 87, border: "2px dashed rgba(0,0,0,0.12)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(0,0,0,0.2)", fontSize: 22, transition: "all 0.2s" }}>+</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ height: 14, background: theme.shelfBg, boxShadow: theme.shelfShadow, position: "relative", zIndex: 2 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.35)" }} />
      </div>
    </div>
  );
}

// ─── MEDICINE CABINET ────────────────────────────────────────────────────────

function MedicineCabinet({ products, theme, onProductClick, onAddClick }) {
  const rows = [];
  for (let i = 0; i < Math.max(4, Math.ceil(products.length / 3) + 1); i++) {
    rows.push(products.slice(i * 3, i * 3 + 3));
  }
  return (
    <div className="cabinet-reveal" style={{ background: theme.cabinetBg, border: `6px solid ${theme.cabinetBorder}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)`, margin: "0 16px" }}>
      <div style={{ height: 10, background: theme.edgeBg, borderBottom: `2px solid ${theme.cabinetBorder}` }} />
      <div style={{ overflow: "hidden" }}>
        {rows.map((row, i) => (
          <ShelfRow key={i} products={row} theme={theme} onProductClick={onProductClick} onAddClick={onAddClick} rowIndex={i} />
        ))}
      </div>
      <div style={{ height: 10, background: theme.edgeBg, borderTop: `2px solid ${theme.cabinetBorder}` }} />
    </div>
  );
}

// ─── PRODUCT DETAIL MODAL ────────────────────────────────────────────────────

function ProductModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,20,15,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#FDFAF7", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px", animation: "slideUp 0.38s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
        <div style={{ width: 40, height: 4, background: "#E0DAD2", borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ width: 90, height: 126, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 8px 24px ${product.color}55`, flexShrink: 0, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "15%", width: "30%", height: "55%", background: "linear-gradient(180deg,rgba(255,255,255,0.5),transparent)", borderRadius: "50%", transform: "skewX(-10deg)" }} />
            {product.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.2, marginBottom: 4 }}>{product.name}</div>
            <div style={{ fontSize: 14, color: "#888", fontWeight: 300, marginBottom: 12 }}>{product.brand}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ background: retailerBg(product.retailer), color: retailerColor(product.retailer), fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{product.retailer}</span>
              <span style={{ background: "#F5F0EB", color: "#888", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{product.price}</span>
            </div>
          </div>
        </div>
        <div style={{ background: "#F5F0EB", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>CATEGORY</div>
          <div style={{ fontSize: 15, color: "#555", fontWeight: 400 }}>{CATEGORIES.find(c => c.id === product.category)?.label}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button style={{ background: "#1A1A1A", color: "#FFF", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 500 }}>Shop Now</button>
          <button onClick={onClose} style={{ background: "#F0EDE8", color: "#555", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 400 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD PRODUCT MODAL ───────────────────────────────────────────────────────

function AddProductModal({ onClose, onAdd }) {
  const [mode, setMode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      setResults(SEARCH_DB.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 6));
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const handleAdd = (product) => {
    setAdding(true);
    setTimeout(() => { onAdd(product); onClose(); }, 600);
  };

  const browseProducts = selectedCategory ? SEARCH_DB.filter(p => p.category === selectedCategory) : [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,20,15,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#FDFAF7", borderRadius: "24px 24px 0 0", padding: "24px 20px 48px", animation: "slideUp 0.38s cubic-bezier(0.25,0.46,0.45,0.94)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: "#E0DAD2", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            {mode && <button onClick={() => { setMode(null); setSearchQuery(""); setSelectedCategory(null); }} style={{ background: "none", border: "none", color: "#AAA", fontSize: 13, padding: 0, marginBottom: 2 }}>← back</button>}
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>
              {!mode ? "Add to Cabinet" : mode === "search" ? "Search Products" : mode === "email" ? "Scan Email Receipts" : mode === "barcode" ? "Scan Barcode" : "Browse by Category"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, color: "#888" }}>✕</button>
        </div>

        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { id: "search", icon: "🔍", label: "Search by Name", sub: "Sephora, Ulta, Amazon" },
              { id: "email", icon: "📧", label: "Scan Email", sub: "Find past orders" },
              { id: "barcode", icon: "📷", label: "Scan Barcode", sub: "Point at a product" },
              { id: "browse", icon: "✦", label: "Browse Category", sub: "Explore by type" },
            ].map(m => (
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
            {results.length === 0 && searchQuery.length > 1 && <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 14 }}>No products found</div>}
            {results.map(product => (
              <div key={product.id} className="search-result" onClick={() => handleAdd(product)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 12px", borderRadius: 12, marginBottom: 6, cursor: "pointer", transition: "background 0.15s", border: "1.5px solid #EDE9E3" }}>
                <div style={{ width: 48, height: 66, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{product.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A", marginBottom: 2 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{product.brand} · {product.price}</div>
                </div>
                <span style={{ background: retailerBg(product.retailer), color: retailerColor(product.retailer), fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{product.retailer}</span>
              </div>
            ))}
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
                {browseProducts.map(product => (
                  <div key={product.id} className="search-result" onClick={() => handleAdd(product)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px", borderRadius: 12, marginBottom: 6, cursor: "pointer", border: "1.5px solid #EDE9E3" }}>
                    <div style={{ width: 48, height: 66, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{product.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{product.name}</div>
                      <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{product.brand} · {product.price}</div>
                    </div>
                    <span style={{ background: retailerBg(product.retailer), color: retailerColor(product.retailer), fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>{product.retailer}</span>
                  </div>
                ))}
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
      </div>
    </div>
  );
}

// ─── THEME PICKER ─────────────────────────────────────────────────────────────

function ThemePicker({ current, onSelect, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,20,15,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#FDFAF7", borderRadius: "24px 24px 0 0", padding: "24px 20px 48px", animation: "slideUp 0.38s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
        <div style={{ width: 40, height: 4, background: "#E0DAD2", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A", marginBottom: 20 }}>Cabinet Style</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CABINET_THEMES.map(theme => (
            <button key={theme.id} onClick={() => { onSelect(theme); onClose(); }} style={{ background: theme.cabinetBg, border: current.id === theme.id ? "3px solid #1A1A1A" : "2px solid transparent", borderRadius: 16, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}>
              {current.id === theme.id && <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, background: "#1A1A1A", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#FFF" }}>✓</div>}
              <div style={{ height: 32, background: theme.mirrorBg, borderRadius: 6, display: "flex", alignItems: "flex-end", padding: "4px 8px", gap: 6 }}>
                {["💊","💄","🧴"].map((e,i) => <div key={i} style={{ width: 16, height: 22, background: ["#FFB3C8","#D4A0A0","#B8D4E8"][i], borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{e}</div>)}
              </div>
              <div style={{ height: 6, background: theme.shelfBg, borderRadius: 2 }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", textAlign: "left", fontFamily: "'Jost', sans-serif" }}>{theme.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
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

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────

function ProfileTab({ products, theme, onThemeChange, onAddProduct }) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
      <div style={{ padding: "20px 20px 16px", background: "#FDFAF7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #D4A5A5, #A5B8C8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: "#FFF", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>ME</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>My Cabinet</div>
            <div style={{ fontSize: 12, color: "#AAA", fontFamily: "'DM Mono', monospace" }}>{products.length} products · @myhandle</div>
          </div>
          <button onClick={() => setShowThemePicker(true)} style={{ background: "#F0EDE8", border: "1.5px solid #E5E0D8", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 500, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
            {theme.label} Style
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} style={{ background: cat.color + "33", borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 500, color: "#555", whiteSpace: "nowrap", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
              {cat.label} · {products.filter(p => p.category === cat.id).length}
            </div>
          ))}
        </div>
      </div>
      <MedicineCabinet products={products} theme={theme} onProductClick={setSelectedProduct} onAddClick={() => setShowAddModal(true)} />
      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={() => setShowAddModal(true)} style={{ width: "100%", padding: "16px", background: "#1A1A1A", border: "none", borderRadius: 14, color: "#FFF", fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>＋</span> Add Product to Cabinet
        </button>
      </div>
      {showThemePicker && <ThemePicker current={theme} onSelect={onThemeChange} onClose={() => setShowThemePicker(false)} />}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdd={p => { onAddProduct(p); }} />}
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
  const [tab, setTab] = useState("cabinet");
  const [following, setFollowing] = useState(false);
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
        {tab === "cabinet" && (
          <div>
            <MedicineCabinet products={user.products} theme={user.cabinetTheme} onProductClick={setSelectedProduct} onAddClick={() => {}} />
            <div style={{ padding: "12px 20px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map(cat => {
                  const count = user.products.filter(p => p.category === cat.id).length;
                  if (!count) return null;
                  return <span key={cat.id} style={{ background: cat.color + "33", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#666", fontFamily: "'DM Mono', monospace" }}>{cat.label} · {count}</span>;
                })}
              </div>
            </div>
          </div>
        )}
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
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

// ─── SEARCH TAB ──────────────────────────────────────────────────────────────

function SearchTab() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const inputRef = useRef(null);
  const q = query.toLowerCase().trim();
  const userResults = q.length > 0 ? MOCK_USERS.filter(u => u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q)) : [];
  const productResults = q.length > 0 ? SEARCH_DB.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0, 6) : [];
  const topicResults = q.length > 0 ? CATEGORIES.filter(c => c.label.toLowerCase().includes(q)) : [];
  const hasResults = userResults.length > 0 || productResults.length > 0 || topicResults.length > 0;
  const showPeople = activeFilter === "all" || activeFilter === "people";
  const showProducts = activeFilter === "all" || activeFilter === "products";
  const showTopics = activeFilter === "all" || activeFilter === "topics";

  if (selectedUser) return <UserProfileView user={selectedUser} onBack={() => setSelectedUser(null)} />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 16px 0", background: "#F7F5F2", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#1A1A1A", marginBottom: 14 }}>Search</div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 17, pointerEvents: "none" }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="People, products, topics…" style={{ width: "100%", padding: "13px 40px 13px 44px", background: "#FFF", border: "1.5px solid #EDE9E3", borderRadius: 14, fontSize: 15, color: "#1A1A1A", fontFamily: "'Jost', sans-serif", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#C8B8A2"} onBlur={e => e.target.style.borderColor = "#EDE9E3"} />
          {query.length > 0 && <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "#E5E0D8", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>}
        </div>
        {query.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
            {[{ id: "all", label: "All" }, { id: "people", label: "👤 People" }, { id: "products", label: "✦ Products" }, { id: "topics", label: "◎ Topics" }].map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{ background: activeFilter === f.id ? "#1A1A1A" : "transparent", border: `1.5px solid ${activeFilter === f.id ? "#1A1A1A" : "#DDD"}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 500, color: activeFilter === f.id ? "#FFF" : "#888", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s" }}>{f.label}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 100px" }}>
        {query.length === 0 && (
          <div>
            <div style={{ paddingTop: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 14 }}>SUGGESTED CABINETS</div>
              {MOCK_USERS.map((user, i) => <UserRow key={user.id} user={user} index={i} onTap={() => setSelectedUser(user)} />)}
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 14 }}>BROWSE TOPICS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {CATEGORIES.map(cat => <button key={cat.id} onClick={() => setQuery(cat.label)} style={{ background: cat.color + "28", border: `1.5px solid ${cat.color}66`, borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#555" }}>{cat.icon} {cat.label}</button>)}
              </div>
            </div>
          </div>
        )}
        {query.length > 0 && !hasResults && (
          <div style={{ textAlign: "center", padding: "56px 0", color: "#CCC" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 6 }}>No results for "{query}"</div>
            <div style={{ fontSize: 13, color: "#CCC" }}>Try a product name, brand, or @handle</div>
          </div>
        )}
        {showPeople && userResults.length > 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 12 }}>PEOPLE</div>
            {userResults.map((user, i) => <UserRow key={user.id} user={user} index={i} onTap={() => setSelectedUser(user)} />)}
          </div>
        )}
        {showProducts && productResults.length > 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 12 }}>PRODUCTS</div>
            {productResults.map((product, i) => (
              <div key={product.id} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFF", borderRadius: 14, padding: "12px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <div style={{ width: 44, height: 62, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{product.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{product.brand} · {product.price}</div>
                </div>
                <span style={{ background: retailerBg(product.retailer), color: retailerColor(product.retailer), fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{product.retailer}</span>
              </div>
            ))}
          </div>
        )}
        {showTopics && topicResults.length > 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 12 }}>TOPICS</div>
            {topicResults.map((cat, i) => (
              <div key={cat.id} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFF", borderRadius: 14, padding: "14px 16px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: cat.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A" }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>Browse cabinets with {cat.label.toLowerCase()} products</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 18, color: "#DDD" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, index = 0, onTap }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className="fade-up" onClick={onTap} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF", borderRadius: 16, padding: "13px 14px", marginBottom: 8, border: "1.5px solid #EDE9E3", cursor: "pointer", animationDelay: `${index * 0.06}s`, opacity: 0, transition: "background 0.15s" }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: "#FFF", flexShrink: 0 }}>{user.avatar}</div>
      <div style={{ width: 36, height: 46, borderRadius: 6, overflow: "hidden", border: `2px solid ${user.cabinetTheme.cabinetBorder}`, flexShrink: 0, background: user.cabinetTheme.cabinetBg, display: "flex", flexDirection: "column" }}>
        {[0,1].map(r => (
          <div key={r} style={{ flex: 1, background: user.cabinetTheme.mirrorBg, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "2px" }}>
            {(user.products.slice(r*2, r*2+2)).map((p,i) => <div key={i} style={{ width: 8, height: 12, background: p?.color || "transparent", borderRadius: 2 }} />)}
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

// ─── EXPLORE TAB ─────────────────────────────────────────────────────────────

function ExploreTab() {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100, padding: "20px 16px 100px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>Explore</div>
      <div style={{ fontSize: 13, color: "#AAA", marginBottom: 20 }}>Discover what's trending in cabinets</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#BBB", letterSpacing: "0.1em", marginBottom: 12 }}>TRENDING PRODUCTS</div>
      {MOCK_PRODUCTS.slice(0, 6).map((product, i) => (
        <div key={product.id} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFF", borderRadius: 16, padding: "14px", marginBottom: 10, border: "1.5px solid #EDE9E3", animationDelay: `${i * 0.06}s`, opacity: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: "#DDD", width: 28, textAlign: "center", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</div>
          <div style={{ width: 48, height: 66, background: `linear-gradient(145deg, ${product.color}FF, ${product.color}88)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{product.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{product.name}</div>
            <div style={{ fontSize: 11, color: "#AAA", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{product.brand} · {product.price}</div>
          </div>
          <button style={{ background: "#F0EDE8", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "#666", fontWeight: 500 }}>+ Add</button>
        </div>
      ))}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

function BottomNav({ active, onChange, onAddPress }) {
  const LEFT_TABS  = [{ id: "feed", icon: "⚡", label: "Feed" }, { id: "search", icon: "🔍", label: "Search" }];
  const RIGHT_TABS = [{ id: "explore", icon: "✦", label: "Explore" }, { id: "cabinet", icon: "🪞", label: "Cabinet" }];

  const NavTab = ({ tab }) => (
    <button className={`tab-btn ${active === tab.id ? "active" : ""}`} onClick={() => onChange(tab.id)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", position: "relative" }}>
      {active === tab.id && <div style={{ position: "absolute", top: -10, width: 24, height: 2, background: "#1A1A1A", borderRadius: "0 0 2px 2px" }} />}
      <span style={{ fontSize: 19 }}>{tab.icon}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.05em", color: active === tab.id ? "#1A1A1A" : "#CCC", transition: "color 0.2s" }}>{tab.label}</span>
    </button>
  );

  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(253,250,247,0.96)", backdropFilter: "blur(16px)", borderTop: "1px solid #EDE9E3", display: "flex", alignItems: "center", padding: "10px 0 24px", zIndex: 50 }}>
      {LEFT_TABS.map(tab => <NavTab key={tab.id} tab={tab} />)}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <button onClick={onAddPress} style={{ width: 52, height: 52, background: "#1A1A1A", border: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(26,26,26,0.22)", cursor: "pointer", marginBottom: 2, transition: "transform 0.15s ease, box-shadow 0.15s ease" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"} onTouchStart={e => e.currentTarget.style.transform = "scale(0.92)"} onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
          <span style={{ fontSize: 26, color: "#FFF", lineHeight: 1, marginTop: -1 }}>+</span>
        </button>
      </div>
      {RIGHT_TABS.map(tab => <NavTab key={tab.id} tab={tab} />)}
    </div>
  );
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
    <button onClick={onClick} disabled={disabled || loading} style={{ width: "100%", padding: "15px", background: secondary ? "transparent" : (disabled || loading) ? "#C8BFB5" : "#1A1A1A", border: secondary ? "1.5px solid #E5E0D8" : "none", borderRadius: 14, fontSize: 15, fontWeight: 600, color: secondary ? "#888" : "#FFF", cursor: (disabled || loading) ? "default" : "pointer", fontFamily: "'Jost', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      {loading ? <span style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : label}
    </button>
  );
}

// ── Splash ───────────────────────────────────────────────────────────────────
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

// ── Sign Up (3-step) — REAL SUPABASE AUTH ────────────────────────────────────
function SignUpScreen({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, display_name: name } },
        });

        if (error) {
          setErrors({ name: error.message.includes("already registered") ? "This email is already registered. Try signing in." : error.message });
          setLoading(false);
          return;
        }

        if (data.user) {
          await supabase.from("profiles").update({ display_name: name, username: handle }).eq("id", data.user.id);
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
        {step === 1 && (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>What's your email?</div>
            <div style={{ fontSize: 14, color: "#AAA", marginBottom: 28 }}>You'll use this to sign in and verify your account.</div>
            <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} autoFocus />
          </>
        )}
        {step === 2 && (
          <>
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
          </>
        )}
        {step === 3 && (
          <>
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
          </>
        )}
        <div style={{ marginTop: "auto", paddingBottom: 40 }}>
          <AuthBtn label={step < 3 ? "Continue →" : "Create my cabinet"} onClick={next} loading={loading} />
          {step > 1 && <button onClick={() => { setStep(s => s-1); setErrors({}); }} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "#AAA", fontSize: 14, marginTop: 8, cursor: "pointer" }}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ── Sign In — REAL SUPABASE AUTH ─────────────────────────────────────────────
function SignInScreen({ onBack, onSuccess, onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrors({ password: "Incorrect email or password" });
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({ email: "Please verify your email first — check your inbox" });
        } else {
          setErrors({ password: error.message });
        }
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("display_name, username, avatar_url").eq("id", data.user.id).single();
      setLoading(false);
      onSuccess({ id: data.user.id, email: data.user.email, name: profile?.display_name || data.user.email, handle: profile?.username ? "@" + profile.username : "@user" });
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
            <div style={{ flex: 1, height: 1, background: "#E5E0D8" }} />
            <span style={{ fontSize: 11, color: "#CCC", fontFamily: "'DM Mono', monospace" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#E5E0D8" }} />
          </div>
          <button onClick={onBack} style={{ width: "100%", padding: "14px", background: "none", border: "1.5px solid #E5E0D8", borderRadius: 14, fontSize: 14, color: "#888", cursor: "pointer" }}>Create a new account</button>
        </div>
      </div>
    </div>
  );
}

// ── Forgot Password ───────────────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Enter a valid email address"); return; }
    setError(""); setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease" }}>
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#F0EDE8", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: "#666" }}>←</button>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1A1A1A" }}>Reset password</div>
      </div>
      <div style={{ flex: 1, padding: "40px 24px 0", display: "flex", flexDirection: "column" }}>
        {!sent ? (
          <>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>Forgot your password?</div>
            <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, marginBottom: 36 }}>Enter your email and we'll send you a reset link.</div>
            <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={error} autoFocus />
            <div style={{ marginTop: "auto", paddingBottom: 40 }}><AuthBtn label="Send reset link" onClick={submit} loading={loading} /></div>
          </>
        ) : (
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

// ── Email Verification ────────────────────────────────────────────────────────
function VerifyEmailScreen({ user, onVerified }) {
  const [code, setCode] = useState(["","","","","",""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  const handleDigit = (val, i) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g,"").slice(0,6).split("");
      const next = ["","","","","",""].map((_,j) => digits[j] || "");
      setCode(next);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    const digit = val.replace(/\D/g,"").slice(-1);
    const next = [...code]; next[i] = digit;
    setCode(next);
    if (digit && i < 5) inputRefs.current[i+1]?.focus();
  };

  const handleKey = (e, i) => { if (e.key === "Backspace" && !code[i] && i > 0) inputRefs.current[i-1]?.focus(); };

  const submit = async () => {
    const token = code.join("");
    if (token.length < 6) { setError("Enter the full 6-digit code"); return; }
    setError(""); setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: user?.email, token, type: "signup" });
    if (verifyError) {
      setError("Invalid or expired code. Try resending.");
      setLoading(false);
      return;
    }
    setLoading(false);
    onVerified();
  };

  const resend = async () => {
    await supabase.auth.resend({ type: "signup", email: user?.email });
    setResent(true);
    setTimeout(() => setResent(false), 4000);
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
        <button onClick={resend} style={{ background: "none", border: "none", color: resent ? "#7EC8A0" : "#C8B8A2", fontSize: 13, textAlign: "center", cursor: "pointer", marginBottom: 36 }}>
          {resent ? "✓ Code resent!" : "Didn't get it? Resend code"}
        </button>
        <div style={{ marginTop: "auto", paddingBottom: 48 }}>
          <AuthBtn label="Verify →" onClick={submit} loading={loading} disabled={code.join("").length < 6} />
        </div>
      </div>
    </div>
  );
}

// ── Onboarding ───────────────────────────────────────────────────────────────
function OnboardingScreen({ user, onComplete }) {
  const [selectedTheme, setSelectedTheme] = useState(CABINET_THEMES[0].id);
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    const theme = CABINET_THEMES.find(t => t.id === selectedTheme);
    if (user?.id) {
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    }
    setLoading(false);
    onComplete(theme);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F5F2", animation: "fadeUp 0.4s ease", overflowY: "auto" }}>
      <div style={{ padding: "48px 24px 0", flex: 1 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C8B8A2", letterSpacing: "0.15em", marginBottom: 10 }}>ALMOST THERE</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.15, marginBottom: 8 }}>Choose your style{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</div>
        <div style={{ fontSize: 14, color: "#AAA", lineHeight: 1.6, marginBottom: 36 }}>You can always change this later from your cabinet.</div>
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

// ── Auth Gate — WITH SESSION PERSISTENCE ─────────────────────────────────────
function AuthGate({ onAuthenticated }) {
  const [screen, setScreen] = useState("splash");
  const [pendingUser, setPendingUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from("profiles").select("display_name, username, avatar_url").eq("id", session.user.id).single()
          .then(({ data: profile }) => {
            onAuthenticated({
              id: session.user.id,
              email: session.user.email,
              name: profile?.display_name || session.user.email,
              handle: profile?.username ? "@" + profile.username : "@user",
            });
          });
      } else {
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F0D0B" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 600, color: "#FDFAF7", letterSpacing: "-0.02em" }}>
          cabinet<span style={{ color: "#C8B8A2", fontStyle: "italic" }}>.</span>
        </div>
      </div>
    );
  }

  if (screen === "splash")     return <SplashScreen onSignIn={() => setScreen("signin")} onSignUp={() => setScreen("signup")} />;
  if (screen === "signin")     return <SignInScreen onBack={() => setScreen("splash")} onForgot={() => setScreen("forgot")} onSuccess={user => onAuthenticated(user)} />;
  if (screen === "signup")     return <SignUpScreen onBack={() => setScreen("splash")} onSuccess={user => { setPendingUser(user); setScreen("verify"); }} />;
  if (screen === "forgot")     return <ForgotPasswordScreen onBack={() => setScreen("signin")} />;
  if (screen === "verify")     return <VerifyEmailScreen user={pendingUser} onVerified={() => setScreen("onboarding")} />;
  if (screen === "onboarding") return <OnboardingScreen user={pendingUser} onComplete={theme => onAuthenticated({ ...pendingUser, cabinetTheme: theme })} />;
  return null;
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [authedUser, setAuthedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [cabinetTheme, setCabinetTheme] = useState(CABINET_THEMES[0]);
  const [myProducts, setMyProducts] = useState(MOCK_PRODUCTS.slice(0, 7));
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAuthenticated = (user) => {
    if (user.cabinetTheme) setCabinetTheme(user.cabinetTheme);
    setAuthedUser(user);
  };

  const handleAddProduct = (product) => {
    setMyProducts(prev => prev.find(p => p.id === product.id) ? prev : [...prev, product]);
  };

  const shell = (children) => (
    <div style={{ maxWidth: 480, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", background: "#F7F5F2", position: "relative", overflow: "hidden" }}>
      <GlobalStyles />
      {children}
    </div>
  );

  if (!authedUser) return shell(<AuthGate onAuthenticated={handleAuthenticated} />);

  return shell(<>
    {activeTab === "feed"    && <FeedTab />}
    {activeTab === "search"  && <SearchTab />}
    {activeTab === "explore" && <ExploreTab />}
    {activeTab === "cabinet" && <ProfileTab products={myProducts} theme={cabinetTheme} onThemeChange={setCabinetTheme} onAddProduct={handleAddProduct} />}
    {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdd={handleAddProduct} />}
    <BottomNav active={activeTab} onChange={setActiveTab} onAddPress={() => setShowAddModal(true)} />
  </>);
}
