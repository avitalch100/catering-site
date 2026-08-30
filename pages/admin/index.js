import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Loader2, TrendingUp, Package, Tags, ClipboardList, AlertTriangle } from "lucide-react";

const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL")}`;
const STATUS_COLORS = {
  "חדש": { bg: "#2E3A52", color: "#9DB6E8" },
  "בטיפול": { bg: "#4A3A1A", color: "#E8C77E" },
  "אושר": { bg: "#1F3D2A", color: "#8FCB9F" },
  "הושלם": { bg: "#2A2A2A", color: "#B8AFA0" },
  "בוטל": { bg: "#3A1F1A", color: "#E2694A" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="דשבורד">
      {loading ? (
        <div className="ad-card" style={{ textAlign: "center", padding: 40 }}>
          <Loader2 className="ad-spin" size={22} />
        </div>
      ) : !stats || stats.error ? (
        <div className="ad-error">{stats?.error || "שגיאה בטעינת הנתונים"}</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard icon={ClipboardList} value={stats.ordersThisMonthCount} label="הזמנות החודש" />
            <StatCard icon={TrendingUp} value={money(stats.revenueThisMonth)} label="הכנסות החודש" />
            <StatCard icon={Package} value={stats.productsCount} label="מוצרים בקטלוג" />
            <StatCard icon={Tags} value={stats.categoriesCount} label="קטגוריות" />
            {stats.outOfStock > 0 && (
              <StatCard icon={AlertTriangle} value={stats.outOfStock} label="מוצרים אזלו" accent="#E2694A" />
            )}
          </div>

          <div className="ad-card">
            <h2 className="ad-display" style={{ fontSize: 18, marginBottom: 14 }}>אירועים קרובים</h2>
            {stats.upcoming.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>אין אירועים עתידיים כרגע.</p>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr><th>לקוח</th><th>תאריך</th><th>סכום</th><th>סטטוס</th></tr>
                </thead>
                <tbody>
                  {stats.upcoming.map((o) => {
                    const s = STATUS_COLORS[o.status] || STATUS_COLORS["חדש"];
                    return (
                      <tr key={o.id}>
                        <td>{o.name}</td>
                        <td>{o.date}</td>
                        <td>{money(o.total)}</td>
                        <td><span className="ad-badge" style={{ background: s.bg, color: s.color }}>{o.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      <style>{`.ad-spin { animation: ad-spin 1s linear infinite; } @keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div className="ad-card">
      <Icon size={18} color={accent || "var(--gold)"} />
      <p className="ad-stat-value" style={accent ? { color: accent } : undefined}>{value}</p>
      <p className="ad-stat-label">{label}</p>
    </div>
  );
}
