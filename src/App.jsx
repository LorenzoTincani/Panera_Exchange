import { useState, useEffect, useCallback } from "react";

const S = window.storage;
const dbGet = async (k) => { try { const r = await S.get(k, true); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const dbSet = async (k, v) => { try { await S.set(k, JSON.stringify(v), true); } catch {} };
const uid = () => Math.random().toString(36).slice(2, 10);
const timeAgo = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "adesso";
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
};

const ITEMS = [
  { name: "Diamante", e: "💎", cat: "Risorse" },
  { name: "Lingotto di ferro", e: "🔩", cat: "Risorse" },
  { name: "Lingotto d'oro", e: "🟡", cat: "Risorse" },
  { name: "Smeraldo", e: "💚", cat: "Risorse" },
  { name: "Netherite Ingot", e: "⬛", cat: "Risorse" },
  { name: "Carbone", e: "🪨", cat: "Risorse" },
  { name: "Redstone", e: "🔴", cat: "Risorse" },
  { name: "Lapislazzulo", e: "🔵", cat: "Risorse" },
  { name: "Legno", e: "🪵", cat: "Blocchi" },
  { name: "Pietra", e: "🧱", cat: "Blocchi" },
  { name: "Ossidiana", e: "🟣", cat: "Blocchi" },
  { name: "Quartz", e: "⬜", cat: "Blocchi" },
  { name: "Spada di diamante", e: "⚔️", cat: "Armi" },
  { name: "Spada di ferro", e: "🗡️", cat: "Armi" },
  { name: "Arco", e: "🏹", cat: "Armi" },
  { name: "Balestra", e: "🎯", cat: "Armi" },
  { name: "Piccone di diamante", e: "⛏️", cat: "Strumenti" },
  { name: "Piccone di ferro", e: "🔨", cat: "Strumenti" },
  { name: "Ascia di diamante", e: "🪓", cat: "Strumenti" },
  { name: "Pala", e: "🥄", cat: "Strumenti" },
  { name: "Elmo di diamante", e: "⛑️", cat: "Armature" },
  { name: "Pettorina di diamante", e: "🛡️", cat: "Armature" },
  { name: "Set armatura diamante", e: "🦺", cat: "Armature" },
  { name: "Pane", e: "🍞", cat: "Cibo" },
  { name: "Mela d'oro", e: "🍎", cat: "Cibo" },
  { name: "Mela d'oro incantata", e: "✨", cat: "Cibo" },
  { name: "Steak", e: "🥩", cat: "Cibo" },
  { name: "Pozione di forza", e: "🧪", cat: "Pozioni" },
  { name: "Pozione di velocità", e: "💨", cat: "Pozioni" },
  { name: "Pozione di rigenerazione", e: "💖", cat: "Pozioni" },
  { name: "Perla dell'ender", e: "🫧", cat: "Magia" },
  { name: "Occhio dell'ender", e: "👁️", cat: "Magia" },
  { name: "Blaze Rod", e: "🔥", cat: "Mob Drops" },
  { name: "Slimeball", e: "🟢", cat: "Mob Drops" },
  { name: "Gunpowder", e: "💣", cat: "Mob Drops" },
  { name: "Altro (specifica)", e: "📦", cat: "Varie" },
];
const CATS = ["Tutti", ...new Set(ITEMS.map((i) => i.cat))];

const T = {
  bg: "#1a1a1a", panel: "#2d2d2d", panelHi: "#383838",
  border: "#444", borderHi: "#666",
  green: "#4e9a4e", greenHi: "#62b862",
  gold: "#ffd700", goldDim: "#b8960a",
  red: "#b04040", redHi: "#c85050",
  blue: "#4a9ebb", text: "#e8e8e8", dim: "#888", dimHi: "#aaa",
};

const cs = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#1a1a1a}
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:#1a1a1a}
  ::-webkit-scrollbar-thumb{background:#444}
  input::placeholder,textarea::placeholder{color:#555}
  input,select,textarea{outline:none;font-family:inherit}
  button{font-family:inherit;cursor:pointer}
  select option{background:#2d2d2d;color:#e8e8e8}
`;

const inp = { width: "100%", padding: "10px 12px", background: "#141414", border: `2px solid ${T.border}`, borderRadius: 4, color: T.text, fontFamily: "monospace", fontSize: 14 };
const lbl = { display: "block", color: T.dim, fontSize: 12, marginBottom: 6 };

export default function App() {
  const [user, setUser] = useState(null); // { username, balance }
  const [tab, setTab] = useState("market");
  const [listings, setListings] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadAll = useCallback(async () => {
    const [l, t] = await Promise.all([dbGet("pe_listings"), dbGet("pe_txns")]);
    setListings(l || []);
    setTxns(t || []);
  }, []);

  useEffect(() => {
    (async () => { await loadAll(); setLoading(false); })();
  }, [loadAll]);

  // Refresh user balance from storage
  const refreshUser = useCallback(async (username) => {
    const users = await dbGet("pe_users") || {};
    if (users[username]) setUser({ username, balance: users[username].balance });
  }, []);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!user) return;
    const id = setInterval(async () => {
      await loadAll();
      await refreshUser(user.username);
    }, 15000);
    return () => clearInterval(id);
  }, [user, loadAll, refreshUser]);

  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const setL = async (v) => { setListings(v); await dbSet("pe_listings", v); };
  const setT = async (v) => { setTxns(v); await dbSet("pe_txns", v); };

  const handleLogin = async (username, newBalance) => {
    setUser({ username, balance: newBalance });
    await loadAll();
  };

  const handleBuy = async (listing) => {
    if (!user) return;
    if (user.balance < listing.price) { notify("🪙 Monete insufficienti!", "err"); return; }
    if (listing.seller === user.username) { notify("Non puoi comprare il tuo stesso annuncio", "err"); return; }

    const users = await dbGet("pe_users") || {};
    const buyer = users[user.username];
    const seller = users[listing.seller];
    if (!buyer || !seller) { notify("Errore: account non trovato", "err"); return; }
    if (buyer.balance < listing.price) { notify("🪙 Monete insufficienti!", "err"); return; }

    // Transfer
    buyer.balance -= listing.price;
    seller.balance += listing.price;
    users[user.username] = buyer;
    users[listing.seller] = seller;
    await dbSet("pe_users", users);

    // Update listing
    const newListings = listings.map((l) => l.id === listing.id ? { ...l, status: "sold", buyer: user.username } : l);
    await setL(newListings);

    // Record transaction
    const tx = { id: uid(), from: user.username, to: listing.seller, amount: listing.price, item: listing.item, emoji: listing.emoji, listingId: listing.id, ts: Date.now() };
    const newTxns = [tx, ...txns];
    await setT(newTxns);

    setUser({ username: user.username, balance: buyer.balance });
    notify(`✅ Acquistato ${listing.item}!`);
  };

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.green, fontFamily: "monospace", fontSize: 16 }}>
      <style>{cs}</style>⛏️ Caricamento mercato...
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const tabs = [
    { k: "market", label: "🏪 Mercato" },
    { k: "sell", label: "📦 Vendi" },
    { k: "mine", label: "🏷️ Annunci" },
    { k: "wallet", label: "👛 Portafoglio" },
  ];

  const props = { user, listings, txns, setL, setT, notify, handleBuy, loadAll, refreshUser };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "monospace" }}>
      <style>{cs}</style>

      {/* Header */}
      <div style={{ background: T.panel, borderBottom: `3px solid ${T.green}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green }}>⛏️ Panera Exchange</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12 }}>👤 <span style={{ color: T.gold }}>{user.username}</span></span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: T.gold }}>{user.balance.toLocaleString()} 🪙</span>
          <button onClick={() => setUser(null)} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.dim, fontSize: 11 }}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: T.panel, borderBottom: `2px solid ${T.border}`, display: "flex", position: "sticky", top: 41, zIndex: 49 }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            flex: 1, padding: "10px 4px", background: tab === t.k ? T.panelHi : "transparent",
            border: "none", borderBottom: tab === t.k ? `3px solid ${T.green}` : "3px solid transparent",
            color: tab === t.k ? T.text : T.dim, fontSize: 11, transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "err" ? T.red : T.green,
          color: "#fff", padding: "10px 20px", borderRadius: 4,
          zIndex: 999, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.5)", whiteSpace: "nowrap"
        }}>{toast.msg}</div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 12px 32px" }}>
        {tab === "market" && <MarketTab {...props} />}
        {tab === "sell" && <SellTab {...props} onDone={() => setTab("market")} />}
        {tab === "mine" && <MineTab {...props} />}
        {tab === "wallet" && <WalletTab {...props} />}
      </div>
    </div>
  );
}

