import { describe, expect, it } from "vitest";
import { getMascotCharacter, getMascotLabel, getMascotReaction } from "./mascot";

describe("getMascotCharacter", () => {
  it("maps intervals to their respective mascot characters", () => {
    expect(getMascotCharacter("m2-asc")).toBe("jaws");
    expect(getMascotCharacter("m2-desc")).toBe("beethoven");
    expect(getMascotCharacter("M2-asc")).toBe("cake");
    expect(getMascotCharacter("m3-asc")).toBe("deep-purple");
    expect(getMascotCharacter("m3-desc")).toBe("mccartney");
    expect(getMascotCharacter("M2-desc")).toBe("mccartney");
    expect(getMascotCharacter("M3-asc")).toBe("armstrong");
    expect(getMascotCharacter("M3-desc")).toBe("beethoven");
    expect(getMascotCharacter("P4-asc")).toBe("bride");
    expect(getMascotCharacter("P4-desc")).toBe("mozart");
    expect(getMascotCharacter("TT-asc")).toBe("homer");
    expect(getMascotCharacter("TT-desc")).toBe("pearl-jam");
    expect(getMascotCharacter("P5-asc")).toBe("luke");
    expect(getMascotCharacter("P5-desc")).toBe("flintstones");
    expect(getMascotCharacter("m6-asc")).toBe("lennon");
    expect(getMascotCharacter("m6-desc")).toBe("jobim");
    expect(getMascotCharacter("M6-asc")).toBe("gardel");
    expect(getMascotCharacter("M6-desc")).toBe("radiohead");
    expect(getMascotCharacter("m7-asc")).toBe("abba");
    expect(getMascotCharacter("m7-desc")).toBe("gershwin");
    expect(getMascotCharacter("M7-asc")).toBe("aha");
    expect(getMascotCharacter("M7-desc")).toBe("porter");
    expect(getMascotCharacter("P8-asc")).toBe("judy");
    expect(getMascotCharacter("P8-desc")).toBe("gieco");
  });

  it("returns null for intervals without mascot", () => {
    expect(getMascotCharacter("unknown")).toBeNull();
    expect(getMascotCharacter(null)).toBeNull();
    expect(getMascotCharacter(undefined)).toBeNull();
  });

  it("returns artist/band labels for mapped intervals and null otherwise", () => {
    expect(getMascotLabel("m2-desc")).toBe("Ludwig van Beethoven");
    expect(getMascotLabel("M2-asc")).toBe("la torta");
    expect(getMascotLabel("M3-desc")).toBe("Ludwig van Beethoven");
    expect(getMascotLabel("m3-asc")).toBe("Ritchie Blackmore · Deep Purple");
    expect(getMascotLabel("M3-asc")).toBe("Louis Armstrong");
    expect(getMascotLabel("P4-asc")).toBe("la novia");
    expect(getMascotLabel("P4-desc")).toBe("Wolfgang Amadeus Mozart");
    expect(getMascotLabel("M2-desc")).toBe("Paul McCartney · The Beatles");
    expect(getMascotLabel("m6-asc")).toBe("John Lennon");
    expect(getMascotLabel("m6-desc")).toBe("Tom Jobim");
    expect(getMascotLabel("M6-desc")).toBe("Thom Yorke de Radiohead");
    expect(getMascotLabel("m7-asc")).toBe("Agnetha de ABBA");
    expect(getMascotLabel("m7-desc")).toBe("George Gershwin");
    expect(getMascotLabel("M7-asc")).toBe("Morten de A-ha");
    expect(getMascotLabel("M7-desc")).toBe("Cole Porter");
    expect(getMascotLabel("TT-desc")).toBe("Eddie de Pearl Jam");
    expect(getMascotLabel("P8-asc")).toBe("Judy Garland");
    expect(getMascotLabel("P8-desc")).toBe("León Gieco");
    expect(getMascotLabel("unknown")).toBeNull();
    expect(getMascotLabel(null)).toBeNull();
  });

  it("formats happy and sad artist reaction messages with optional fallback", () => {
    expect(getMascotReaction("M6-desc", "happy")).toBe("Pusiste feliz a Thom Yorke · Radiohead");
    expect(getMascotReaction("M6-desc", "sad")).toBe("Thom Yorke de Radiohead está enojado!");
    expect(getMascotReaction("P8-asc", "happy")).toBe("Pusiste feliz a Judy Garland");
    expect(getMascotReaction("P4-asc", "happy")).toBe("Pusiste feliz a la novia");
    expect(getMascotReaction("P4-asc", "sad")).toBe("La novia está triste");
    expect(getMascotReaction("unknown", "happy", "Wagner")).toBe("Pusiste feliz a Wagner");
    expect(getMascotReaction("unknown", "sad", "Wagner")).toBe("Wagner está triste");
    expect(getMascotReaction("unknown", "happy")).toBeNull();
  });
});

