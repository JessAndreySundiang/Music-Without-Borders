import { useEffect } from "react";
import { useSiteSettings } from "./siteSettingsContext";

const FALLBACK_SITE_NAME = "Music Without Borders";

function setMeta(attribute: "name" | "property", key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

/** Keeps the browser tab title in sync with the current route. */
export function usePageTitle(title: string): void {
  const { get } = useSiteSettings();
  const siteName = get("site.name", FALLBACK_SITE_NAME);

  useEffect(() => {
    document.title = title ? `${title} | ${siteName}` : siteName;
  }, [title, siteName]);
}

type PageMetaOptions = {
  /** Matches the `seo.<page>.*` settings keys. */
  page: string;
  fallbackTitle: string;
  fallbackDescription?: string;
  /** Dynamic pages such as a single performance can override the CMS title. */
  title?: string;
  description?: string;
};

/**
 * Applies the CMS-managed page title plus the description and social meta tags.
 * Falls back to the supplied copy when a setting has not been created yet.
 */
export function usePageMeta({
  page,
  fallbackTitle,
  fallbackDescription = "",
  title,
  description,
}: PageMetaOptions): void {
  const { get } = useSiteSettings();
  const siteName = get("site.name", FALLBACK_SITE_NAME);
  const resolvedTitle = title ?? get(`seo.${page}.page_title`, fallbackTitle);
  const ogTitle = title ?? get(`seo.${page}.og_title`, resolvedTitle);
  const ogDescription = description ?? get(`seo.${page}.og_description`, fallbackDescription);

  useEffect(() => {
    document.title = resolvedTitle ? `${resolvedTitle} | ${siteName}` : siteName;
    setMeta("property", "og:site_name", siteName);
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDescription);
    setMeta("name", "twitter:title", ogTitle);
    setMeta("name", "twitter:description", ogDescription);

    if (ogDescription) {
      setMeta("name", "description", ogDescription);
    }
  }, [resolvedTitle, siteName, ogTitle, ogDescription]);
}
