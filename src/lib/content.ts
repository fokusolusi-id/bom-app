import type { Tier } from "@/lib/data";

export const tiers: { tier: Tier | "Casual / Try"; freq: string; desc: string }[] = [
  { tier: "Championship", freq: "Tahunan", desc: "Flagship. Mengundang komunitas Sumatera lain. Juara jadi wakil BOM ke G1." },
  { tier: "Major", freq: "Kuartalan", desc: "Turnamen besar, hadiah sponsor, format resmi Beyblade X 3-on-3." },
  { tier: "Cup", freq: "Bulanan", desc: "Poin ranking dobel, pemenang masuk Wall of Fame." },
  { tier: "Ranked", freq: "Mingguan", desc: "Gathering ranked di tiap sub komunitas. Poin masuk satu leaderboard bersama." },
  { tier: "Casual / Try", freq: "Tiap gathering", desc: "Pojok coba, beginner battle, parent dan kid. Pintu masuk tanpa syarat." },
];

export const path = [
  ["BOM Ranked", "Medan • mingguan", true],
  ["BOM Championship", "Medan • tahunan", true],
  ["G1 Indonesia", "Jakarta", false],
  ["SEA Cup", "Regional • 2026", false],
  ["World Championship", "Jepang", false],
] as const;

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
] as const;

export const umbrella = [
  "Satu dokumen rules, satu suara wasit",
  "HTM seragam untuk tiap jenis event",
  "Satu leaderboard untuk semua sub komunitas",
];
