import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const emptyForm = { name: "", order: 0, active: true };

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null = closed, {} = new, {...} = editing
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setError("שגיאה בטעינת קטגוריות"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = !!form.id;
      const res = await fetch("/api/admin/categories", {
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
    if (!confirm("למחוק את הקטגוריה הזו?")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminLayout title="קטגוריות">
      <div style={{ marginBottom: 16 }}>
        <button className="ad-btn" onClick={() => setForm({ ...emptyForm })}>
          <Plus size={15} style={{ verticalAlign: "-2px" }} /> קטגוריה חדשה
        </button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {form && (
        <form onSubmit={save} className="ad-card" style={{ marginBottom: 18, display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>שם הקטגוריה</label>
            <input className="ad-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div style={{ width: 100 }}>
            <label style={{ fontSize: 12, color: "var(--ink-soft)" }}>סדר תצוגה</label>
            <input type="number" className="ad-input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> פעיל
          </label>
          <button className="ad-btn" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
          <button type="button" className="ad-btn-secondary" onClick={() => setForm(null)}>ביטול</button>
        </form>
      )}

      <div className="ad-card">
        {loading ? (
          <Loader2 className="ad-spin" size={20} />
        ) : (
          <table className="ad-table">
            <thead><tr><th>שם</th><th>סדר</th><th>פעיל</th><th></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.order}</td>
                  <td>{c.active ? "כן" : "לא"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="ad-btn-secondary" style={{ padding: "5px 9px" }} onClick={() => setForm(c)}>
                      <Pencil size={13} />
                    </button>
                    <button className="ad-btn-danger" onClick={() => remove(c.id)}>
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
