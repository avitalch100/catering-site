import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { ChevronRight, ChevronLeft, Loader2, Phone, MapPin, MessageCircle } from "lucide-react";
import { buildWhatsAppLink, orderWhatsAppMessage } from "../../lib/whatsapp";

const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL")}`;
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const STATUS_COLORS = {
  "חדש": "#9DB6E8",
  "בטיפול": "#E8C77E",
  "אושר": "#8FCB9F",
  "הושלם": "#B8AFA0",
  "בוטל": "#E2694A",
};

const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = toDateStr(new Date());

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = ראשון
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AdminCalendar() {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const ordersByDate = useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (!o.date) continue;
      (map[o.date] ||= []).push(o);
    }
    return map;
  }, [orders]);

  const grid = useMemo(() => buildGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const selectedOrders = selectedDate ? ordersByDate[selectedDate] || [] : [];

  const changeMonth = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  return (
    <AdminLayout title="לוח שנה">
      <div className="ad-card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="ad-btn-secondary" onClick={() => changeMonth(-1)}><ChevronRight size={16} /></button>
          <h2 className="ad-display" style={{ fontSize: 20 }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h2>
          <button className="ad-btn-secondary" onClick={() => changeMonth(1)}><ChevronLeft size={16} /></button>
        </div>

        {loading ? (
          <Loader2 className="ad-spin" size={20} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ textAlign: "center", fontSize: 12, color: "var(--ink-soft)", padding: "4px 0" }}>{w}</div>
            ))}
            {grid.map((date, i) => {
              if (!date) return <div key={i} style={{ minHeight: 84, borderRadius: 10 }} />;
              const dateStr = toDateStr(date);
              const dayOrders = ordersByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 84, borderRadius: 10, textAlign: "right", padding: 6, cursor: "pointer",
                    background: isSelected ? "rgba(201,162,39,0.14)" : "var(--bg)",
                    border: isToday ? "1px solid var(--gold)" : "1px solid var(--border)",
                    display: "flex", flexDirection: "column", gap: 3,
                  }}
                >
                  <span style={{ fontSize: 12, color: isToday ? "var(--gold-soft)" : "var(--ink-soft)", fontWeight: isToday ? 700 : 400 }}>
                    {date.getDate()}
                  </span>
                  {dayOrders.slice(0, 2).map((o) => (
                    <span key={o.id} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: "var(--ink)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLORS[o.status] || "#9DB6E8", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                    </span>
                  ))}
                  {dayOrders.length > 2 && (
                    <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>+{dayOrders.length - 2} נוספים</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="ad-card">
          <h3 className="ad-display" style={{ fontSize: 17, marginBottom: 12 }}>אירועים בתאריך {selectedDate}</h3>
          {selectedOrders.length === 0 ? (
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>אין הזמנות בתאריך זה.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {selectedOrders.map((o) => (
                <div key={o.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{o.name}</strong>
                    <span className="ad-badge" style={{ color: STATUS_COLORS[o.status], background: "rgba(255,255,255,0.06)" }}>{o.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, margin: "2px 0" }}>
                    <Phone size={13} /> {o.phone}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, margin: "2px 0" }}>
                    <MapPin size={13} /> {o.address}
                  </p>
                  <p style={{ fontSize: 13, margin: "6px 0" }}>{money(o.total)}</p>
                  <a
                    href={buildWhatsAppLink(o.phone, orderWhatsAppMessage(o))}
                    target="_blank"
                    rel="noreferrer"
                    className="ad-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#0A0908" }}
                  >
                    <MessageCircle size={15} /> פתיחת וואטסאפ עם הלקוח
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`.ad-spin { animation: ad-spin 1s linear infinite; } @keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
