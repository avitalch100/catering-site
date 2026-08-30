import { useState, useMemo, useEffect } from "react";
import {
  Search, X, Plus, Minus, ShoppingBag, MapPin, Phone, Calendar,
  MessageSquare, ChefHat, Soup, Cake, Salad, Check, User, ArrowRight,
  Loader2, PartyPopper, ZoomIn
} from "lucide-react";

const CATEGORY_ICONS = [Soup, ChefHat, Salad, Cake, PartyPopper];
const iconForIndex = (i) => CATEGORY_ICONS[i % CATEGORY_ICONS.length];

const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL")}`;

export default function Home() {
  // ----- נתונים מהשרת -----
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCategories(data.categories);
        setProducts(data.products);
        setUnavailableDates(data.unavailableDates);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ----- מצב הממשק -----
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [cart, setCart] = useState({}); // key: `${productId}::${color||''}` -> {productId, color, qty}
  const [panel, setPanel] = useState("closed");
  const [form, setForm] = useState({ name: "", phone: "", date: "", address: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [colorPick, setColorPick] = useState({}); // productId -> selected color while picking
  const [lightbox, setLightbox] = useState(null); // { url, name } | null

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const inCat = activeCat === "all" || p.categoryIds.includes(activeCat);
      const q = query.trim();
      const inQuery = !q || p.name.includes(q) || p.description.includes(q);
      return inCat && inQuery;
    });
  }, [products, query, activeCat]);

  const cartItems = Object.values(cart)
    .filter((i) => i.qty > 0)
    .map((i) => {
      const product = products.find((p) => p.id === i.productId);
      return product ? { ...product, qty: i.qty, color: i.color } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const cartKey = (productId, color) => `${productId}::${color || ""}`;

  const addToCart = (productId, color) => {
    const key = cartKey(productId, color);
    setCart((c) => ({
      ...c,
      [key]: { productId, color: color || null, qty: (c[key]?.qty || 0) + 1 },
    }));
  };
  const changeQty = (productId, color, delta) => {
    const key = cartKey(productId, color);
    setCart((c) => {
      const next = Math.max(0, (c[key]?.qty || 0) + delta);
      return { ...c, [key]: { productId, color: color || null, qty: next } };
    });
  };
  const setQtyDirect = (productId, color, value) => {
    const key = cartKey(productId, color);
    const n = Math.max(0, Math.floor(Number(value)) || 0);
    setCart((c) => ({ ...c, [key]: { productId, color: color || null, qty: n } }));
  };
  const qtyFor = (productId, color) => cart[cartKey(productId, color)]?.qty || 0;

  const dateUnavailable = form.date && unavailableDates.includes(form.date);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "נא למלא שם מלא";
    if (!/^0\d{8,9}$/.test(form.phone.replace(/[-\s]/g, ""))) e.phone = "מספר טלפון לא תקין";
    if (!form.date) e.date = "נא לבחור תאריך אירוע";
    else if (unavailableDates.includes(form.date)) e.date = "התאריך הזה כבר תפוס ביומן שלנו - נא לבחור תאריך אחר";
    if (!form.address.trim()) e.address = "נא למלא כתובת";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          date: form.date,
          address: form.address,
          notes: form.notes,
          items: cartItems.map((i) => ({ name: i.name, color: i.color, qty: i.qty, price: i.price })),
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "שליחת ההזמנה נכשלה");
      setPanel("success");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setCart({});
    setForm({ name: "", phone: "", date: "", address: "", notes: "" });
    setErrors({});
    setSubmitError(null);
    setPanel("closed");
  };

  if (loading) {
    return (
      <div dir="rtl" className="cc-loading">
        <BaseStyles />
        <Loader2 className="cc-spin" size={28} />
        <p>טוענים את התפריט...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div dir="rtl" className="cc-loading">
        <BaseStyles />
        <p>לא הצלחנו לטעון את התפריט כרגע.</p>
        <p className="cc-error-detail">{loadError}</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="catering-root">
      <BaseStyles />

      {/* ===== Header ===== */}
      <header className="max-w-5xl mx-auto px-5 pt-10 pb-6">
        <p className="text-xs tracking-widest uppercase" style={{ color: "var(--paprika)" }}>קייטרינג בוטיק</p>
        <h1 className="cc-display text-4xl md:text-5xl mt-1">התפריט שלנו</h1>
        <p className="mt-2 max-w-xl" style={{ color: "var(--ink-soft)" }}>
          כל מנה מוכנה טרייה לפי הזמנה. הרכיבי תפריט לאירוע שלך ושלחי לנו את הפרטים —
          נחזור אליך לאישור ותיאום.
        </p>

        <div className="mt-6 relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} color="var(--ink-soft)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש מנה..."
            className="cc-input w-full rounded-full py-2.5 pr-10 pl-4 text-sm"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCat("all")}
            className={`cc-pill rounded-full px-4 py-2 text-sm font-medium ${activeCat === "all" ? "active" : ""}`}
          >
            הכל
          </button>
          {categories.map((c, idx) => {
            const Icon = iconForIndex(idx);
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`cc-pill rounded-full px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${activeCat === c.id ? "active" : ""}`}
              >
                <Icon size={15} />
                {c.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===== גריד מוצרים ===== */}
      <main className="max-w-5xl mx-auto px-5 pb-32">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--ink-soft)" }}>
            <p className="cc-display text-2xl mb-2">לא נמצאו מנות</p>
            <p className="text-sm">נסי חיפוש אחר או קטגוריה אחרת.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const catIdx = categories.findIndex((c) => p.categoryIds.includes(c.id));
              const Icon = iconForIndex(catIdx < 0 ? 0 : catIdx);
              const hasColors = p.colors && p.colors.length > 0;
              const selectedColor = colorPick[p.id] || (hasColors ? p.colors[0] : null);
              const qty = qtyFor(p.id, hasColors ? selectedColor : null);

              return (
                <div key={p.id} className="cc-card rounded-2xl p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    {p.image ? (
                      <button
                        type="button"
                        className="cc-thumb-btn"
                        onClick={() => setLightbox({ url: p.image, name: p.name })}
                        aria-label={`הגדלת תמונה: ${p.name}`}
                      >
                        <img src={p.image} alt={p.name} className="cc-thumb" />
                        <span className="cc-thumb-zoom"><ZoomIn size={14} /></span>
                      </button>
                    ) : (
                      <div className="cc-icon-badge w-12 h-12 rounded-xl flex items-center justify-center">
                        <Icon size={22} />
                      </div>
                    )}
                    <div className="cc-ticket rounded-md pl-3 pr-4 py-1 text-sm">{money(p.price)}</div>
                  </div>

                  <h3 className="cc-display text-lg mt-3">{p.name}</h3>
                  <p className="text-sm mt-1 line-clamp-2 flex-1" style={{ color: "var(--ink-soft)" }}>
                    {p.description}
                  </p>

                  {hasColors && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColorPick((cp) => ({ ...cp, [p.id]: c }))}
                          className={`cc-color-chip ${selectedColor === c ? "active" : ""}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {!p.inStock ? (
                    <div className="mt-3 text-center text-sm py-2 rounded-lg" style={{ background: "var(--border)", color: "var(--ink-soft)" }}>
                      אזל זמנית
                    </div>
                  ) : qty === 0 ? (
                    <button
                      onClick={() => addToCart(p.id, hasColors ? selectedColor : null)}
                      className="mt-3 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5"
                      style={{ background: "var(--olive)", color: "#15140F" }}
                    >
                      <Plus size={16} /> הוסיפי לתפריט
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center justify-between rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                      <button onClick={() => changeQty(p.id, hasColors ? selectedColor : null, -1)} className="px-3 py-2" aria-label="הפחתה">
                        <Minus size={15} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => setQtyDirect(p.id, hasColors ? selectedColor : null, e.target.value)}
                        className="w-16 text-center text-sm font-semibold bg-transparent"
                        style={{ color: "var(--ink)" }}
                        aria-label="כמות"
                      />
                      <button onClick={() => changeQty(p.id, hasColors ? selectedColor : null, 1)} className="px-3 py-2" aria-label="הוספה">
                        <Plus size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {itemCount > 0 && panel === "closed" && (
        <button className="cc-fab px-5 py-3.5 flex items-center gap-2 text-sm font-semibold" onClick={() => setPanel("cart")}>
          <ShoppingBag size={18} />
          לתפריט שלי
          <span className="cc-badge-count rounded-full w-5 h-5 flex items-center justify-center">{itemCount}</span>
        </button>
      )}

      {panel === "cart" && (
        <>
          <div className="cc-scrim" onClick={() => setPanel("closed")} />
          <div className="cc-drawer">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="cc-display text-xl">התפריט שהרכבת</h2>
              <button onClick={() => setPanel("closed")} aria-label="סגירה"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: "var(--ink-soft)" }}>עדיין לא נבחרו מנות.</p>
              ) : (
                cartItems.map((i) => (
                  <div key={cartKey(i.id, i.color)} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{i.name}{i.color ? ` · ${i.color}` : ""}</p>
                      <p className="text-xs" style={{ color: "var(--ink-soft)" }}>{money(i.price)} ליחידה</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                      <button onClick={() => changeQty(i.id, i.color, -1)} className="px-2 py-1"><Minus size={13} /></button>
                      <input
                        type="number" min={0} value={i.qty}
                        onChange={(e) => setQtyDirect(i.id, i.color, e.target.value)}
                        className="w-12 text-center text-sm font-semibold bg-transparent"
                        style={{ color: "var(--ink)" }} aria-label="כמות"
                      />
                      <button onClick={() => changeQty(i.id, i.color, 1)} className="px-2 py-1"><Plus size={13} /></button>
                    </div>
                    <span className="text-sm font-semibold w-14 text-left">{money(i.price * i.qty)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: "var(--ink-soft)" }}>סה״כ משוער</span>
                <span className="cc-display text-2xl">{money(total)}</span>
              </div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => setPanel("checkout")}
                className="cc-btn-primary w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                המשך לפרטי ההזמנה <ArrowRight size={16} className="rotate-180" />
              </button>
            </div>
          </div>
        </>
      )}

      {panel === "checkout" && (
        <>
          <div className="cc-scrim" onClick={() => setPanel("cart")} />
          <div className="cc-drawer">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="cc-display text-xl">פרטי ההזמנה</h2>
              <button onClick={() => setPanel("cart")} aria-label="חזרה"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <Field label="שם מלא" icon={User} error={errors.name}>
                <input className="cc-input w-full rounded-lg px-3 py-2 text-sm" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="לדוגמה: דנה כהן" />
              </Field>
              <Field label="טלפון" icon={Phone} error={errors.phone}>
                <input className="cc-input w-full rounded-lg px-3 py-2 text-sm" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-0000000" />
              </Field>
              <Field label="תאריך האירוע" icon={Calendar}
                error={dateUnavailable ? "התאריך הזה כבר תפוס ביומן שלנו - נא לבחור תאריך אחר" : errors.date}>
                <input type="date" className="cc-input w-full rounded-lg px-3 py-2 text-sm" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <span className="text-xs mt-1 block" style={{ color: "var(--ink-soft)" }}>בודקים אוטומטית מול לוח האירועים שלנו</span>
              </Field>
              <Field label="כתובת האירוע" icon={MapPin} error={errors.address}>
                <input className="cc-input w-full rounded-lg px-3 py-2 text-sm" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="עיר, רחוב ומספר" />
              </Field>
              <Field label="הערות (לא חובה)" icon={MessageSquare}>
                <textarea rows={3} className="cc-input w-full rounded-lg px-3 py-2 text-sm resize-none" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="אלרגיות, שעת הגעה מועדפת וכו׳" />
              </Field>

              <div className="rounded-xl p-3 text-sm" style={{ background: "var(--border)" }}>
                <p className="font-medium mb-1">{itemCount} מנות בתפריט · {money(total)}</p>
                <p className="text-xs" style={{ color: "var(--ink-soft)" }}>אין סליקת אשראי בשלב זה — התשלום מסוכם ישירות איתנו.</p>
              </div>

              {submitError && (
                <div className="text-sm rounded-lg p-3" style={{ background: "#3A1F1A", color: "#E2694A" }}>
                  {submitError}
                </div>
              )}
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={submitOrder} disabled={submitting} className="cc-btn-primary w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
                {submitting ? (<><Loader2 className="cc-spin" size={16} /> שולחת...</>) : "שליחת ההזמנה"}
              </button>
            </div>
          </div>
        </>
      )}

      {lightbox && (
        <div className="cc-lightbox" onClick={() => setLightbox(null)}>
          <button className="cc-lightbox-close" onClick={() => setLightbox(null)} aria-label="סגירה">
            <X size={22} />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="cc-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="cc-lightbox-caption">{lightbox.name}</p>
        </div>
      )}

      {panel === "success" && (
        <>
          <div className="cc-scrim" />
          <div className="cc-drawer items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--olive)" }}>
              <Check color="#15140F" size={30} />
            </div>
            <h2 className="cc-display text-2xl mb-2">ההזמנה נשלחה!</h2>
            <p className="text-sm mb-1" style={{ color: "var(--ink-soft)" }}>
              תודה {form.name.split(" ")[0]}, קיבלנו את הפרטים לאירוע בתאריך {form.date}.
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--ink-soft)" }}>ההזמנה נשמרה בטבלת ה-Orders שלנו ואנחנו נחזור אליך בהקדם.</p>
            <button onClick={resetAll} className="cc-btn-primary rounded-xl px-6 py-2.5 text-sm font-semibold">חזרה לתפריט</button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: "var(--ink-soft)" }}>
        <Icon size={13} /> {label}
      </span>
      {children}
      {error && <span className="text-xs mt-1 block" style={{ color: "#E2694A" }}>{error}</span>}
    </label>
  );
}

function BaseStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Rubik:wght@400;500;600;700&display=swap');

      html, body, #__next { height: 100%; background: #121110; }

      .catering-root, .cc-loading {
        --ink: #F3ECD8;
        --ink-soft: #A99B7A;
        --cream: #0A0908;
        --card: #171512;
        --border: #33291A;
        --olive: #C9A227;
        --olive-dark: #8A6B15;
        --paprika: #7A2331;
        --saffron: #D4AF37;
        font-family: 'Rubik', sans-serif;
        background:
          radial-gradient(ellipse 900px 500px at 15% -5%, rgba(201,162,39,0.20), transparent 60%),
          radial-gradient(ellipse 700px 500px at 100% 10%, rgba(122,35,49,0.18), transparent 55%),
          linear-gradient(165deg, #0A0908 0%, #171209 45%, #0A0908 100%);
        background-attachment: fixed;
        color: var(--ink);
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
      }
      .cc-loading {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 12px; text-align: center; padding: 20px;
      }
      .cc-error-detail { font-size: 12px; color: var(--ink-soft); max-width: 420px; }
      .cc-spin { animation: cc-spin 1s linear infinite; }
      @keyframes cc-spin { to { transform: rotate(360deg); } }

      .cc-display { font-family: 'Frank Ruhl Libre', serif; }
      .cc-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(2px); z-index: 40; }
      .cc-pill { border: 1px solid var(--border); background: var(--card); transition: all .18s ease; }
      .cc-pill.active { background: var(--olive); color: #15140F; border-color: var(--olive); }
      .cc-card { background: var(--card); border: 1px solid var(--border); transition: transform .18s ease, box-shadow .18s ease; }
      .cc-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px -12px rgba(0,0,0,.45); }
      .cc-thumb { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid var(--border); display: block; transition: transform .18s ease, filter .18s ease; }
      .cc-thumb-btn {
        position: relative; padding: 0; border: none; background: none; cursor: zoom-in;
        border-radius: 12px; line-height: 0;
      }
      .cc-thumb-btn:hover .cc-thumb { transform: scale(1.12); filter: brightness(1.08); box-shadow: 0 6px 16px -4px rgba(0,0,0,.5); }
      .cc-thumb-zoom {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        color: #fff; background: rgba(0,0,0,0); opacity: 0; transition: opacity .18s ease, background .18s ease;
        border-radius: 12px;
      }
      .cc-thumb-btn:hover .cc-thumb-zoom { opacity: 1; background: rgba(0,0,0,.25); }
      .cc-lightbox {
        position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.85);
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        padding: 24px; cursor: zoom-out; animation: cc-fade-in .15s ease-out;
      }
      @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
      .cc-lightbox-img {
        max-width: min(90vw, 720px); max-height: 75vh; border-radius: 14px; object-fit: contain;
        cursor: default; box-shadow: 0 20px 60px -10px rgba(0,0,0,.6);
      }
      .cc-lightbox-caption { color: var(--ink); font-family: 'Frank Ruhl Libre', serif; font-size: 18px; }
      .cc-lightbox-close {
        position: absolute; top: 18px; left: 18px; background: var(--card); color: var(--ink);
        border: 1px solid var(--border); border-radius: 999px; width: 40px; height: 40px;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
      }
      .cc-icon-badge { background: color-mix(in srgb, var(--olive) 22%, black); color: #F0DFA0; }
      .cc-ticket { position: relative; background: var(--saffron); color: #2b2420; font-weight: 700; }
      .cc-ticket::before { content: ""; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 999px; background: var(--card); }
      .cc-btn-primary { background: var(--paprika); color: #fff; transition: filter .15s ease, transform .15s ease; }
      .cc-btn-primary:hover { filter: brightness(1.08); }
      .cc-btn-primary:active { transform: scale(.98); }
      .cc-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
      .cc-input { border: 1px solid var(--border); background: var(--card); color: var(--ink); }
      .cc-input::placeholder { color: var(--ink-soft); }
      .cc-input:focus { outline: 2px solid var(--olive); outline-offset: 1px; }
      .cc-color-chip { border: 1px solid var(--border); background: var(--cream); color: var(--ink-soft); font-size: 11px; padding: 3px 10px; border-radius: 999px; }
      .cc-color-chip.active { background: var(--olive); color: #15140F; border-color: var(--olive); font-weight: 600; }
      .cc-drawer {
        position: fixed; top: 0; bottom: 0; left: 0; width: min(420px, 100%);
        background: var(--cream); z-index: 50; box-shadow: 12px 0 30px -10px rgba(0,0,0,.45);
        display: flex; flex-direction: column; animation: cc-slide-in .22s ease-out;
      }
      @keyframes cc-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      .cc-fab { position: fixed; bottom: 20px; left: 20px; z-index: 30; background: var(--olive); color: #15140F; border-radius: 999px; box-shadow: 0 10px 24px -8px rgba(0,0,0,.55); }
      .cc-badge-count { background: var(--paprika); color: #fff; font-size: 11px; font-weight: 700; }
      .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    `}</style>
  );
}
