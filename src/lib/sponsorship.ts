/**
 * The sponsor packages. `price` is internal: the public Sponsorship page shows "Price on request", and the prices are only
 * in the admin (Home > Sponsorship). `benefits` are public.
 */
export const sponsorPackages = [
  {
    tier: "Gold",
    role: "Main sponsor",
    price: "Rp 7.5 million cash",
    benefits: ["Tournament named after you: \"BK2 Major presented by …\"", "Your backdrop and booth at the event", "The main prize in your name"],
  },
  {
    tier: "Silver",
    role: "Venue partner",
    price: "Rp 5 million cash",
    benefits: ["30-50 people at your venue every week", "Location content about your venue", "Tag on our TikTok"],
  },
  {
    tier: "Bronze",
    role: "Store partner",
    price: "Rp 2.5 million per month",
    benefits: ["Your logo on the recap posters and the leaderboard", "A mention in our content", "A discount for our members"],
  },
] as const;

/**
 * Other ways to work with us. `text` is for the admin (fees, partner names); `offer` is the public wording, with no prices or names.
 */
export const otherIncomeIdeas = [
  { title: "On-demand events", text: "Malls, schools and birthdays hire BOM. Fee Rp 1.5-3 million, plus the stadium and a referee.", offer: "Malls, schools and birthday parties can invite us to run a Beyblade X event, with the stadium and a referee." },
  { title: "Official reseller", text: "Sell starters and boosters at the gatherings at a reseller margin (ask ToysPedia and Gear Sport).", offer: "Sell starters and boosters at our gatherings as an official reseller." },
  { title: "Content affiliate", text: "Tokopedia affiliate links on TikTok and Instagram. Small, and needs no capital.", offer: "Work with us on content, with affiliate links on our TikTok and Instagram." },
  { title: "Coaching", text: "Private or group sessions for kids and parents, Rp 50-100 thousand per person.", offer: "Private or group coaching sessions for kids and parents." },
] as const;
