import { describe, expect, it } from "vitest";
import { teamMembers } from "./team";

describe("Team roster", () => {
  it("lists the five confirmed members in hierarchy order", () => {
    expect(teamMembers.map((member) => member.name)).toEqual([
      "Jess Andrey Sundiang",
      "Michaela Angela Libut",
      "Rica Loraine Tuvillara",
      "Frederick Charles Castro",
      "Kiiyo De Leon",
    ]);
  });

  it("uses the confirmed real-world positions", () => {
    expect(Object.fromEntries(teamMembers.map((member) => [member.name, member.role]))).toEqual({
      "Jess Andrey Sundiang": "President",
      "Michaela Angela Libut": "Secretary",
      "Rica Loraine Tuvillara": "Treasurer",
      "Frederick Charles Castro": "Librarian",
      "Kiiyo De Leon": "Section Principal",
    });
  });

  it("has unique ids and names", () => {
    expect(new Set(teamMembers.map((member) => member.id)).size).toBe(teamMembers.length);
    expect(new Set(teamMembers.map((member) => member.name)).size).toBe(teamMembers.length);
  });

  it("gives every member a portrait and descriptive alt text", () => {
    for (const member of teamMembers) {
      expect(member.image).toBeTruthy();
      expect(member.imageAlt).toBe(`Portrait of ${member.name}`);
    }
  });

  it("does not store personal details on the public roster", () => {
    for (const member of teamMembers) {
      expect(member).not.toHaveProperty("age");
      expect(member).not.toHaveProperty("course");
      expect(member).not.toHaveProperty("school");
      expect(member).not.toHaveProperty("address");
      expect(member).not.toHaveProperty("phone");
    }
  });
});
