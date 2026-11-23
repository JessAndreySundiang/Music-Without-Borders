import { describe, expect, it } from "vitest";
import {
  EMPTY_STORY_SUBMISSION,
  STORY_BODY_MIN,
  STORY_CATEGORIES,
  getCategoryLabel,
  mapStorySubmissionErrors,
  validateStorySubmission,
  type StorySubmissionValues,
} from "./storySubmission";

function validValues(overrides: Partial<StorySubmissionValues> = {}): StorySubmissionValues {
  return {
    ...EMPTY_STORY_SUBMISSION,
    title: "A Saturday at the Plaza",
    author_name: "Mara Dela Cruz",
    author_email: "mara@example.com",
    author_role: "Audience member",
    category: "community",
    body: "The band set up in the plaza and the neighbors sang along. ".repeat(5),
    consent: true,
    ...overrides,
  };
}

describe("validateStorySubmission", () => {
  it("accepts a complete submission", () => {
    expect(validateStorySubmission(validValues())).toEqual({});
  });

  it("allows an empty optional role", () => {
    expect(validateStorySubmission(validValues({ author_role: "" }))).toEqual({});
  });

  it("trims values before checking their length", () => {
    expect(validateStorySubmission(validValues({ title: "     A valid title     " }))).toEqual({});
  });

  it("requires a title of at least five characters", () => {
    const errors = validateStorySubmission(validValues({ title: "Hey" }));

    expect(errors.title).toContain("at least 5");
  });

  it("rejects a title over the maximum length", () => {
    const errors = validateStorySubmission(validValues({ title: "x".repeat(121) }));

    expect(errors.title).toContain("120");
  });

  it("requires a name and a valid email address", () => {
    const errors = validateStorySubmission(
      validValues({ author_name: " ", author_email: "not-an-email" }),
    );

    expect(errors.author_name).toBeTruthy();
    expect(errors.author_email).toBe("Enter a valid email address.");
  });

  it("rejects a one-character role when one is supplied", () => {
    const errors = validateStorySubmission(validValues({ author_role: "x" }));

    expect(errors.author_role).toContain("at least 2");
  });

  it("requires a story body of at least the minimum length", () => {
    const errors = validateStorySubmission(validValues({ body: "x".repeat(STORY_BODY_MIN - 1) }));

    expect(errors.body).toContain("at least 200");
    expect(errors.body).toContain("You have 199");
  });

  it("accepts a body exactly at the minimum length", () => {
    expect(validateStorySubmission(validValues({ body: "x".repeat(STORY_BODY_MIN) }))).toEqual({});
  });

  it("requires explicit consent", () => {
    const errors = validateStorySubmission(validValues({ consent: false }));

    expect(errors.consent).toBe("Please confirm that your story may be published.");
  });

  it("validates optional cover image URL to require https", () => {
    expect(
      validateStorySubmission(
        validValues({ cover_image_url: "https://images.example.com/plaza.jpg" }),
      ),
    ).toEqual({});

    const insecureError = validateStorySubmission(
      validValues({ cover_image_url: "http://images.example.com/plaza.jpg" }),
    );
    expect(insecureError.cover_image_url).toContain("valid HTTPS");

    const invalidError = validateStorySubmission(
      validValues({ cover_image_url: "not-a-valid-url" }),
    );
    expect(invalidError.cover_image_url).toContain("valid HTTPS");
  });

  it("accepts valid categories and rejects unknown categories", () => {
    expect(validateStorySubmission(validValues({ category: "concert" }))).toEqual({});
    expect(validateStorySubmission(validValues({ category: "rehearsal" }))).toEqual({});
    expect(validateStorySubmission(validValues({ category: "lending-library" }))).toEqual({});
    expect(validateStorySubmission(validValues({ category: "community" }))).toEqual({});

    // @ts-expect-error testing invalid category
    const error = validateStorySubmission(validValues({ category: "invalid-category" }));
    expect(error.category).toBe("Please select a valid category.");
  });
});

describe("getCategoryLabel and STORY_CATEGORIES", () => {
  it("provides user-friendly labels for each category", () => {
    expect(getCategoryLabel("community")).toBe("Community Outreach");
    expect(getCategoryLabel("concert")).toBe("Concert");
    expect(getCategoryLabel("rehearsal")).toBe("Rehearsal");
    expect(getCategoryLabel("lending-library")).toBe("Lending Library");
    expect(getCategoryLabel(undefined)).toBe("Community Outreach");
    expect(getCategoryLabel("unknown-category")).toBe("unknown-category");
  });

  it("lists all four approved categories", () => {
    expect(STORY_CATEGORIES).toHaveLength(4);
    expect(STORY_CATEGORIES.map((c) => c.value)).toEqual([
      "community",
      "concert",
      "rehearsal",
      "lending-library",
    ]);
  });
});

describe("mapStorySubmissionErrors", () => {
  it("maps known fields to field errors", () => {
    const result = mapStorySubmissionErrors({
      title: ["The title is required."],
      body: ["The story is too short."],
      author_email: ["The email is invalid."],
    });

    expect(result.fieldErrors).toEqual({
      title: "The title is required.",
      body: "The story is too short.",
      author_email: "The email is invalid.",
    });
    expect(result.generalError).toBeNull();
  });

  it("keeps honeypot or unknown errors as a general notice", () => {
    const result = mapStorySubmissionErrors({
      website: ["This submission could not be accepted."],
    });

    expect(result.fieldErrors).toEqual({});
    expect(result.generalError).toBe("This submission could not be accepted.");
  });
});
