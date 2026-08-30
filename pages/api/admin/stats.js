import { airtableRequest, TABLES } from "../../../lib/airtable";

export default async function handler(req, res) {
  try {
    const [prod, cat, ord] = await Promise.all([
      airtableRequest(TABLES.products),
      airtableRequest(TABLES.categories),
      airtableRequest(TABLES.orders),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = today.slice(0, 7);

    const ordersThisMonth = ord.records.filter((r) => (r.fields["תאריך האירוע"] || "").startsWith(monthPrefix));
    const revenueThisMonth = ordersThisMonth.reduce((sum, r) => sum + (r.fields["מחיר כולל"] || 0), 0);

    const upcoming = ord.records
      .filter((r) => r.fields["תאריך האירוע"] && r.fields["תאריך האירוע"] >= today && r.fields["סטטוס"] !== "בוטל")
      .sort((a, b) => a.fields["תאריך האירוע"].localeCompare(b.fields["תאריך האירוע"]))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        name: r.fields["שם הלקוח"] || "",
        date: r.fields["תאריך האירוע"],
        total: r.fields["מחיר כולל"] || 0,
        status: r.fields["סטטוס"] || "חדש",
      }));

    const outOfStock = prod.records.filter((r) => r.fields["במלאי"] === false).length;

    res.status(200).json({
      productsCount: prod.records.length,
      categoriesCount: cat.records.length,
      ordersCount: ord.records.length,
      ordersThisMonthCount: ordersThisMonth.length,
      revenueThisMonth,
      outOfStock,
      upcoming,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
