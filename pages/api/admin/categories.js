import { airtableRequest, TABLES } from "../../../lib/airtable";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await airtableRequest(TABLES.categories, {
        query: `?sort%5B0%5D%5Bfield%5D=${encodeURIComponent("סדר תצוגה")}`,
      });
      return res.status(200).json(
        data.records.map((r) => ({
          id: r.id,
          name: r.fields["שם"] || "",
          order: r.fields["סדר תצוגה"] ?? 0,
          active: r.fields["פעיל"] !== false,
        }))
      );
    }

    if (req.method === "POST") {
      const { name, order, active } = req.body || {};
      if (!name || !name.trim()) return res.status(400).json({ error: "נא למלא שם קטגוריה" });
      const data = await airtableRequest(TABLES.categories, {
        method: "POST",
        body: { fields: { "שם": name, "סדר תצוגה": Number(order) || 0, "פעיל": active !== false } },
      });
      return res.status(200).json({ id: data.id });
    }

    if (req.method === "PATCH") {
      const { id, name, order, active } = req.body || {};
      if (!id) return res.status(400).json({ error: "חסר מזהה" });
      await airtableRequest(TABLES.categories, {
        method: "PATCH",
        recordId: id,
        body: { fields: { "שם": name, "סדר תצוגה": Number(order) || 0, "פעיל": active !== false } },
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "חסר מזהה" });
      await airtableRequest(TABLES.categories, { method: "DELETE", recordId: id });
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