// ── Login / Register ───────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const u = username.trim();
    const p = password.trim();
    if (u.length < 2) { setErr("Username troppo corto (min 2 caratteri)"); return; }
    if (p.length < 3) { setErr("Password troppo corta (min 3 caratteri)"); return; }
    setLoading(true); setErr("");

    const users = await dbGet("pe_users") || {};

    if (users[u]) {
      // Login
      if (users[u].password !== p) { setErr("Password errata"); setLoading(false); return; }
      onLogin(u, users[u].balance);
    } else {
      // Register
      users[u] = { password: p, balance: 10000, createdAt: Date.now() };
      await dbSet("pe_users", users);
      onLogin(u, 10000);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{cs}</style>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: T.green, lineHeight: 1.8, marginBottom: 10 }}>⛏️ Panera Exchange</div>
        <div style={{ color: T.dim, fontSize: 13 }}>Borsa valori del server</div>
      </div>

      <div style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 6, padding: 28, width: "100%", maxWidth: 340 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Username Minecraft</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="es. Steve" autoFocus style={inp} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            placeholder="min 3 caratteri" style={inp} />
        </div>
        {err && <div style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 14 }}>⚠️ {err}</div>}
        <button onClick={handle} disabled={loading} style={{
          width: "100%", padding: 13, background: T.green, border: "none", borderRadius: 4, color: "#fff",
          fontFamily: "'Press Start 2P', monospace", fontSize: 9, letterSpacing: 1,
          opacity: loading ? 0.6 : 1,
        }}>{loading ? "..." : "ENTRA / REGISTRATI"}</button>
        <div style={{ marginTop: 16, color: T.dim, fontSize: 11, lineHeight: 1.8 }}>
          Se è il tuo primo accesso, l'account viene creato automaticamente con <span style={{ color: T.gold }}>10.000 🪙</span>
        </div>
      </div>
    </div>
  );
}

