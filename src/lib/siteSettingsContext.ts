import { createContext, useContext } from "react";
import { contact } from "../data/landing";

/**
 * The site must still render its contact details while the CMS request is in
 * flight, so these defaults mirror the seeded settings. The API values replace
 * them as soon as the request resolves.
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
  "site.name": "Music Without Borders",
  "site.tagline":
    "A volunteer, non-profit band teaching and performing free music for our community.",
  "contact.phone_label": contact.phoneLabel,
  "contact.phone_href": contact.phoneHref,
  "contact.address": contact.address,
  "contact.venue": contact.venue,
  "contact.email": "Communitymusicband@gmail.com",
  "rehearsal.schedule": "Saturdays, 9:00 AM to 12:00 NN",
  "footer.copyright": "© 2026 Music Without Borders. A non-profit organization.",
  "social.facebook": "https://facebook.com",
  "social.instagram": "https://instagram.com",
  "social.youtube": "https://youtube.com",
  "seo.home.page_title": "Music that belongs to everyone",
  "seo.home.og_title": "Music that belongs to everyone",
  "seo.home.og_description":
    "Free to learn, free to listen, free to join. A volunteer band making room for more music in our community.",
  "seo.about.page_title": "About Us",
  "seo.about.og_title": "About Us - Music Without Borders",
  "seo.about.og_description":
    "Learn about our mission to make music accessible to everyone in Pampanga. Free lessons, free instruments, free concerts.",
  "seo.instruments.page_title": "Instruments",
  "seo.instruments.og_title": "Meet the instruments behind the music",
  "seo.instruments.og_description":
    "Explore the woodwind, brass, string, and percussion instruments in our free lending library.",
  "seo.performances.page_title": "2026 Concert Season & Performances",
  "seo.performances.og_title": "Live Performances & Rehearsal Schedule",
  "seo.performances.og_description":
    "All Music Without Borders concerts and outreach events are free and open to everyone.",
  "seo.donate.page_title": "Donate",
  "seo.donate.og_title": "Support free music in Pampanga",
  "seo.donate.og_description":
    "Your gift keeps lessons, instruments, and concerts free for the community.",
  "seo.stories.page_title": "Notes from the Bandstand",
  "seo.stories.og_title": "Notes from the Bandstand",
  "seo.stories.og_description": "Progress reports and stories from the people the band has helped.",
  "performances.sample_notice":
    "Sample schedule for the CMS demo. Replace these dates and details with the band's real 2026 events.",
};

export type SiteSettingsValue = {
  settings: Record<string, string>;
  get: (key: string, fallback?: string) => string;
  loading: boolean;
};

const defaultGet = (key: string, fallback = "") => DEFAULT_SETTINGS[key] ?? fallback;

export const SiteSettingsContext = createContext<SiteSettingsValue>({
  settings: DEFAULT_SETTINGS,
  get: defaultGet,
  loading: false,
});

export function useSiteSettings(): SiteSettingsValue {
  return useContext(SiteSettingsContext);
}
