export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "לא הוגדרה סיסמת ניהול (ADMIN_PASSWORD) בשרת" });
  }

  if (password && password === process.env.ADMIN_PASSWORD) {
    const isProd = process.env.NODE_ENV === "production";
    res.setHeader(
      "Set-Cookie",
      `cc_admin_auth=${encodeURIComponent(password)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 14}${isProd ? "; Secure" : ""}`
    );
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: "סיסמה שגויה" });
}