// ── Market Tab ─────────────────────────────────────────────────────────────
function MarketTab({ user, listings, handleBuy, loadAll, refreshUser }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tutti");
  const [confirm, setConfirm] = useState(null);
  const [buying, setBuying] = useState(false);

  const active = listings.filter((l) => l.status === "active");
  const filtered = active.filter((l) =>
    (cat === "Tutti" || l.cat === cat) &&
    (!search || l.item.toLowerCase().includes(search.toLowerCase()) || l.seller.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.ts - a.ts);

  const doBuy = async () => {
    setBuying(true);
    await handleBuy(confirm);
    setConfirm(null);
    setBuying(false);
    await loadAll();
    await refreshUser(user.username);
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cerca oggetto o venditore…"
          style={{ ...inp, flex: 1 }} />
        <button onClick={async () => { await loadAll(); await refreshUser(user.username); }}
          style={{ padding: "10px 14px", background: T.panelHi, border: `2px solid ${T.border}`, borderRadius: 4, color: T.dimHi, fontSize: 14 }}>↻</button>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "5px 12px", background: cat === c ? T.green : T.panel,
            border: `1px solid ${cat === c ? T.green : T.border}`, borderRadius: 20,
            color: cat === c ? "#fff" : T.dim, fontSize: 11, whiteSpace: "nowrap",
          }}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: T.dim }}>😕 Nessun annuncio trovato</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((l) => {
            const isOwn = l.seller === user.username;
            const canAfford = user.balance >= l.price;
            return (
              <div key={l.id} style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 4, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{l.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{l.item}</div>
                      <div style={{ color: T.dim, fontSize: 11 }}>Qtà: {l.qty} · 👤 {l.seller} · {timeAgo(l.ts)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <div>
                      <div style={{ color: T.gold, fontFamily: "'Press Start 2P', monospace", fontSize: 11 }}>{l.price.toLocaleString()}</div>
                      <div style={{ color: T.goldDim, fontSize: 10 }}>🪙 monete</div>
                    </div>
                    {isOwn ? (
                      <span style={{ fontSize: 11, color: T.dim }}>tuo annuncio</span>
                    ) : (
                      <button onClick={() => setConfirm(l)} style={{
                        padding: "7px 16px", background: canAfford ? T.green : "#333",
                        border: "none", borderRadius: 4, color: canAfford ? "#fff" : T.dim,
                        fontSize: 13, fontWeight: "bold",
                      }}>
                        {canAfford ? "🛒 Buy" : "💸 N/A"}
                      </button>
                    )}
                  </div>
                </div>
                {l.desc && <div style={{ marginTop: 8, fontSize: 12, color: T.dimHi, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>{l.desc}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div style={{ background: T.panel, border: `2px solid ${T.green}`, borderRadius: 6, padding: 28, width: "100%", maxWidth: 380 }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{confirm.emoji}</div>
              <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>{confirm.item}</div>
              <div style={{ color: T.dim, fontSize: 12 }}>Venditore: <span style={{ color: T.gold }}>{confirm.seller}</span> · Qtà: {confirm.qty}</div>
            </div>
            <div style={{ background: "#141414", borderRadius: 4, padding: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: T.dim, fontSize: 13 }}>Prezzo</span>
                <span style={{ color: T.gold, fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{confirm.price.toLocaleString()} 🪙</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.dim, fontSize: 13 }}>Il tuo saldo</span>
                <span style={{ color: user.balance >= confirm.price ? T.text : T.red, fontSize: 13 }}>{user.balance.toLocaleString()} 🪙</span>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.dim, fontSize: 13 }}>Dopo l'acquisto</span>
                <span style={{ color: T.gold, fontSize: 13 }}>{(user.balance - confirm.price).toLocaleString()} 🪙</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: 12, background: T.panelHi, border: `1px solid ${T.border}`, borderRadius: 4, color: T.dim, fontSize: 13 }}>Annulla</button>
              <button onClick={doBuy} disabled={buying} style={{ flex: 2, padding: 12, background: T.green, border: "none", borderRadius: 4, color: "#fff", fontSize: 14, fontWeight: "bold", opacity: buying ? 0.6 : 1 }}>
                {buying ? "..." : "✅ Conferma acquisto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sell Tab ───────────────────────────────────────────────────────────────
function SellTab({ user, listings, setL, notify, onDone }) {
  const [item, setItem] = useState(ITEMS[0]);
  const [custom, setCustom] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  const submit = async () => {
    const p = Number(price);
    if (!p || p <= 0) { notify("Inserisci un prezzo valido", "err"); return; }
    const finalName = item.name === "Altro (specifica)" && custom.trim() ? custom.trim() : item.name;
    await setL([...listings, { id: uid(), seller: user.username, item: finalName, emoji: item.e, cat: item.cat, qty: Number(qty), price: p, desc: desc.trim(), ts: Date.now(), status: "active" }]);
    notify("✅ Annuncio pubblicato!");
    setPrice(""); setDesc(""); setQty(1); setCustom(""); setItem(ITEMS[0]);
    onDone();
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>📦 Nuovo Annuncio</div>
      <div style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={lbl}>Oggetto</label>
          <select value={item.name} onChange={(e) => setItem(ITEMS.find((i) => i.name === e.target.value))} style={inp}>
            {ITEMS.map((i) => <option key={i.name} value={i.name}>{i.e} {i.name}</option>)}
          </select>
        </div>
        {item.name === "Altro (specifica)" && (
          <div>
            <label style={lbl}>Nome oggetto personalizzato</label>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Es. Mending Book, Elytra…" style={inp} />
          </div>
        )}
        <div style={{ background: "#141414", borderRadius: 4, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 30 }}>{item.e}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: "bold" }}>{custom || item.name}</div>
            <div style={{ fontSize: 11, color: T.dim }}>Categoria: {item.cat}</div>
          </div>
        </div>
        <div>
          <label style={lbl}>Quantità</label>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Prezzo (monete) 🪙</label>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Es. 500" style={{ ...inp, color: T.gold }} />
        </div>
        <div>
          <label style={lbl}>Note (opzionale)</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Es. incantamenti, condizioni, consegna in chest…" style={{ ...inp, resize: "vertical", minHeight: 80 }} />
        </div>
        <button onClick={submit} style={{ padding: 14, background: T.green, border: "none", borderRadius: 4, color: "#fff", fontFamily: "'Press Start 2P', monospace", fontSize: 9, letterSpacing: 1 }}>
          🚀 PUBBLICA ANNUNCIO
        </button>
      </div>
    </div>
  );
}

// ── My Listings Tab ────────────────────────────────────────────────────────
function MineTab({ user, listings, setL, notify }) {
  const mine = listings.filter((l) => l.seller === user.username).sort((a, b) => b.ts - a.ts);

  const cancel = async (id) => {
    await setL(listings.map((l) => l.id === id ? { ...l, status: "cancelled" } : l));
    notify("Annuncio cancellato");
  };

  const statusColors = { active: T.border, sold: T.goldDim, cancelled: "#444" };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>🏷️ I Miei Annunci</div>
      {mine.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: T.dim }}>Non hai ancora pubblicato annunci</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mine.map((l) => (
            <div key={l.id} style={{ background: T.panel, border: `2px solid ${statusColors[l.status] || T.border}`, borderRadius: 4, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{l.emoji}</span>
                  <div>
                    <div style={{ fontWeight: "bold", marginBottom: 2 }}>{l.item}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>Qtà: {l.qty} · <span style={{ color: T.gold }}>{l.price.toLocaleString()} 🪙</span> · {timeAgo(l.ts)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {l.status === "active" && <span style={{ padding: "3px 10px", background: "#1a3a1a", border: `1px solid ${T.green}`, borderRadius: 12, color: T.green, fontSize: 11 }}>Attivo</span>}
                  {l.status === "sold" && <span style={{ padding: "3px 10px", background: "#2a2a0a", border: `1px solid ${T.goldDim}`, borderRadius: 12, color: T.gold, fontSize: 11 }}>Venduto</span>}
                  {l.status === "cancelled" && <span style={{ padding: "3px 10px", background: "#222", border: "1px solid #555", borderRadius: 12, color: T.dim, fontSize: 11 }}>Cancellato</span>}
                  {l.status === "active" && (
                    <button onClick={() => cancel(l.id)} style={{ padding: "4px 10px", background: T.red, border: "none", borderRadius: 4, color: "#fff", fontSize: 12 }}>✕</button>
                  )}
                </div>
              </div>
              {l.status === "sold" && l.buyer && (
                <div style={{ marginTop: 10, background: "#1a3a1a", borderRadius: 4, padding: 10, fontSize: 12, color: "#80ff80" }}>
                  ✅ Venduto a <strong>{l.buyer}</strong> per <strong style={{ color: T.gold }}>{l.price.toLocaleString()} 🪙</strong> — consegna l'oggetto in gioco!
                </div>
              )}
              {l.desc && <div style={{ marginTop: 8, fontSize: 11, color: T.dim, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>{l.desc}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wallet Tab ─────────────────────────────────────────────────────────────
function WalletTab({ user, txns }) {
  const myTxns = txns.filter((t) => t.from === user.username || t.to === user.username);

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>👛 Portafoglio</div>

      <div style={{ background: T.panel, border: `2px solid ${T.goldDim}`, borderRadius: 6, padding: 24, textAlign: "center", marginBottom: 24 }}>
        <div style={{ color: T.dim, fontSize: 12, marginBottom: 8 }}>Saldo attuale</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: T.gold }}>{user.balance.toLocaleString()}</div>
        <div style={{ color: T.goldDim, fontSize: 13, marginTop: 4 }}>🪙 monete</div>
      </div>

      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: T.dim, marginBottom: 12 }}>STORICO TRANSAZIONI</div>

      {myTxns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: T.dim }}>Nessuna transazione ancora</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {myTxns.map((t) => {
            const isIncoming = t.to === user.username;
            return (
              <div key={t.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 4, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>{t.item}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>
                      {isIncoming ? `da ${t.from}` : `a ${t.to}`} · {timeAgo(t.ts)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: isIncoming ? T.green : T.red }}>
                    {isIncoming ? "+" : "-"}{t.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: T.dim }}>🪙</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
