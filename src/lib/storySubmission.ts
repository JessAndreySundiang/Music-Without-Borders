import type { StoryCategory } from "../types/Story";

export const STORY_TITLE_MIN = 5;
export const STORY_TITLE_MAX = 120;
export const STORY_AUTHOR_NAME_MIN = 2;
export const STORY_AUTHOR_NAME_MAX = 80;
export const STORY_AUTHOR_ROLE_MIN = 2;
export const STORY_AUTHOR_ROLE_MAX = 100;
export const STORY_BODY_MIN = 200;
export const STORY_BODY_MAX = 10_000;

export const STORY_CATEGORIES: ReadonlyArray<{ value: StoryCategory; label: string }> = [
  { value: "community", label: "Community Outreach" },
  { value: "concert", label: "Concert" },
  { value: "rehearsal", label: "Rehearsal" },
  { value: "lending-library", label: "Lending Library" },
];

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return "Community Outreach";
  }
  switch (category) {
    case "concert":
      return "Concert";
    case "rehearsal":
      return "Rehearsal";
    case "lending-library":
      return "Lending Library";
    case "community":
      return "Community Outreach";
    default:
      return category;
  }
}

export interface StorySubmissionValues {
  title: string;
  category: StoryCategory;
  author_name: string;
  author_email: string;
  author_role: string;
  body: string;
  cover_image_url: string;
  consent: boolean;
  website: string;
}

export type StorySubmissionFieldErrors = Partial<
  Record<
    | "title"
    | "category"
    | "author_name"
    | "author_email"
    | "author_role"
    | "body"
    | "cover_image_url"
    | "consent",
    string
  >
>;

export const EMPTY_STORY_SUBMISSION: StorySubmissionValues = {
  title: "",
  category: "community",
  author_name: "",
  author_email: "",
  author_role: "",
  body: "",
  cover_image_url: "",
  consent: false,
  website: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateStorySubmission(values: StorySubmissionValues): StorySubmissionFieldErrors {
  const errors: StorySubmissionFieldErrors = {};
  const title = values.title.trim();
  const authorName = values.author_name.trim();
  const authorEmail = values.author_email.trim();
  const authorRole = values.author_role.trim();
  const body = values.body.trim();
  const coverImageUrl = values.cover_image_url.trim();

  if (!title) {
    errors.title = "Enter a title for your story.";
  } else if (title.length < STORY_TITLE_MIN) {
    errors.title = `Use at least ${STORY_TITLE_MIN} characters for the title.`;
  } else if (title.length > STORY_TITLE_MAX) {
    errors.title = `Keep the title to ${STORY_TITLE_MAX} characters or fewer.`;
  }

  if (!authorName) {
    errors.author_name = "Enter the name that should appear with your story.";
  } else if (authorName.length < STORY_AUTHOR_NAME_MIN) {
    errors.author_name = `Use at least ${STORY_AUTHOR_NAME_MIN} characters for your name.`;
  } else if (authorName.length > STORY_AUTHOR_NAME_MAX) {
    errors.author_name = `Keep your name to ${STORY_AUTHOR_NAME_MAX} characters or fewer.`;
  }

  if (!authorEmail) {
    errors.author_email = "Enter an email address so we can reach you about the story.";
  } else if (!EMAIL_PATTERN.test(authorEmail)) {
    errors.author_email = "Enter a valid email address.";
  }

  if (authorRole && authorRole.length < STORY_AUTHOR_ROLE_MIN) {
    errors.author_role = `Use at least ${STORY_AUTHOR_ROLE_MIN} characters for your role, or leave it blank.`;
  } else if (authorRole.length > STORY_AUTHOR_ROLE_MAX) {
    errors.author_role = `Keep your role to ${STORY_AUTHOR_ROLE_MAX} characters or fewer.`;
  }

  if (!body) {
    errors.body = "Write your story before submitting.";
  } else if (body.length < STORY_BODY_MIN) {
    errors.body = `Your story needs at least ${STORY_BODY_MIN} characters. You have ${body.length}.`;
  } else if (body.length > STORY_BODY_MAX) {
    errors.body = `Keep your story to ${STORY_BODY_MAX.toLocaleString("en-PH")} characters or fewer.`;
  }

  if (values.category && !STORY_CATEGORIES.some((c) => c.value === values.category)) {
    errors.category = "Please select a valid category.";
  }

  if (coverImageUrl) {
    if (!isValidHttpsUrl(coverImageUrl)) {
      errors.cover_image_url =
        "Enter a valid HTTPS image URL (e.g. https://example.com/photo.jpg).";
    }
  }

  if (!values.consent) {
    errors.consent = "Please confirm that your story may be published.";
  }

  return errors;
}

/**
 * Turns Laravel's validation error bag into the fields the form renders.
 * Honeypot or unknown errors become a general notice instead of a field error.
 */
export function mapStorySubmissionErrors(errors: Record<string, string[]>): {
  fieldErrors: StorySubmissionFieldErrors;
  generalError: string | null;
} {
  const fieldErrors: StorySubmissionFieldErrors = {};
  const fields: Array<keyof StorySubmissionFieldErrors> = [
    "title",
    "category",
    "author_name",
    "author_email",
    "author_role",
    "body",
    "cover_image_url",
    "consent",
  ];
  let generalError: string | null = null;

  fields.forEach((field) => {
    const message = errors[field]?.[0];
    if (message) fieldErrors[field] = message;
  });

  const unknown = Object.entries(errors).find(
    ([field, messages]) =>
      !fields.includes(field as keyof StorySubmissionFieldErrors) && messages.length > 0,
  );

  if (unknown) generalError = unknown[1][0];

  return { fieldErrors, generalError };
}
