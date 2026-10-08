export const VENUE = "Rivapark Floor UG Deli Park Medan";
// DeliPark Mall Medan.
export const LAT_LNG = "3.5940757,98.6745569";
export const MAP_EMBED_URL = `https://www.google.com/maps?q=${LAT_LNG}&z=16&output=embed`;
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${LAT_LNG}`;

export const INSTAGRAM = "beybladeofmedan";
export const PARTNER_EMAIL = "admin@beybladeofmedan.com";
// Invite links get reset when they leak, so the WhatsApp one lives in env, not code.
export const WHATSAPP_INVITE = process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL;
