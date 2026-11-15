import { describe, expect, it } from "vitest";
import {
  instrumentFamilies,
  instrumentImage,
  instruments,
  instrumentsForFamily,
} from "./instruments";

describe("instrument gallery data", () => {
  it("uses every supplied instrument image exactly once", () => {
    expect(instruments).toHaveLength(17);
    expect(new Set(instruments.map((instrument) => instrument.image)).size).toBe(17);
  });

  it("resolves every image through Vite's asset pipeline", () => {
    for (const instrument of instruments) {
      expect(instrumentImage(instrument.image), instrument.id).toBeTruthy();
    }
  });

  it("groups instruments into the four band families", () => {
    expect(instrumentFamilies).toHaveLength(4);
    expect(instrumentsForFamily("woodwinds")).toHaveLength(5);
    expect(instrumentsForFamily("brass")).toHaveLength(3);
    expect(instrumentsForFamily("strings")).toHaveLength(3);
    expect(instrumentsForFamily("percussion")).toHaveLength(6);
  });
});
