import { useState } from "react";
import { useRouter } from "next/router";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהתחברות");
      router.push("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@700&family=Rubik:wght@400;500;600&display=swap');`}</style>
      <form onSubmit={submit} style={styles.card}>
        <div style={styles.iconWrap}><Lock size={22} color="#15140F" /></div>
        <h1 style={styles.title}>כניסת ניהול</h1>
        <p style={styles.subtitle}>קייטרינג · אזור פנימי</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          style={styles.input}
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "מתחברת..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0A0908", fontFamily: "Rubik, sans-serif", padding: 20,
  },
  card: {
    background: "#171512", border: "1px solid #33291A", borderRadius: 16, padding: "32px 28px",
    width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  iconWrap: { width: 46, height: 46, borderRadius: 999, background: "#C9A227", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "'Frank Ruhl Libre', serif", fontSize: 22, color: "#F3ECD8", margin: 0 },
  subtitle: { fontSize: 13, color: "#A99B7A", margin: "0 0 8px" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #33291A", background: "#0A0908", color: "#F3ECD8", fontSize: 14 },
  error: { color: "#E2694A", fontSize: 13, margin: 0 },
  button: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#C9A227", color: "#15140F", fontWeight: 600, fontSize: 14, cursor: "pointer" },
};
