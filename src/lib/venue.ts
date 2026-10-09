export const VENUE = "Rivapark Floor UG Deli Park Medan";
// DeliPark Mall Medan.
export const LAT_LNG = "3.5940757,98.6745569";
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${LAT_LNG}&z=16&output=embed`;
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT_LNG}`;

export const INSTAGRAM = "beybladeofmedan";
/** Public address of the site, used in links that leave it (the QR code on the member card). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.beybladeofmedan.com").replace(/\/$/, "");
export const PARTNER_EMAIL = "admin@beybladeofmedan.com";
export const GATHERING_SCHEDULE = "Weekly Every Saturday Night";
// Invite links get reset when they leak, so the WhatsApp one lives in env, not code.
export const WHATSAPP_INVITE = process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL;

export const PAYMENT_ACCOUNT = "QRIS or Transfer to Jago: 1077 9921 7068 a/n Dedy Wahyudi";
export const ADMIN_WHATSAPP = "+62817824114";
export const ADMIN_WHATSAPP_URL = "https://wa.me/62817824114";
