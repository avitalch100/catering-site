export function toWhatsAppPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export function orderWhatsAppMessage(order) {
  return (
    `שלום ${order.name}, מאשרים קבלת ההזמנה לאירוע בתאריך ${order.date}.\n\n` +
    `פריטים:\n${order.items}\n\n` +
    `סה"כ: ₪${Number(order.total || 0).toLocaleString("he-IL")}\n\n` +
    `תודה שבחרת בנו!`
  );
}

export function buildWhatsAppLink(phone, message) {
  return `https://wa.me/${toWhatsAppPhone(phone)}?text=${encodeURIComponent(message)}`;
}
