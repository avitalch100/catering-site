import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const money = (n) => `₪${Number(n || 0).toLocaleString("he-IL")}`;
const emptyForm = {
  name: "", description: "", price: "", servings: 1, inStock: true, featured: false,
  categoryId: "", colors: "", image: "",
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ])
      .then(([prod, cats]) => { setItems(prod); setCategories(cats); })
      .catch(() => setError("שגיאה בטעינת מוצרים"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const catName = (id) => categories.find((c) => c.id === id)?.name || "—";

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = !!form.id;
      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("למחוק את המוצר הזה?")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    load();
  };

  const toggleStock = async (p) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, inStock: !p.inStock }),
    });
    load();
  };

  return (
    <AdminLayout title="מוצרים">
      <div style={{ marginBottom: 16 }}>
        <button className="ad-btn" onClick={() => setForm({ ...emptyForm })}>
          <Plus size={15} style={{ verticalAlign: "-2px" }} /> מוצר חדש
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {form && (
        <form onSubmit={save} className="ad-card" style={{ marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Field label="שם המנה"><input className="ad-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="מחיר (₪)"><input type="number" className="ad-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></Field>
            <Field label="קטגוריה">
              <select className="ad-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">בחרי קטגוריה</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="מספר סועדים מומלץ"><input type="number" className="ad-input" value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} /></Field>
            <Field label="צבעים זמינים (מופרדים בפסיק, אופציונלי)"><input className="ad-input" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="לבן, שחור, זהב" /></Field>
            <Field label="קישור לתמונה (URL)"><input className="ad-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>תיאור</label>
            <textarea className="ad-textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} /> במלאי
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> מומלץ
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ad-btn" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
            <button type="button" className="ad-btn-secondary" onClick={() => setForm(null)}>ביטול</button>
          </div>
        </form>
      )}

      <div className="ad-card">
        {loading ? (
          <Loader2 className="ad-spin" size={20} />
        ) : (
          <table className="ad-table">
            <thead><tr><th>שם</th><th>קטגוריה</th><th>מחיר</th><th>במלאי</th><th></th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{catName(p.categoryId)}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <button
                      className="ad-badge"
                      style={{ border: "none", cursor: "pointer", background: p.inStock ? "#1F3D2A" : "#3A1F1A", color: p.inStock ? "#8FCB9F" : "#E2694A" }}
                      onClick={() => toggleStock(p)}
                    >
                      {p.inStock ? "במלאי" : "אזל"}
                    </button>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="ad-btn-secondary" style={{ padding: "5px 9px" }} onClick={() => setForm({ ...emptyForm, ...p, price: String(p.price) })}>
                      <Pencil size={13} />
                    </button>
                    <button className="ad-btn-danger" onClick={() => remove(p.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`.ad-spin { animation: ad-spin 1s linear infinite; } @keyframes ad-spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
