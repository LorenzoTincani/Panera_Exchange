import { useState, useEffect } from "react";

const S = window.storage;
const dbGet = async (k) => { try { const r = await S.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } };
const dbSet = async (k, v) => { try { await S.set(k, JSON.stringify(v)); } catch {} };
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

const cs = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#1a1a1a}
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:#1a1a1a}
  ::-webkit-scrollbar-thumb{background:#444}
  input::placeholder,textarea::placeholder{color:#666}
  input,select,textarea{outline:none;font-family:inherit}
  button{font-family:inherit;cursor:pointer}
  select option{background:#2d2d2d;color:#e8e8e8}
`;

const T = {
  bg: "#1a1a1a", panel: "#2d2d2d", panelHi: "#383838",
  border: "#444", borderHi: "#666",
  green: "#4e9a4e", greenHi: "#62b862",
  gold: "#ffd700", goldDim: "#b8960a",
  red: "#b04040", redHi: "#c85050",
  blue: "#4a9ebb", text: "#e8e8e8", dim: "#888", dimHi: "#aaa",
};

const badge = (status) => {
  const m = {
    active: { l: "Attivo", bg: "#1a3a1a", c: "#62b862", b: "#4e9a4e" },
    sold: { l: "Venduto", bg: "#2a2a0a", c: T.gold, b: T.goldDim },
    cancelled: { l: "Cancellato", bg: "#2a2a2a", c: T.dim, b: "#555" },
    pending: { l: "In attesa", bg: "#0a2030", c: T.blue, b: "#2a6080" },
    accepted: { l: "Accettata", bg: "#1a3a1a", c: "#62b862", b: "#4e9a4e" },
    rejected: { l: "Rifiutata", bg: "#2a1010", c: T.red, b: "#803030" },
    cancelled_offer: { l: "Annullata", bg: "#2a2a2a", c: T.dim, b: "#555" },
  };
  const s = m[status] || m.cancelled;
  return (
    <span style={{ padding: "3px 10px", background: s.bg, border: `1px solid ${s.b}`, borderRadius: 12, color: s.c, fontSize: 11, whiteSpace: "nowrap" }}>
      {s.l}
    </span>
  );
};

const inp = { width: "100%", padding: "10px 12px", background: "#141414", border: `2px solid ${T.border}`, borderRadius: 4, color: T.text, fontFamily: "monospace", fontSize: 14 };
const lbl = { display: "block", color: T.dim, fontSize: 12, marginBottom: 6 };

export default function App() {
  const [user, setUser] = useState("");
  const [tab, setTab] = useState("market");
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      setListings((await dbGet("mc2_listings")) || []);
      setOffers((await dbGet("mc2_offers")) || []);
      setLoading(false);
    })();
  }, []);

  const notify = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setL = async (v) => { setListings(v); await dbSet("mc2_listings", v); };
  const setO = async (v) => { setOffers(v); await dbSet("mc2_offers", v); };

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.green, fontFamily: "monospace", fontSize: 16 }}>
      <style>{cs}</style>
      ⛏️ Caricamento mercato...
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;

  const props = { user, listings, offers, setL, setO, notify };

  const pendingForMe = offers.filter(o =>
    o.status === "pending" &&
    listings.find(l => l.id === o.listingId && l.seller === user)
  ).length;

  const tabs = [
    { k: "market", label: "🏪 Mercato" },
    { k: "sell", label: "📦 Vendi" },
    { k: "mine", label: "🏷️ Annunci" + (pendingForMe > 0 ? ` (${pendingForMe})` : "") },
    { k: "myoffers", label: "💬 Offerte" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "monospace" }}>
      <style>{cs}</style>

      {/* Header */}
      <div style={{ background: T.panel, borderBottom: `3px solid ${T.green}`, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green }}>⛏️ MC Market</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12 }}>👤 <span style={{ color: T.gold }}>{user}</span></span>
          <button onClick={() => setUser("")} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.dim, fontSize: 11 }}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
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
          zIndex: 999, fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap"
        }}>{toast.msg}</div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 12px 32px" }}>
        {tab === "market" && <MarketTab {...props} />}
        {tab === "sell" && <SellTab {...props} onDone={() => setTab("market")} />}
        {tab === "mine" && <MineTab {...props} />}
        {tab === "myoffers" && <MyOffersTab {...props} />}
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [n, setN] = useState("");
  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{cs}</style>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color: T.green, lineHeight: 1.8, marginBottom: 10 }}>⛏️ MC Market</div>
        <div style={{ color: T.dim, fontSize: 13 }}>Borsa valori del server</div>
      </div>
      <div style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 6, padding: 28, width: "100%", maxWidth: 340 }}>
        <div style={{ ...lbl, marginBottom: 8, fontSize: 13 }}>Il tuo username Minecraft</div>
        <input value={n} onChange={(e) => setN(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && n.trim().length >= 2 && onLogin(n.trim())}
          placeholder="es. Steve, Herobrine…" autoFocus
          style={{ ...inp, marginBottom: 16 }} />
        <button onClick={() => n.trim().length >= 2 && onLogin(n.trim())}
          style={{
            width: "100%", padding: 13, background: n.trim().length >= 2 ? T.green : T.panelHi,
            border: "none", borderRadius: 4, color: "#fff",
            fontFamily: "'Press Start 2P', monospace", fontSize: 9, letterSpacing: 1,
          }}>ENTRA NEL MERCATO</button>
      </div>
      <div style={{ marginTop: 20, color: T.dim, fontSize: 11, textAlign: "center", maxWidth: 280, lineHeight: 1.8 }}>
        ⚠️ Nessun account necessario — chiunque può postare con qualsiasi username.
      </div>
    </div>
  );
}

function MarketTab({ user, listings, offers, setO, notify }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tutti");
  const [modal, setModal] = useState(null);
  const [oprice, setOprice] = useState("");
  const [omsg, setOmsg] = useState("");

  const active = listings.filter((l) => l.status === "active" && l.seller !== user);
  const filtered = active.filter((l) =>
    (cat === "Tutti" || l.cat === cat) &&
    (!search || l.item.toLowerCase().includes(search.toLowerCase()) || l.seller.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.ts - a.ts);

  const ml = modal ? listings.find((l) => l.id === modal) : null;

  const sendOffer = async () => {
    const p = Number(oprice);
    if (!p || p <= 0) { notify("Inserisci un prezzo valido", "err"); return; }
    const dup = offers.find((o) => o.listingId === modal && o.buyer === user && o.status === "pending");
    if (dup) { notify("Hai già un'offerta attiva su questo annuncio", "err"); return; }
    await setO([...offers, { id: uid(), listingId: modal, buyer: user, price: p, msg: omsg.trim(), ts: Date.now(), status: "pending" }]);
    setModal(null); setOprice(""); setOmsg("");
    notify("✅ Offerta inviata!");
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Cerca oggetto o venditore…"
        style={{ ...inp, marginBottom: 12 }} />
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
        <div style={{ textAlign: "center", padding: 56, color: T.dim, fontSize: 14 }}>
          😕 Nessun annuncio trovato
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((l) => {
            const n = offers.filter((o) => o.listingId === l.id && o.status === "pending").length;
            return (
              <div key={l.id} onClick={() => { setModal(l.id); setOprice(""); setOmsg(""); }}
                style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 4, padding: 14, cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = T.green}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 26 }}>{l.emoji}</span>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{l.item}</div>
                      <div style={{ color: T.dim, fontSize: 11 }}>Qtà: {l.qty} · 👤 {l.seller} · {timeAgo(l.ts)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: T.gold, fontFamily: "'Press Start 2P', monospace", fontSize: 11 }}>{l.price.toLocaleString()}</div>
                    <div style={{ color: T.goldDim, fontSize: 10 }}>🪙 monete</div>
                    {n > 0 && <div style={{ color: T.blue, fontSize: 10, marginTop: 4 }}>💬 {n} offerte</div>}
                  </div>
                </div>
                {l.desc && <div style={{ marginTop: 8, fontSize: 12, color: T.dimHi, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>{l.desc}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Offer modal – faux viewport, no position:fixed */}
      {modal && ml && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 16
        }} onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: T.panel, border: `2px solid ${T.green}`, borderRadius: 6, padding: 24, width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>{ml.emoji}</span>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>{ml.item}</div>
                <div style={{ color: T.dim, fontSize: 12 }}>Venditore: <span style={{ color: T.gold }}>{ml.seller}</span> · Qtà: {ml.qty}</div>
              </div>
            </div>
            <div style={{ background: "#141414", borderRadius: 4, padding: 12, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.dim, fontSize: 13 }}>Prezzo richiesto:</span>
              <span style={{ color: T.gold, fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{ml.price.toLocaleString()} 🪙</span>
            </div>
            {ml.desc && <div style={{ color: T.dimHi, fontSize: 12, marginBottom: 16 }}>{ml.desc}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>La tua offerta (monete) 🪙</label>
              <input type="number" value={oprice} onChange={(e) => setOprice(e.target.value)}
                placeholder={`Es. ${Math.round(ml.price * 0.85)}`}
                style={{ ...inp, color: T.gold }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Messaggio (opzionale)</label>
              <textarea value={omsg} onChange={(e) => setOmsg(e.target.value)}
                placeholder="Es. posso pagare subito, ho anche smeraldi da scambiare…"
                style={{ ...inp, resize: "vertical", minHeight: 64 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 12, background: T.panelHi, border: `1px solid ${T.border}`, borderRadius: 4, color: T.dim, fontSize: 13 }}>Annulla</button>
              <button onClick={sendOffer} style={{ flex: 2, padding: 12, background: T.green, border: "none", borderRadius: 4, color: "#fff", fontSize: 14, fontWeight: "bold" }}>💬 Invia Offerta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    await setL([...listings, { id: uid(), seller: user, item: finalName, emoji: item.e, cat: item.cat, qty: Number(qty), price: p, desc: desc.trim(), ts: Date.now(), status: "active" }]);
    notify("✅ Annuncio pubblicato!");
    setPrice(""); setDesc(""); setQty(1); setCustom("");
    onDone();
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>📦 Nuovo Annuncio</div>
      <div style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

        <div>
          <label style={lbl}>Oggetto</label>
          <select value={item.name} onChange={(e) => setItem(ITEMS.find((i) => i.name === e.target.value))}
            style={inp}>
            {ITEMS.map((i) => <option key={i.name} value={i.name}>{i.e} {i.name}</option>)}
          </select>
        </div>

        {item.name === "Altro (specifica)" && (
          <div>
            <label style={lbl}>Nome oggetto personalizzato</label>
            <input value={custom} onChange={(e) => setCustom(e.target.value)}
              placeholder="Es. Mending Book, Elytra…" style={inp} />
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
          <label style={lbl}>Prezzo richiesto (monete) 🪙</label>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="Es. 500" style={{ ...inp, color: T.gold }} />
        </div>

        <div>
          <label style={lbl}>Descrizione / note (opzionale)</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Es. incantamenti presenti, condizioni, spedizione in chest…"
            style={{ ...inp, resize: "vertical", minHeight: 80 }} />
        </div>

        <button onClick={submit} style={{
          padding: 14, background: T.green, border: "none", borderRadius: 4, color: "#fff",
          fontFamily: "'Press Start 2P', monospace", fontSize: 9, letterSpacing: 1,
        }}>🚀 PUBBLICA ANNUNCIO</button>
      </div>
    </div>
  );
}

function MineTab({ user, listings, offers, setL, setO, notify }) {
  const mine = listings.filter((l) => l.seller === user).sort((a, b) => b.ts - a.ts);

  const cancel = async (id) => {
    await setL(listings.map((l) => l.id === id ? { ...l, status: "cancelled" } : l));
    await setO(offers.map((o) => o.listingId === id && o.status === "pending" ? { ...o, status: "cancelled_offer" } : o));
    notify("Annuncio cancellato");
  };

  const accept = async (o) => {
    await setL(listings.map((l) => l.id === o.listingId ? { ...l, status: "sold" } : l));
    await setO(offers.map((x) => {
      if (x.id === o.id) return { ...x, status: "accepted" };
      if (x.listingId === o.listingId && x.id !== o.id) return { ...x, status: "rejected" };
      return x;
    }));
    notify(`✅ Offerta di ${o.buyer} accettata! Accordatevi in gioco.`);
  };

  const reject = async (id) => {
    await setO(offers.map((o) => o.id === id ? { ...o, status: "rejected" } : o));
    notify("Offerta rifiutata");
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>🏷️ I Miei Annunci</div>
      {mine.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: T.dim }}>Non hai ancora pubblicato annunci</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mine.map((l) => {
            const pending = offers.filter((o) => o.listingId === l.id && o.status === "pending");
            const accepted = offers.find((o) => o.listingId === l.id && o.status === "accepted");
            return (
              <div key={l.id} style={{ background: T.panel, border: `2px solid ${l.status === "active" ? T.border : l.status === "sold" ? T.goldDim : "#555"}`, borderRadius: 4, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pending.length > 0 ? 12 : 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>{l.emoji}</span>
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: 2 }}>{l.item}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>Qtà: {l.qty} · <span style={{ color: T.gold }}>{l.price.toLocaleString()} 🪙</span> · {timeAgo(l.ts)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {badge(l.status)}
                    {l.status === "active" && (
                      <button onClick={() => cancel(l.id)} style={{ padding: "4px 10px", background: T.red, border: "none", borderRadius: 4, color: "#fff", fontSize: 12 }}>✕</button>
                    )}
                  </div>
                </div>

                {l.status === "sold" && accepted && (
                  <div style={{ marginTop: 10, background: "#1a3a1a", borderRadius: 4, padding: 10, fontSize: 12, color: "#80ff80" }}>
                    ✅ Venduto a <strong>{accepted.buyer}</strong> per <strong style={{ color: T.gold }}>{accepted.price.toLocaleString()} 🪙</strong> — accordatevi in gioco!
                  </div>
                )}

                {pending.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: T.dim, marginBottom: 8 }}>💬 {pending.length} offerta{pending.length > 1 ? "e" : ""} ricevuta{pending.length > 1 ? "e" : ""}:</div>
                    {pending.sort((a, b) => b.price - a.price).map((o) => (
                      <div key={o.id} style={{ background: "#141414", borderRadius: 4, padding: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div>
                          <span style={{ color: T.gold, fontWeight: "bold" }}>{o.price.toLocaleString()} 🪙</span>
                          <span style={{ color: T.dim, fontSize: 12 }}> da <strong style={{ color: T.text }}>{o.buyer}</strong></span>
                          {o.msg && <div style={{ fontSize: 11, color: T.dimHi, marginTop: 3 }}>"{o.msg}"</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => reject(o.id)} style={{ padding: "6px 12px", background: T.red, border: "none", borderRadius: 4, color: "#fff", fontSize: 13 }}>✕</button>
                          <button onClick={() => accept(o)} style={{ padding: "6px 12px", background: T.green, border: "none", borderRadius: 4, color: "#fff", fontSize: 13 }}>✓</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyOffersTab({ user, listings, offers, setO, notify }) {
  const mine = offers.filter((o) => o.buyer === user).sort((a, b) => b.ts - a.ts);

  const cancel = async (id) => {
    await setO(offers.map((o) => o.id === id ? { ...o, status: "cancelled_offer" } : o));
    notify("Offerta annullata");
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: T.green, marginBottom: 20 }}>💬 Le Mie Offerte</div>
      {mine.length === 0 ? (
        <div style={{ textAlign: "center", padding: 56, color: T.dim }}>Non hai ancora fatto offerte</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mine.map((o) => {
            const l = listings.find((x) => x.id === o.listingId);
            if (!l) return null;
            return (
              <div key={o.id} style={{ background: T.panel, border: `2px solid ${T.border}`, borderRadius: 4, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 24 }}>{l.emoji}</span>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{l.item}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>Venditore: <span style={{ color: T.gold }}>{l.seller}</span></div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        Tua offerta: <span style={{ color: T.gold }}>{o.price.toLocaleString()} 🪙</span>
                        <span style={{ color: T.dim }}> (richiesti {l.price.toLocaleString()} 🪙)</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                    {badge(o.status)}
                    {o.status === "pending" && (
                      <button onClick={() => cancel(o.id)} style={{ padding: "4px 10px", background: T.red, border: "none", borderRadius: 4, color: "#fff", fontSize: 11 }}>Annulla</button>
                    )}
                  </div>
                </div>
                {o.msg && <div style={{ marginTop: 8, fontSize: 11, color: T.dim }}>"{o.msg}"</div>}
                {o.status === "accepted" && (
                  <div style={{ marginTop: 10, background: "#1a3a1a", borderRadius: 4, padding: 10, fontSize: 12, color: "#80ff80" }}>
                    ✅ Offerta accettata! Accordati con <strong>{l.seller}</strong> in gioco per completare lo scambio.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
