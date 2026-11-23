import { IconInfo } from "../Icons";
import { useSiteSettings } from "../../lib/siteSettingsContext";

type SampleNoticeProps = {
  /** The section can carry its own notice; the global setting is the fallback. */
  message?: string | null;
  className?: string;
};

/** Renders an optional public notice/announcement for performances when configured in the CMS. */
function SampleNotice({ message, className = "" }: SampleNoticeProps) {
  const { get } = useSiteSettings();
  const rawText = message ?? get("performances.sample_notice") ?? "";
  const text = rawText.trim();

  if (!text) return null;

  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-2xl border border-brass/35 bg-brass/10 px-4 py-3.5 text-sm leading-relaxed text-body ${className}`}
    >
      <IconInfo className="mt-0.5 size-4.5 shrink-0 text-brass" />
      <p>{text}</p>
    </div>
  );
}

export default SampleNotice;
