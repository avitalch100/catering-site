// פונקציית שרת (Serverless) - רצה על Vercel, לא בדפדפן.
// היא היחידה שמכירה את ה-Token הסודי (process.env.AIRTABLE_TOKEN),
// כך שהוא אף פעם לא נחשף בקוד שהלקוח מוריד.

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

const TABLES = {
  categories: "קטגוריות",
  products: "מוצרים",
  orders: "הזמנות",
};

async function airtableGet(table, params = "") {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable error (${res.status}): ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({
      error: "חסרים משתני סביבה AIRTABLE_TOKEN / AIRTABLE_BASE_ID בשרת",
    });
  }

  try {
    const [catData, prodData, orderData] = await Promise.all([
      airtableGet(
        TABLES.categories,
        `?sort%5B0%5D%5Bfield%5D=${encodeURIComponent("סדר תצוגה")}`
      ),
      airtableGet(TABLES.products),
      airtableGet(
        TABLES.orders,
        `?filterByFormula=${encodeURIComponent(
          `AND({תאריך האירוע} != '', {סטטוס} != 'בוטל')`
        )}&fields%5B%5D=${encodeURIComponent("תאריך האירוע")}`
      ),
    ]);

    const categories = catData.records
      .filter((r) => r.fields["פעיל"] !== false)
      .map((r) => ({
        id: r.id,
        name: r.fields["שם"] || "",
        order: r.fields["סדר תצוגה"] || 0,
      }))
      .sort((a, b) => a.order - b.order);

    const products = prodData.records.map((r) => ({
      id: r.id,
      name: r.fields["שם המנה"] || "",
      description: r.fields["תיאור"] || "",
      price: r.fields["מחיר"] || 0,
      servings: r.fields["מספר סועדים מומלץ"] || 1,
      inStock: r.fields["במלאי"] !== false,
      featured: !!r.fields["מומלץ"],
      categoryIds: r.fields["קטגוריה"] || [],
      colors: r.fields["צבעים זמינים"] || [],
      image:
        Array.isArray(r.fields["תמונה"]) && r.fields["תמונה"][0]
          ? r.fields["תמונה"][0].url
          : null,
    }));

    const unavailableDates = Array.from(
      new Set(
        orderData.records
          .map((r) => r.fields["תאריך האירוע"])
          .filter(Boolean)
      )
    );

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({ categories, products, unavailableDates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בקריאת הנתונים מ-Airtable" });
  }
}
