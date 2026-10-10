import type { PointsTable } from "@/domain/points-table";
import type { RulesPage } from "@/domain/rules-page";
export const subs = [
  ["Turcil", "Saturday night"],
  ["DXM", "Saturday night"],
  ["3R WAR", "Saturday night"],
  ["Beyground", "Thursday night"],
  ["Doys Party", "Saturday night"],
] as const;

export const umbrella = [
  "One rulebook, one voice for every judge",
  "One entry fee for every type of event",
  "One leaderboard for every sub community",
];

/** [tier, how often, what it is]. Points are not listed here: the ladder shows each level's multiplier from the domain. */
export const competitionPath = [
  ["Unrank", "Random, TBA", ["Fun special-format events: gimmick battles, team play and mini tourneys.", "Themed battles and experimental game modes.", "No ranking points: enjoy the game, test new strategies and have fun with the community."]],
  ["Ranked", "Weekly", ["A regular gathering with consistent prizes and ranking points.", "Ideal for climbing the rankings and winning the season prize.", "Can also serve as a qualifier for larger tournaments."]],
  ["Cup", "Monthly", ["Official BOM brackets with bigger ranking points.", "Winners earn a place on the Wall of Fame."]],
  ["Major", "Quarterly", ["High-stakes competition with big prizes and sponsor support.", "Attracts the best players and shapes the leaderboard standings.", "Played in the official Beyblade X 3-on-3 format."]],
  ["Championship", "Yearly", ["The highest and most prestigious tier of BOM tournaments.", "Bladers from across Sumatera, with exclusive prizes.", "The champion represents BOM at G1."]],
] as const;

export type CommunityCounts = { members: number; subCommunities: number; weeklyRanked: number };

/** Headline numbers, split into the figure and its label so the homepage can highlight the figure. All come from live data. */
export const communityNumbers = ({ members, subCommunities, weeklyRanked }: CommunityCounts) => [
  { value: String(members), label: "active members" },
  { value: String(subCommunities), label: "Sub Communities" },
  { value: String(weeklyRanked), label: "Weekly Ranked" },
  { value: "Monthly", label: "Cup" },
];

/** The same numbers as one-line badges for About BOM. */
export const communityStats = (counts: CommunityCounts) => communityNumbers(counts).map(({ value, label }) => `${value} ${label}`);

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

/** Default "How points are distributed" table, used until an admin edits it (and if it cannot be loaded). Source: the BOM points sheet. */
export const DEFAULT_POINTS_TABLE: PointsTable = {
  sizes: ["< 39", "40", "50", "60", "70", "80", "90"],
  ranks: [
    { label: "1", values: [4, 5, 6, 7, 8, 9, 10] },
    { label: "2", values: [3, 4, 5, 6, 7, 8, 9] },
    { label: "3", values: [2, 3, 4, 5, 6, 7, 8] },
    { label: "4", values: [1, 2, 3, 4.5, 5.5, 6.5, 7] },
    { label: "5", values: [0, 0, 0, 2.5, 3.5, 4.5, 6] },
    { label: "6", values: [0, 0, 0, 2, 3, 4, 5] },
    { label: "7", values: [0, 0, 0, 1.5, 2, 3, 4] },
    { label: "8", values: [0, 0, 0, 1, 1.5, 2, 3] },
  ],
  categories: [
    { label: "Participant", values: [0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1] },
    { label: "Top Cut", values: [0.5, 0.65, 0.75, 1, 1.25, 1.5, 2] },
    { label: "Tiger King", values: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.5] },
  ],
  note: "Positions 1-4 do not get points for Top Cut.",
};

/** The Rules page until an admin edits it (and if it cannot be loaded). */
export const DEFAULT_RULES_PAGE: RulesPage = {
  intro: "One rulebook and one voice for every judge across all BOM sub communities.",
  rulebooks: [
    {
      title: "Takara Tomy Regulations",
      note: "12th Edition, March 2026",
      href: "https://img1.wsimg.com/blobby/go/b90a29fa-631a-4c1e-b027-1e57d0b85847/BeyBladeXRegulation12thMarch2026.pdf",
    },
  ],
  summary: "A summary of the BOM rules (3-on-3 format, finish points, decks and penalties) is coming soon.",
};
