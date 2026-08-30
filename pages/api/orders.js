const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;
const ORDERS_TABLE = "הזמנות";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({
      error: "חסרים משתני סביבה AIRTABLE_TOKEN / AIRTABLE_BASE_ID בשרת",
    });
  }

  const { name, phone, date, address, notes, items, total } = req.body || {};

  // ולידציה בסיסית בצד השרת - לעולם לא סומכים רק על ולידציה בצד הלקוח
  if (!name || !phone || !date || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "חסרים שדות חובה בהזמנה" });
  }

  const itemsSummary = items
    .map(
      (i) =>
        `${i.name}${i.color ? ` (${i.color})` : ""} x${i.qty} - ₪${i.price * i.qty}`
    )
    .join("\n");

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(
      ORDERS_TABLE
    )}`;
    const airtableRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "שם הלקוח": name,
          טלפון: phone,
          "תאריך האירוע": date,
          כתובת: address,
          הערות: notes || "",
          "פריטי ההזמנה": itemsSummary,
          "מחיר כולל": total,
          סטטוס: "חדש",
        },
      }),
    });

    if (!airtableRes.ok) {
      const text = await airtableRes.text();
      console.error("Airtable create order failed:", text);
      return res.status(502).json({ error: "שמירת ההזמנה נכשלה, נסי שוב" });
    }

    const record = await airtableRes.json();

    // שליחת מייל התראה לבעל העסק - לא חוסמת את ההזמנה אם נכשלת
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.NOTIFY_FROM_EMAIL || "onboarding@resend.dev",
            to: process.env.NOTIFY_EMAIL,
            subject: `הזמנה חדשה מ-${name} · ${date}`,
            text:
              `התקבלה הזמנה חדשה באתר:\n\n` +
              `שם: ${name}\nטלפון: ${phone}\nתאריך אירוע: ${date}\nכתובת: ${address}\n` +
              `הערות: ${notes || "-"}\n\nפריטים:\n${itemsSummary}\n\nסה"כ: ₪${total}`,
          }),
        });
      } catch (mailErr) {
        console.error("Email notify failed:", mailErr);
      }
    }

    res.status(200).json({ ok: true, id: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאת שרת בשמירת ההזמנה" });
  }
}
