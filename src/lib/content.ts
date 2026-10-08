export const funnel = [
  ["Try", "Pojok coba di tiap gathering. Launcher, bey, stadium disediakan. Nol syarat."],
  ["Learn", "Sesi 15 menit: cara launch, cara baca combo, aturan dasar."],
  ["Play", "Casual battle dengan member. Tidak dihitung poin, tidak ada tekanan."],
  ["Join", "Daftar BOM ID, masuk grup WA, dapat kartu, masuk leaderboard."],
  ["Compete", "Ranked pertama. Poin pertama jadi alasan kembali minggu depan."],
] as const;

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

export const competitionPath = [
  ["Ranked", "Weekly", "The entry point and source of seasonal points."],
  ["Cup", "Monthly", "Official BOM brackets."],
  ["Major", "Quarterly", "Bigger prizes and sponsors."],
  ["Championship", "Yearly", "The BOM title."],
] as const;

/** Headline numbers for the homepage and About BOM. Member count is a hand-kept estimate. */
export const communityStats = (subCount: number) => ["50+ active members", `${subCount} Sub Komunitas`, "Ranked every week", "Cup every month"];
