// pages/api/availability.js
// בודק אם תאריך פנוי. מחזיר רק סטטוס, בלי פרטי לקוחות.
// שימוש: /api/availability?date=25/12/2026  (או 2026-12-25)

const ORDERS_TABLE_ID = 'tblqjrVnrWh4CgDpC'; // טבלת הזמנות

function toIso(input) {
  const s = String(input || '').trim();
  let y, mo, d;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    [, y, mo, d] = m;
  } else {
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (!m) return null;
    [, d, mo, y] = m;
  }
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  if (
    dt.getUTCFullYear() !== +y ||
    dt.getUTCMonth() !== +mo - 1 ||
    dt.getUTCDate() !== +d
  ) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const iso = toIso(req.query.date);
  if (!iso) {
    return res.status(200).json({ status: 'invalid' });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (iso < today) {
    return res.status(200).json({ status: 'past', date: iso });
  }

  try {
    const token = (process.env.AIRTABLE_TOKEN || '').trim();
    const baseId = (process.env.AIRTABLE_BASE_ID || '').trim();

    const formula = `AND(DATETIME_FORMAT({תאריך האירוע},'YYYY-MM-DD')='${iso}',{סטטוס}!='בוטל')`;
    const url =
      `https://api.airtable.com/v0/${baseId}/${ORDERS_TABLE_ID}` +
      `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      return res.status(200).json({ status: 'error' });
    }
    const data = await r.json();
    const busy = Array.isArray(data.records) && data.records.length > 0;
    return res.status(200).json({ status: busy ? 'busy' : 'free', date: iso });
  } catch (e) {
    return res.status(200).json({ status: 'error' });
  }
}
