import { airtableRequest, TABLES } from "../../../lib/airtable";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await airtableRequest(TABLES.orders, {
        query: `?sort%5B0%5D%5Bfield%5D=${encodeURIComponent("תאריך האירוע")}&sort%5B0%5D%5Bdirection%5D=desc`,
      });
      let records = data.records.map((r) => ({
        id: r.id,
        name: r.fields["שם הלקוח"] || "",
        phone: r.fields["טלפון"] || "",
        date: r.fields["תאריך האירוע"] || "",
        address: r.fields["כתובת"] || "",
        notes: r.fields["הערות"] || "",
        items: r.fields["פריטי ההזמנה"] || "",
        total: r.fields["מחיר כולל"] || 0,
        status: r.fields["סטטוס"] || "חדש",
        createdAt: r.createdTime,
      }));

      const { from, to } = req.query;
      if (from) records = records.filter((o) => o.date && o.date >= from);
      if (to) records = records.filter((o) => o.date && o.date <= to);

      return res.status(200).json(records);
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: "חסרים נתונים" });
      await airtableRequest(TABLES.orders, { method: "PATCH", recordId: id, body: { fields: { "סטטוס": status } } });
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
