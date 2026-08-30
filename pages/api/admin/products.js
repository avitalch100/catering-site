import { airtableRequest, TABLES } from "../../../lib/airtable";

function buildFields(body) {
  const { name, description, price, servings, inStock, featured, categoryId, colors, image } = body;
  const fields = {
    "שם המנה": name,
    "תיאור": description || "",
    "מחיר": Number(price) || 0,
    "מספר סועדים מומלץ": Number(servings) || 1,
    "במלאי": inStock !== false,
    "מומלץ": !!featured,
    "קטגוריה": categoryId ? [categoryId] : [],
  };
  const colorList = (colors || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (colorList.length) fields["צבעים זמינים"] = colorList;
  if (image && image.trim()) fields["תמונה"] = [{ url: image.trim() }];
  return fields;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await airtableRequest(TABLES.products);
      return res.status(200).json(
        data.records.map((r) => ({
          id: r.id,
          name: r.fields["שם המנה"] || "",
          description: r.fields["תיאור"] || "",
          price: r.fields["מחיר"] || 0,
          servings: r.fields["מספר סועדים מומלץ"] || 1,
          inStock: r.fields["במלאי"] !== false,
          featured: !!r.fields["מומלץ"],
          categoryId: (r.fields["קטגוריה"] || [])[0] || "",
          colors: (r.fields["צבעים זמינים"] || []).join(", "),
          image: Array.isArray(r.fields["תמונה"]) && r.fields["תמונה"][0] ? r.fields["תמונה"][0].url : "",
        }))
      );
    }

    if (req.method === "POST") {
      if (!req.body?.name?.trim()) return res.status(400).json({ error: "נא למלא שם מנה" });
      const data = await airtableRequest(TABLES.products, { method: "POST", body: { fields: buildFields(req.body) } });
      return res.status(200).json({ id: data.id });
    }

    if (req.method === "PATCH") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "חסר מזהה" });
      await airtableRequest(TABLES.products, { method: "PATCH", recordId: id, body: { fields: buildFields(req.body) } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "חסר מזהה" });
      await airtableRequest(TABLES.products, { method: "DELETE", recordId: id });
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
