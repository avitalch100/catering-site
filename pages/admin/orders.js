import { useEffect, useState, Fragment } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Loader2, Phone, MapPin, MessageCircle } from "lucide-react";
import { buildWhatsAppLink, orderWhatsAppMessage } from "../../lib/whatsapp";

const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL")}`;
const STATUSES = ["חדש", "בטיפול", "אושר", "הושלם", "בוטל"];
const STATUS_COLORS = {
  "חדש": { bg: "#2E3A52", color: "#9DB6E8" },
  "בטיפול": { bg: "#4A3A1A", color: "#E8C77E" },
  "אושר": { bg: "#1F3D2A", color: "#8FCB9F" },
  "הושלם": { bg: "#2A2A2A", color: "#B8AFA0" },
  "בוטל": { bg: "#3A1F1A", color: "#E2694A" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/admin/orders?${params.toString()}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(load, [from, to]);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  const totalSum = orders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <AdminLayout title="הזמנות">
      <div className="ad-card" style={{ display: "flex", gap: 14, alignItems: "end", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>מתאריך אירוע</label>
          <input type="date" className="ad-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>עד תאריך אירוע</label>
          <input type="date" className="ad-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <button className="ad-btn-secondary" onClick={() => { setFrom(""); setTo(""); }}>נקה סינון</button>
        )}
        <div style={{ marginRight: "auto", textAlign: "left" }}>
          <p className="ad-stat-value" style={{ fontSize: 20 }}>{money(totalSum)}</p>
          <p className="ad-stat-label">סה״כ בתצוגה ({orders.length} הזמנות)</p>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <Loader2 className="ad-spin" size={20} />
        ) : orders.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>אין הזמנות בטווח שנבחר.</p>
        ) : (
          <table className="ad-table">
            <thead><tr><th>לקוח</th><th>תאריך אירוע</th><th>סכום</th><th>סטטוס</th><th></th></tr></thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS_COLORS[o.status] || STATUS_COLORS["חדש"];
                const isOpen = expanded === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : o.id)}>
                      <td>{o.name}</td>
                      <td>{o.date || "—"}</td>
                      <td>{money(o.total)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="ad-select"
                          style={{ width: "auto", padding: "3px 8px", background: s.bg, color: s.color, border: "none", fontSize: 12, fontWeight: 600 }}
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td style={{ color: "var(--ink-soft)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={5} style={{ background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ padding: "10px 4px", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={13} /> {o.phone}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {o.address}</span>
                            {o.notes && <span>הערות: {o.notes}</span>}
                            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", color: "var(--ink-soft)", margin: 0 }}>{o.items}</pre>
                            <a
                              href={buildWhatsAppLink(o.phone, orderWhatsAppMessage(o))}
                              target="_blank"
                              rel="noreferrer"
                              className="ad-btn"
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content", background: "#25D366", color: "#0A0908" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle size={15} /> פתיחת וואטסאפ עם הלקוח
                            </a>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <style>{`.ad-spin { animation: ad-spin 1s linear infinite; } @keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
