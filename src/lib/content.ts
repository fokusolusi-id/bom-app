export const subs = [
  ["Turcil", "Sabtu malam"],
  ["DXM", "Sabtu malam"],
  ["3R WAR", "Sabtu malam"],
  ["Beyground", "Kamis malam"],
  ["Doys Party", "Sabtu malam"],
] as const;

export const umbrella = [
  "Satu dokumen rules, satu suara wasit",
  "HTM seragam untuk tiap jenis event",
  "Satu leaderboard untuk semua sub komunitas",
];

/** [tier, how often, what it is]. Points are not listed here: the ladder shows each level's multiplier from the domain. */
export const competitionPath = [
  ["Unrank", "Random, TBA", ["A try corner and beginner battles.", "Parents and kids are welcome.", "Open to everyone, no requirements."]],
  ["Ranked", "Weekly", ["Held at every sub community.", "Every result feeds one shared leaderboard.", "The main engine of BOM."]],
  ["Cup", "Monthly", ["Official BOM brackets.", "Winners earn a place on the Wall of Fame."]],
  ["Major", "Quarterly", ["A big tournament with sponsor prizes.", "Played in the official Beyblade X 3-on-3 format."]],
  ["Championship", "Yearly", ["The flagship event of the year.", "Open to other Sumatera communities.", "The champion represents BOM at G1."]],
] as const;

/** Headline numbers for the homepage and About BOM. Member count is a hand-kept estimate. */
export const communityStats = (subCount: number) => ["50+ active members", `${subCount} Sub Komunitas`, "Ranked every week", "Cup every month"];

export const MEMBERSHIP_FEE = "IDR 100.000";

export const memberBenefits = [
  "Faster registration in weekly gath/cup",
  "Registered in BOM Leaderboard (Exclusive on www.beybladeofmedan.com)",
  "Special discount on Beyblade products from sponsors, partnered local hobby stores, and partnered cafes",
  "Priority seeding in certain tournaments.",
  "Special offers on BOM merchandise (t-shirts, stickers, lanyard, accessories)",
] as const;

export const registrationSteps = [
  ["Register", "Fill in the form, upload your payment screenshot and get your BOM ID right away."],
  ["Pay and get your card", `Pay ${MEMBERSHIP_FEE} once (QRIS or transfer) and upload the screenshot. The committee verifies it and contacts you on WhatsApp for your card.`],
  ["Come to Ranked", "Show up to a weekly Ranked session with your card. Your first match activates your ID and puts you on the leaderboard."],
] as const;

export const faq = [
  ["How much is membership?", `${MEMBERSHIP_FEE}, for the Emoney Membership Card.`],
  ["What do I get?", "Faster registration for gath and cup, a BOM Leaderboard spot, partner discounts, priority seeding in certain tournaments and special merchandise offers."],
  ["Can I join an event without a BOM ID?", "Yes. You can join an event without a BOM ID, you only need to pay the event fee. A BOM ID is for the leaderboard and the membership perks."],
  ["Do I need my own Beyblade?", "No. The Try corner at every gathering provides a launcher, a bey and a stadium."],
  ["Can kids join?", "Yes. Under 12 needs a guardian's name and WhatsApp number on the form."],
  ["Who sees my data?", "Only your blader name, BOM ID and results are public. Your full name, address and WhatsApp stay with the committee."],
] as const;
