import { describe, expect, it } from "vitest";

// Run against a started server: SMOKE_URL=http://localhost:3000 npm test
const base = process.env.SMOKE_URL;

describe.skipIf(!base)("smoke", () => {
  it.each(["/", "/leaderboard", "/kompetisi", "/komunitas", "/daftar"])("%s returns 200", async (path) => {
    expect((await fetch(base + path)).status).toBe(200);
  });
  it("sends security headers", async () => {
    const res = await fetch(base + "/");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });
  it("redirects /admin to login when anonymous or shows setup note", async () => {
    expect((await fetch(base + "/admin", { redirect: "manual" })).status).toBeLessThan(400);
  });
});
