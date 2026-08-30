const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

export const TABLES = {
  categories: "קטגוריות",
  products: "מוצרים",
  orders: "הזמנות",
};

/**
 * קריאה גנרית ל-Airtable. תמיד רצה בצד השרת בלבד - הטוקן לעולם לא מגיע ללקוח.
 */
export async function airtableRequest(table, { method = "GET", recordId = "", body, query = "" } = {}) {
  if (!TOKEN || !BASE_ID) {
    const err = new Error("חסרים משתני סביבה AIRTABLE_TOKEN / AIRTABLE_BASE_ID בשרת");
    err.status = 500;
    throw err;
  }
  const path = recordId ? `${encodeURIComponent(table)}/${recordId}` : encodeURIComponent(table);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `שגיאת Airtable (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
