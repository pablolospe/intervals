import { describe, expect, it } from "vitest";
import { getMascotCharacter } from "./mascot";

describe("getMascotCharacter", () => {
  it("maps intervals to their respective mascot characters", () => {
    expect(getMascotCharacter("m2-asc")).toBe("jaws");
    expect(getMascotCharacter("m3-desc")).toBe("mccartney");
    expect(getMascotCharacter("TT-asc")).toBe("homer");
    expect(getMascotCharacter("M6-asc")).toBe("gardel");
  });

  it("returns null for intervals without mascot", () => {
    expect(getMascotCharacter("M2-asc")).toBeNull();
    expect(getMascotCharacter("m6-asc")).toBeNull();
    expect(getMascotCharacter("P5-asc")).toBeNull();
    expect(getMascotCharacter(null)).toBeNull();
    expect(getMascotCharacter(undefined)).toBeNull();
  });
});

