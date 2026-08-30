import { useRouter } from "next/router";
import Link from "next/link";
import { LayoutDashboard, UtensilsCrossed, Tags, ClipboardList, CalendarDays, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "דשבורד", icon: LayoutDashboard },
  { href: "/admin/products", label: "מוצרים", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "קטגוריות", icon: Tags },
  { href: "/admin/orders", label: "הזמנות", icon: ClipboardList },
  { href: "/admin/calendar", label: "לוח שנה", icon: CalendarDays },
];

export default function AdminLayout({ children, title }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div dir="rtl" className="ad-root">
      <AdminStyles />
      <div className="ad-shell">
        <aside className="ad-sidebar">
          <p className="ad-brand">קייטרינג · ניהול</p>
          <nav className="ad-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`ad-nav-link ${active ? "active" : ""}`}>
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </nav>
          <button onClick={logout} className="ad-logout">
            <LogOut size={15} /> התנתקות
          </button>
        </aside>
        <main className="ad-main">
          {title && <h1 className="ad-title">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@600;700&family=Rubik:wght@400;500;600;700&display=swap');
      html, body, #__next { background: #0A0908; }
      .ad-root {
        --ink: #F3ECD8; --ink-soft: #A99B7A; --bg: #0A0908; --card: #171512;
        --border: #33291A; --gold: #C9A227; --gold-soft: #E8D48A; --wine: #7A2331; --danger: #C0392B;
        font-family: 'Rubik', sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh;
      }
      .ad-display { font-family: 'Frank Ruhl Libre', serif; }
      .ad-shell { display: flex; min-height: 100vh; }
      .ad-sidebar { width: 220px; flex-shrink: 0; background: var(--card); border-left: 1px solid var(--border); padding: 20px 14px; display: flex; flex-direction: column; }
      .ad-brand { font-family: 'Frank Ruhl Libre', serif; font-size: 17px; margin-bottom: 20px; color: var(--gold-soft); }
      .ad-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
      .ad-nav-link { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: var(--ink-soft); text-decoration: none; font-size: 14px; }
      .ad-nav-link:hover { background: rgba(201,162,39,0.08); color: var(--ink); }
      .ad-nav-link.active { background: color-mix(in srgb, var(--gold) 18%, transparent); color: var(--gold-soft); font-weight: 600; }
      .ad-logout { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px; color: var(--ink-soft); background: none; border: 1px solid var(--border); font-size: 13px; cursor: pointer; }
      .ad-logout:hover { color: var(--ink); }
      .ad-main { flex: 1; padding: 28px 32px; max-width: 1100px; }
      .ad-title { font-family: 'Frank Ruhl Libre', serif; font-size: 26px; margin-bottom: 20px; }
      .ad-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
      .ad-btn { background: var(--gold); color: #15140F; border: none; border-radius: 8px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
      .ad-btn:hover { filter: brightness(1.08); }
      .ad-btn:disabled { opacity: .5; cursor: not-allowed; }
      .ad-btn-secondary { background: transparent; color: var(--ink); border: 1px solid var(--border); border-radius: 8px; padding: 9px 16px; font-size: 14px; cursor: pointer; }
      .ad-btn-danger { background: transparent; color: #E07A6E; border: 1px solid #4A2420; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer; }
      .ad-input, .ad-select, .ad-textarea {
        border: 1px solid var(--border); background: var(--bg); color: var(--ink); border-radius: 8px;
        padding: 8px 10px; font-size: 14px; width: 100%;
      }
      .ad-input:focus, .ad-select:focus, .ad-textarea:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
      .ad-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .ad-table th { text-align: right; color: var(--ink-soft); font-weight: 500; padding: 8px 10px; border-bottom: 1px solid var(--border); }
      .ad-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .ad-table tr:hover td { background: rgba(255,255,255,0.02); }
      .ad-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .ad-stat-value { font-family: 'Frank Ruhl Libre', serif; font-size: 30px; color: var(--gold-soft); }
      .ad-stat-label { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
      .ad-error { background: #3A1F1A; color: #E2694A; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
    `}</style>
  );
}
