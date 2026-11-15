import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSiteSettings } from "./api";
import {
  DEFAULT_SETTINGS,
  SiteSettingsContext,
  type SiteSettingsValue,
} from "./siteSettingsContext";

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSiteSettings()
      .then((remote) => {
        if (cancelled) return;
        setSettings({ ...DEFAULT_SETTINGS, ...remote });
      })
      .catch(() => {
        // Keep the seeded defaults if the API is unavailable.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SiteSettingsValue>(
    () => ({
      settings,
      get: (key, fallback = "") => settings[key] ?? fallback,
      loading,
    }),
    [settings, loading],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}
