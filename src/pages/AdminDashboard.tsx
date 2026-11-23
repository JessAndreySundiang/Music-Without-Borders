import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCap,
  IconCheckCircle,
  IconInfo,
  IconKey,
  IconMusic,
  IconSparkle,
  IconTicket,
  IconUsers,
} from "../components/Icons";
import {
  AdminApiError,
  approveAdminStory,
  createAdminPerformance,
  createAdminStory,
  createAdminTestimonial,
  deleteAdminPerformance,
  deleteAdminStory,
  deleteAdminTestimonial,
  featureAdminStory,
  fetchAdminPage,
  fetchAdminPerformances,
  fetchAdminSettings,
  fetchAdminStories,
  fetchAdminTestimonials,
  rejectAdminStory,
  reopenAdminStory,
  unfeatureAdminStory,
  reorderAdminItems,
  reorderAdminSections,
  updateAdminItem,
  updateAdminPerformance,
  updateAdminSection,
  updateAdminSettings,
  updateAdminStory,
  updateAdminTestimonial,
} from "../lib/adminApi";
import { useAdminAuth } from "../lib/adminAuthContext";
import { paragraphs } from "../lib/section";
import {
  REJECTION_REASONS,
  STORY_STATUS_LABELS,
  canApproveStory,
  canRejectStory,
  canReopenStory,
  rejectionSummary,
} from "../lib/storyModeration";
import { STORY_CATEGORIES, getCategoryLabel } from "../lib/storySubmission";
import { usePageTitle } from "../lib/usePageTitle";
import type { StoryCategory } from "../types/Story";
import type {
  AdminPageContent,
  AdminPerformance,
  AdminStory,
  AdminTestimonial,
  ItemUpdate,
  PageKey,
  PerformanceDraft,
  SectionUpdate,
  StoryDraft,
  StoryStatus,
  StoryStatusCounts,
  StoryStatusFilter,
  TestimonialDraft,
} from "../types/Admin";
import type { PageSection, SectionItem } from "../types/Cms";
import logo from "../assets/logo.svg";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/20";
const textareaClass = `${inputClass} min-h-28 resize-y leading-relaxed`;
const labelClass = "mb-1.5 block text-[0.68rem] font-bold uppercase tracking-wider text-muted";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brass-bright px-4 py-2.5 text-sm font-bold text-night-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass/40 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright";
const smallButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brass/40 hover:text-brass disabled:cursor-not-allowed disabled:opacity-40";
const smallPrimaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-brass/40 bg-brass-bright px-2.5 py-1.5 text-xs font-bold text-night-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40";
const dangerButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-plume/30 bg-plume/10 px-2.5 py-1.5 text-xs font-semibold text-plume transition-colors hover:bg-plume/15 disabled:cursor-not-allowed disabled:opacity-40";
const dangerPrimaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-plume px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-plume/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plume disabled:cursor-not-allowed disabled:opacity-60";

type Tab = "overview" | "home" | "about" | "performances" | "testimonials" | "stories" | "settings";

const tabs: Array<{ id: Tab; label: string; icon: typeof IconMusic }> = [
  { id: "overview", label: "Overview", icon: IconSparkle },
  { id: "home", label: "Home page", icon: IconCap },
  { id: "about", label: "About page", icon: IconInfo },
  { id: "performances", label: "Performances", icon: IconTicket },
  { id: "testimonials", label: "Testimonials", icon: IconUsers },
  { id: "stories", label: "Stories", icon: IconMusic },
  { id: "settings", label: "Site settings", icon: IconKey },
];

/** The URL is the source of truth for the active tab, so refreshes and deep links agree. */
function tabFromParam(value: string | null): Tab {
  return tabs.some((entry) => entry.id === value) ? (value as Tab) : "overview";
}

function AdminNotice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${
        tone === "error"
          ? "border-plume/30 bg-plume/10 text-plume"
          : "border-brass/30 bg-brass/10 text-body"
      }`}
    >
      {tone === "error" ? (
        <IconInfo className="mt-0.5 size-4 shrink-0" />
      ) : (
        <IconCheckCircle className="mt-0.5 size-4 shrink-0 text-brass" />
      )}
      <div>{children}</div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SectionEditor({
  section,
  isFirst,
  isLast,
  onSave,
  onMove,
  onItemSave,
  onItemMove,
}: {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  onSave: (id: number, payload: SectionUpdate) => Promise<void>;
  onMove: (id: number, direction: "up" | "down") => Promise<void>;
  onItemSave: (sectionId: number, itemId: number, payload: ItemUpdate) => Promise<void>;
  onItemMove: (sectionId: number, itemId: number, direction: "up" | "down") => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [eyebrow, setEyebrow] = useState(section.eyebrow ?? "");
  const [title, setTitle] = useState(section.title ?? "");
  const [body, setBody] = useState(section.body ?? "");
  const [extra, setExtra] = useState(JSON.stringify(section.extra ?? {}, null, 2));
  const [visible, setVisible] = useState(section.is_visible);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      let parsedExtra: Record<string, unknown>;
      try {
        const parsed = JSON.parse(extra || "{}") as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Extra must be a JSON object.");
        }
        parsedExtra = parsed as Record<string, unknown>;
      } catch {
        throw new Error("Extra is not valid JSON. Use an object like {}.");
      }

      await onSave(section.id, {
        eyebrow: eyebrow || null,
        title: title || null,
        body: body || null,
        extra: parsedExtra,
        is_visible: visible,
      });
      setMessage("Section saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this section.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brass/10 text-brass">
            <IconMusic className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-serif text-lg font-semibold text-ink">
                {section.title || section.key}
              </span>
              {!section.is_visible && (
                <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">
                  Hidden
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {section.key} · {section.items.length} item{section.items.length === 1 ? "" : "s"}
            </span>
          </span>
          <IconArrowRight
            className={`ml-auto size-4 shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={smallButton}
            disabled={isFirst}
            onClick={() => void onMove(section.id, "up")}
            aria-label="Move section up"
          >
            ↑
          </button>
          <button
            type="button"
            className={smallButton}
            disabled={isLast}
            onClick={() => void onMove(section.id, "down")}
            aria-label="Move section down"
          >
            ↓
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-5 p-4 sm:p-5">
          {message && <AdminNotice>{message}</AdminNotice>}
          {error && <AdminNotice tone="error">{error}</AdminNotice>}

          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Eyebrow</label>
                <input
                  value={eyebrow}
                  onChange={(event) => setEyebrow(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Body copy</label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className={textareaClass}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted">Separate paragraphs with a blank line.</p>
            </div>
            <div>
              <label className={labelClass}>Extra JSON</label>
              <textarea
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                className={`${textareaClass} font-mono text-xs`}
                rows={4}
                spellCheck={false}
              />
              <p className="mt-1 text-xs text-muted">
                Section-specific values such as notices and CTA labels. Keep it as a JSON object.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(event) => setVisible(event.target.checked)}
                  className="size-4 accent-[var(--brass-bright)]"
                />
                Visible on the public page
              </label>
              <button type="submit" className={primaryButton} disabled={busy}>
                {busy ? "Saving…" : "Save section"}
              </button>
            </div>
          </form>

          <div className="border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                Section items
              </h3>
              <span className="text-xs text-muted">
                Reorder, edit copy, or hide individual items.
              </span>
            </div>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <ItemEditor
                  key={item.id}
                  sectionId={section.id}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === section.items.length - 1}
                  onSave={onItemSave}
                  onMove={onItemMove}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconOptions = [
  "",
  "IconCalendar",
  "IconCap",
  "IconClock",
  "IconHeart",
  "IconInstrument",
  "IconKey",
  "IconMapPin",
  "IconMusic",
  "IconTicket",
  "IconUsers",
];

function ItemEditor({
  sectionId,
  item,
  isFirst,
  isLast,
  onSave,
  onMove,
}: {
  sectionId: number;
  item: SectionItem;
  isFirst: boolean;
  isLast: boolean;
  onSave: (sectionId: number, itemId: number, payload: ItemUpdate) => Promise<void>;
  onMove: (sectionId: number, itemId: number, direction: "up" | "down") => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [body, setBody] = useState(item.body ?? "");
  const [value, setValue] = useState(item.value ?? "");
  const [icon, setIcon] = useState(item.icon ?? "");
  const [linkLabel, setLinkLabel] = useState(item.link_label ?? "");
  const [linkUrl, setLinkUrl] = useState(item.link_url ?? "");
  const [imagePath, setImagePath] = useState(item.image_path ?? "");
  const [extra, setExtra] = useState(JSON.stringify(item.extra ?? {}, null, 2));
  const [visible, setVisible] = useState(item.is_visible);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      let parsedExtra: Record<string, unknown>;
      try {
        const parsed = JSON.parse(extra || "{}") as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Extra must be a JSON object.");
        }
        parsedExtra = parsed as Record<string, unknown>;
      } catch {
        throw new Error("Extra is not valid JSON. Use an object like {}.");
      }

      await onSave(sectionId, item.id, {
        title: title || null,
        body: body || null,
        value: value || null,
        icon: icon || null,
        link_label: linkLabel || null,
        link_url: linkUrl || null,
        image_path: imagePath || null,
        extra: parsedExtra,
        is_visible: visible,
      });
      setMessage("Item saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this item.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-sm text-ink">
        <span className="rounded-full bg-paper px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-muted">
          {item.item_type}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold">
          {item.title || item.value || "Untitled item"}
        </span>
        {!item.is_visible && (
          <span className="text-[0.65rem] font-bold uppercase text-muted">Hidden</span>
        )}
        <span className="text-xs text-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <form onSubmit={save} className="space-y-4 border-t border-line p-3.5">
        {message && <AdminNotice>{message}</AdminNotice>}
        {error && <AdminNotice tone="error">{error}</AdminNotice>}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Title / label</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Value</label>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Body / description</label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={textareaClass}
            rows={3}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Icon</label>
            <select
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              className={inputClass}
            >
              {iconOptions.map((option) => (
                <option key={option || "none"} value={option}>
                  {option || "No icon"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Link label</label>
            <input
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Link URL</label>
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Image path</label>
            <input
              value={imagePath}
              onChange={(event) => setImagePath(event.target.value)}
              className={inputClass}
              placeholder="stories/photo.webp"
            />
            <p className="mt-1 text-xs text-muted">Relative to storage/app/public.</p>
          </div>
          <div>
            <label className={labelClass}>Extra JSON</label>
            <textarea
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              className={`${textareaClass} font-mono text-xs`}
              rows={3}
              spellCheck={false}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="size-4 accent-[var(--brass-bright)]"
            />
            Visible
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={smallButton}
              disabled={isFirst}
              onClick={() => void onMove(sectionId, item.id, "up")}
            >
              Move up
            </button>
            <button
              type="button"
              className={smallButton}
              disabled={isLast}
              onClick={() => void onMove(sectionId, item.id, "down")}
            >
              Move down
            </button>
            <button type="submit" className={primaryButton} disabled={busy}>
              {busy ? "Saving…" : "Save item"}
            </button>
          </div>
        </div>
      </form>
    </details>
  );
}

function PageEditor({ page }: { page: PageKey }) {
  const [data, setData] = useState<AdminPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAdminPage(page)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setError(null);
        setVersion((value) => value + 1);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Unable to load this page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  const updateSectionLocal = (id: number, payload: SectionUpdate) => {
    setData((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === id ? { ...section, ...payload } : section,
            ),
          }
        : current,
    );
  };

  const updateItemLocal = (sectionId: number, itemId: number, payload: ItemUpdate) => {
    setData((current) =>
      current
        ? {
            ...current,
            sections: current.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    items: section.items.map((item) =>
                      item.id === itemId ? { ...item, ...payload } : item,
                    ),
                  }
                : section,
            ),
          }
        : current,
    );
  };

  const moveSection = async (id: number, direction: "up" | "down") => {
    if (!data) return;
    const index = data.sections.findIndex((section) => section.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= data.sections.length) return;

    const sections = [...data.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setData({ ...data, sections });
    setNotice(null);

    try {
      await reorderAdminSections(
        page,
        sections.map((section) => section.id),
      );
      setNotice("Section order saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reorder sections.");
      setLoading(true);
      setReloadToken((token) => token + 1);
    }
  };

  const moveItem = async (sectionId: number, itemId: number, direction: "up" | "down") => {
    if (!data) return;
    const section = data.sections.find((entry) => entry.id === sectionId);
    if (!section) return;
    const index = section.items.findIndex((item) => item.id === itemId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= section.items.length) return;

    const items = [...section.items];
    [items[index], items[target]] = [items[target], items[index]];
    setData({
      ...data,
      sections: data.sections.map((entry) =>
        entry.id === sectionId ? { ...entry, items } : entry,
      ),
    });
    setNotice(null);

    try {
      await reorderAdminItems(
        page,
        items.map((item) => item.id),
      );
      setNotice("Item order saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reorder items.");
      setLoading(true);
      setReloadToken((token) => token + 1);
    }
  };

  if (loading && !data) {
    return (
      <AdminCard title={page === "home" ? "Home page" : "About page"}>
        <p className="text-sm text-muted">Loading sections…</p>
      </AdminCard>
    );
  }

  if (error && !data) {
    return (
      <AdminCard title={page === "home" ? "Home page" : "About page"}>
        <AdminNotice tone="error">{error}</AdminNotice>
        <button type="button" className={`${secondaryButton} mt-4`} onClick={reload}>
          Try again
        </button>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      title={page === "home" ? "Home page" : "About page"}
      description="Edit page copy, reorder sections, hide what is not ready, and update the items inside each section."
      actions={
        <>
          <Link
            to={page === "home" ? "/" : "/about"}
            target="_blank"
            rel="noreferrer"
            className={secondaryButton}
          >
            Preview page
          </Link>
          <button type="button" className={secondaryButton} onClick={reload} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </>
      }
    >
      {notice && <AdminNotice>{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}
      <div className="mt-4 space-y-3">
        {data?.sections.map((section, index) => (
          <SectionEditor
            key={`${section.id}-${version}`}
            section={section}
            isFirst={index === 0}
            isLast={index === (data?.sections.length ?? 0) - 1}
            onSave={async (id, payload) => {
              await updateAdminSection(page, id, payload);
              updateSectionLocal(id, payload);
            }}
            onMove={moveSection}
            onItemSave={async (sectionId, itemId, payload) => {
              await updateAdminItem(page, itemId, payload);
              updateItemLocal(sectionId, itemId, payload);
            }}
            onItemMove={moveItem}
          />
        ))}
      </div>
    </AdminCard>
  );
}

type FieldType = "text" | "textarea" | "date" | "time" | "number" | "checkbox" | "select";
type Field = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  rows?: number;
  options?: ReadonlyArray<{ value: string; label: string }>;
};
type Draft = Record<string, string | number | boolean>;

function RecordForm({
  fields,
  draft,
  onChange,
  onSubmit,
  onCancel,
  busy,
  error,
  heading,
}: {
  fields: Field[];
  draft: Draft;
  onChange: (name: string, value: string | number | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
  heading: string;
}) {
  return (
    <div className="rounded-2xl border border-brass/30 bg-brass/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-semibold text-ink">{heading}</h3>
        <button type="button" className={smallButton} onClick={onCancel}>
          Close
        </button>
      </div>
      {error && (
        <div className="mt-4">
          <AdminNotice tone="error">{error}</AdminNotice>
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={
                field.type === "textarea" || field.type === "checkbox" ? "md:col-span-2" : ""
              }
            >
              {field.type === "checkbox" ? (
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[field.name])}
                    onChange={(event) => onChange(field.name, event.target.checked)}
                    className="size-4 accent-[var(--brass-bright)]"
                  />
                  {field.label}
                </label>
              ) : (
                <>
                  <label htmlFor={`field-${field.name}`} className={labelClass}>
                    {field.label}
                    {field.required && <span className="text-plume"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.name}`}
                      value={String(draft[field.name] ?? "")}
                      onChange={(event) => onChange(field.name, event.target.value)}
                      className={textareaClass}
                      rows={field.rows ?? 4}
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={`field-${field.name}`}
                      value={String(draft[field.name] ?? "")}
                      onChange={(event) => onChange(field.name, event.target.value)}
                      className={inputClass}
                      required={field.required}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      type={field.type ?? "text"}
                      value={String(draft[field.name] ?? "")}
                      onChange={(event) => onChange(field.name, event.target.value)}
                      className={inputClass}
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <button type="button" className={secondaryButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} disabled={busy}>
            {busy ? "Saving…" : "Save record"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RecordManager<T extends { id: number }>({
  title,
  singular,
  description,
  fields,
  emptyDraft,
  fetchRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  recordTitle,
  recordMeta,
  recordStatus,
  publicHref,
}: {
  title: string;
  singular: string;
  description: string;
  fields: Field[];
  emptyDraft: Draft;
  fetchRecords: () => Promise<T[]>;
  createRecord: (draft: Draft) => Promise<T>;
  updateRecord: (id: number, draft: Draft) => Promise<T>;
  deleteRecord: (id: number) => Promise<void>;
  recordTitle: (record: T) => string;
  recordMeta: (record: T) => ReactNode;
  recordStatus?: (record: T) => ReactNode;
  publicHref?: (record: T) => string | null;
}) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchRecords()
      .then((data) => {
        if (!cancelled) setRecords(data);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error ? reason.message : `Unable to load ${title.toLowerCase()}.`,
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRecords, title, reloadToken]);

  const startNew = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft });
    setError(null);
    setNotice(null);
  };

  const startEdit = (record: T) => {
    const next: Draft = {};
    fields.forEach((field) => {
      const raw = (record as unknown as Record<string, unknown>)[field.name];
      if (field.type === "checkbox") next[field.name] = Boolean(raw);
      else if (field.type === "number") next[field.name] = Number(raw ?? 0);
      else next[field.name] = String(raw ?? "");
    });
    setEditingId(record.id);
    setDraft(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const payload: Draft = { ...draft };
      fields.forEach((field) => {
        if (field.type === "number") payload[field.name] = Number(payload[field.name] || 0);
        if (field.type === "checkbox") payload[field.name] = Boolean(payload[field.name]);
      });

      if (editingId === null) await createRecord(payload);
      else await updateRecord(editingId, payload);
      setDraft(null);
      setEditingId(null);
      const label = singular.charAt(0).toUpperCase() + singular.slice(1);
      setNotice(editingId === null ? `${label} created.` : `${label} saved.`);
      reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this record.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (record: T) => {
    if (!window.confirm(`Move this ${singular} to the recycle bin?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteRecord(record.id);
      setNotice("Record moved to the recycle bin.");
      reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete this record.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard
      title={title}
      description={description}
      actions={
        <>
          <button type="button" className={primaryButton} onClick={startNew}>
            New {singular}
          </button>
          <button type="button" className={secondaryButton} onClick={reload} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </>
      }
    >
      {notice && <AdminNotice>{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      {draft && (
        <div className="mt-4">
          <RecordForm
            fields={fields}
            draft={draft}
            onChange={(name, value) =>
              setDraft((current) => (current ? { ...current, [name]: value } : current))
            }
            onSubmit={submit}
            onCancel={() => {
              setDraft(null);
              setEditingId(null);
              setError(null);
            }}
            busy={busy}
            error={error}
            heading={editingId === null ? `New ${singular}` : `Edit ${singular}`}
          />
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {loading && records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Loading records…
          </p>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
            <IconMusic className="mx-auto size-7 text-brass" />
            <p className="mt-2 font-serif text-lg font-semibold text-ink">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted">
              Create the first record with the button above.
            </p>
          </div>
        ) : (
          records.map((record) => {
            const href = publicHref?.(record) ?? null;
            return (
              <div
                key={record.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-paper p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-ink">
                      {recordTitle(record)}
                    </h3>
                    {recordStatus?.(record)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    {recordMeta(record)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {href && (
                    <Link to={href} target="_blank" rel="noreferrer" className={smallButton}>
                      Preview
                    </Link>
                  )}
                  <button type="button" className={smallButton} onClick={() => startEdit(record)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className={dangerButton}
                    onClick={() => void remove(record)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminCard>
  );
}

function PerformancesAdmin() {
  const fields: Field[] = [
    { name: "title", label: "Title", required: true },
    { name: "performance_date", label: "Date", type: "date", required: true },
    { name: "start_time", label: "Start time", type: "time" },
    { name: "event_type", label: "Event type", required: true, placeholder: "Concert" },
    { name: "venue", label: "Venue", required: true },
    { name: "city", label: "City", required: true },
    { name: "duration_minutes", label: "Duration (minutes)", type: "number", required: true },
    { name: "conductor", label: "Conductor", required: true },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
      rows: 5,
    },
    { name: "is_published", label: "Published on the public schedule", type: "checkbox" },
  ];

  return (
    <RecordManager<AdminPerformance>
      title="Performances"
      singular="performance"
      description="Create, edit, publish, or retire concerts and outreach events. Deleted records are soft-deleted."
      fields={fields}
      emptyDraft={{
        title: "",
        performance_date: "",
        start_time: "",
        event_type: "Concert",
        venue: "",
        city: "",
        duration_minutes: 90,
        conductor: "",
        description: "",
        is_published: true,
      }}
      fetchRecords={fetchAdminPerformances}
      createRecord={(draft) => createAdminPerformance(draft as unknown as PerformanceDraft)}
      updateRecord={(id, draft) => updateAdminPerformance(id, draft as unknown as PerformanceDraft)}
      deleteRecord={deleteAdminPerformance}
      recordTitle={(record) => record.title}
      recordMeta={(record) => (
        <>
          <span>{record.performance_date}</span>
          <span>{record.start_time || "Time TBA"}</span>
          <span>{record.venue}</span>
        </>
      )}
      recordStatus={(record) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
            record.is_published ? "bg-brass/15 text-brass" : "bg-paper-2 text-muted"
          }`}
        >
          {record.is_published ? "Published" : "Draft"}
        </span>
      )}
      publicHref={(record) => (record.is_published ? `/detail/${record.id}` : null)}
    />
  );
}

function TestimonialsAdmin() {
  const fields: Field[] = [
    { name: "quote", label: "Quote", type: "textarea", required: true, rows: 5 },
    { name: "name", label: "Name", required: true },
    { name: "role", label: "Role / relationship", required: true },
    { name: "image_path", label: "Image path", help: "Relative to storage/app/public." },
    { name: "sort_order", label: "Sort order", type: "number" },
    { name: "is_published", label: "Published on the public site", type: "checkbox" },
  ];

  return (
    <RecordManager<AdminTestimonial>
      title="Testimonials"
      singular="testimonial"
      description="Manage the voices shown on the home page. Deleted records are soft-deleted."
      fields={fields}
      emptyDraft={{
        quote: "",
        name: "",
        role: "",
        image_path: "",
        sort_order: 0,
        is_published: true,
      }}
      fetchRecords={fetchAdminTestimonials}
      createRecord={(draft) => createAdminTestimonial(draft as unknown as TestimonialDraft)}
      updateRecord={(id, draft) => updateAdminTestimonial(id, draft as unknown as TestimonialDraft)}
      deleteRecord={deleteAdminTestimonial}
      recordTitle={(record) => record.name}
      recordMeta={(record) => (
        <>
          <span>{record.role}</span>
          <span>Order {record.sort_order}</span>
        </>
      )}
      recordStatus={(record) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
            record.is_published ? "bg-brass/15 text-brass" : "bg-paper-2 text-muted"
          }`}
        >
          {record.is_published ? "Published" : "Draft"}
        </span>
      )}
    />
  );
}

const storyStatusClasses: Record<StoryStatus, string> = {
  draft: "border-line bg-paper-2 text-muted",
  pending: "border-brass/40 bg-brass/15 text-brass",
  approved: "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "border-plume/30 bg-plume/10 text-plume",
};

const emptyStoryCounts: StoryStatusCounts = {
  all: 0,
  draft: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

const emptyStoryDraft: Draft = {
  title: "",
  slug: "",
  category: "community",
  excerpt: "",
  body: "",
  author_name: "Music Without Borders",
  author_role: "Notes from the Bandstand",
  cover_image_path: "",
  cover_image_url: "",
  sort_order: 0,
  is_sample: false,
};

const storyEditorFields: Field[] = [
  { name: "title", label: "Title", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: STORY_CATEGORIES,
  },
  {
    name: "slug",
    label: "Slug",
    help: "Leave blank to generate from the title. Use lowercase words separated by hyphens.",
  },
  { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3 },
  { name: "body", label: "Story body", type: "textarea", required: true, rows: 12 },
  { name: "author_name", label: "Author name", placeholder: "Music Without Borders" },
  { name: "author_role", label: "Author role", placeholder: "Notes from the Bandstand" },
  {
    name: "cover_image_path",
    label: "Cover image path",
    help: "Relative to storage/app/public.",
  },
  {
    name: "cover_image_url",
    label: "Cover image URL",
    help: "Optional external https:// image URL.",
  },
  { name: "sort_order", label: "Sort order", type: "number" },
  { name: "is_sample", label: "Sample story (shown with a label)", type: "checkbox" },
];

const rejectionReasons = REJECTION_REASONS;

function StoryStatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${storyStatusClasses[status]}`}
    >
      {STORY_STATUS_LABELS[status]}
    </span>
  );
}

function submittedAt(value: string | null): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StoryPreviewDialog({ story, onClose }: { story: AdminStory; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="story-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(92vw,48rem)] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-body shadow-2xl backdrop:bg-night-950/70"
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brass">
              Submission preview
            </p>
            <h2
              id="story-preview-title"
              className="mt-2 font-serif text-2xl font-semibold tracking-tight text-ink"
            >
              {story.title}
            </h2>
          </div>
          <button type="button" className={smallButton} onClick={onClose} autoFocus>
            Close
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StoryStatusBadge status={story.status} />
          {story.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brass-bright/40 bg-amber-400/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-300">
              <IconSparkle className="size-2.5" />
              Featured story
            </span>
          )}
          {story.is_sample && (
            <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">
              Sample data
            </span>
          )}
        </div>

        <dl className="mt-6 grid gap-4 rounded-2xl border border-line bg-paper p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className={labelClass}>Author</dt>
            <dd className="font-semibold text-ink">{story.author_name || "Not provided"}</dd>
          </div>
          <div>
            <dt className={labelClass}>Email (private)</dt>
            <dd className="break-words font-semibold text-ink">
              {story.author_email || "No email on file"}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Role</dt>
            <dd className="text-body">{story.author_role || "Not provided"}</dd>
          </div>
          <div>
            <dt className={labelClass}>Submitted</dt>
            <dd className="text-body">{submittedAt(story.created_at)}</dd>
          </div>
          <div>
            <dt className={labelClass}>Consent</dt>
            <dd className="text-body">
              {story.consent_at ? `Recorded ${submittedAt(story.consent_at)}` : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Reviewer</dt>
            <dd className="text-body">
              {story.reviewer_name || "Not reviewed"}
              {story.reviewed_at ? ` · ${submittedAt(story.reviewed_at)}` : ""}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Reference code</dt>
            <dd className="font-mono font-semibold text-brass">{story.reference_code || "None"}</dd>
          </div>
          <div>
            <dt className={labelClass}>Category</dt>
            <dd className="text-body">{getCategoryLabel(story.category)}</dd>
          </div>
        </dl>

        {story.cover_image_url && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-paper">
            <img src={story.cover_image_url} alt="" className="max-h-72 w-full object-cover" />
          </div>
        )}

        {story.excerpt && (
          <p className="mt-6 border-l-2 border-brass/40 pl-4 text-base italic leading-relaxed text-muted">
            {story.excerpt}
          </p>
        )}

        <div className="mt-6 space-y-4 text-base leading-[1.8] text-body">
          {paragraphs(story.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {story.rejection_reason && (
          <div className="mt-6 rounded-xl border border-plume/30 bg-plume/10 p-4 text-sm text-plume">
            <p className="font-bold">
              {story.status === "rejected" ? "Rejection reason" : "Previous rejection reason"}
            </p>
            <p className="mt-1">{story.rejection_reason}</p>
          </div>
        )}

        {story.events && story.events.length > 0 && (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Moderation audit trail
            </h3>
            <ol className="mt-3 divide-y divide-line text-sm">
              {story.events.map((event) => {
                const actionBadgeClass =
                  event.action === "approved"
                    ? "border-brass/30 bg-brass/10 text-brass"
                    : event.action === "rejected"
                      ? "border-plume/30 bg-plume/10 text-plume"
                      : event.action === "reopened"
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                        : "border-line bg-surface text-muted";
                return (
                  <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${actionBadgeClass}`}
                        >
                          {event.action}
                        </span>
                        <span className="font-semibold text-ink">
                          {event.actor_name ||
                            (event.action === "submitted"
                              ? "Visitor (public submission)"
                              : "System / Administrator")}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{submittedAt(event.created_at)}</span>
                    </div>
                    {event.reason && (
                      <p className="mt-1 border-l-2 border-plume/40 pl-2 text-xs text-plume">
                        Reason: {event.reason}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="mt-7 flex justify-end border-t border-line pt-5">
          <button type="button" className={secondaryButton} onClick={onClose}>
            Close preview
          </button>
        </div>
      </div>
    </dialog>
  );
}

function RejectStoryDialog({
  story,
  onClose,
  onRejected,
}: {
  story: AdminStory;
  onClose: () => void;
  onRejected: (reason: string) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    if (!reason) {
      setError("Choose a reason for rejecting this story.");
      document.getElementById("reject-reason")?.focus();
      return;
    }

    if (reason === "Other" && !note.trim()) {
      setError("Add a short note explaining the reason.");
      document.getElementById("reject-note")?.focus();
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await onRejected(rejectionSummary(reason, note));
      onClose();
    } catch (cause) {
      if (cause instanceof AdminApiError) {
        setError(cause.errors.rejection_reason?.[0] ?? cause.message);
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to reject this story.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="reject-story-title"
      onCancel={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-3xl border border-line bg-surface p-0 text-body shadow-2xl backdrop:bg-night-950/70"
    >
      <form onSubmit={submit} noValidate className="p-6 sm:p-7">
        <h2
          id="reject-story-title"
          className="font-serif text-2xl font-semibold tracking-tight text-ink"
        >
          Reject “{story.title}”
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The story stays private. The reason is stored for the admin record and is never shown
          publicly.
        </p>

        {error && (
          <div
            id="reject-reason-error"
            role="alert"
            className="mt-4 rounded-xl border border-plume/30 bg-plume/10 px-4 py-3 text-sm text-plume"
          >
            {error}
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="reject-reason" className={labelClass}>
            Reason <span className="text-plume">*</span>
          </label>
          <select
            id="reject-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
            className={inputClass}
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "reject-reason-error" : undefined}
          >
            <option value="">Choose a reason…</option>
            {rejectionReasons.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="reject-note" className={labelClass}>
            Optional note
          </label>
          <textarea
            id="reject-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError(null);
            }}
            className={textareaClass}
            rows={3}
            placeholder="Add context for the record. This is not shown publicly."
            aria-describedby={error ? "reject-reason-error" : undefined}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={dangerPrimaryButton} disabled={busy}>
            {busy ? "Rejecting…" : "Reject story"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function StoriesAdmin() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [counts, setCounts] = useState<StoryStatusCounts>(emptyStoryCounts);
  const [filter, setFilter] = useState<StoryStatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [previewStory, setPreviewStory] = useState<AdminStory | null>(null);
  const [rejectStory, setRejectStory] = useState<AdminStory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAdminStories(filter)
      .then((result) => {
        if (cancelled) return;
        setStories(result.stories);
        setCounts(result.counts);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Unable to load stories.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, reloadToken]);

  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  const changeFilter = (next: StoryStatusFilter) => {
    setFilter(next);
    setLoading(true);
    setNotice(null);
    setError(null);
  };

  const runStoryAction = async (
    story: AdminStory,
    action: () => Promise<unknown>,
    message: string,
  ) => {
    setBusyId(story.id);
    setError(null);
    setNotice(null);

    try {
      await action();
      setNotice(message);
      reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update this story.");
    } finally {
      setBusyId(null);
    }
  };

  const approve = (story: AdminStory) => {
    if (!window.confirm(`Approve “${story.title}” and publish it now?`)) return;
    void runStoryAction(
      story,
      () => approveAdminStory(story.id),
      `Approved “${story.title}”. It is now public.`,
    );
  };

  const reopen = (story: AdminStory) => {
    if (!window.confirm(`Reopen “${story.title}” and return it to the pending queue?`)) return;
    void runStoryAction(
      story,
      () => reopenAdminStory(story.id),
      `Reopened “${story.title}”. It is back in the pending queue.`,
    );
  };

  const feature = (story: AdminStory) => {
    void runStoryAction(
      story,
      () => featureAdminStory(story.id),
      `Featured “${story.title}”. It is now highlighted on the Stories page.`,
    );
  };

  const unfeature = (story: AdminStory) => {
    void runStoryAction(story, () => unfeatureAdminStory(story.id), `Unfeatured “${story.title}”.`);
  };

  const remove = (story: AdminStory) => {
    if (!window.confirm(`Move “${story.title}” to the recycle bin?`)) return;
    void runStoryAction(
      story,
      () => deleteAdminStory(story.id),
      `Moved “${story.title}” to the recycle bin.`,
    );
  };

  const reject = async (story: AdminStory, reason: string) => {
    await rejectAdminStory(story.id, reason);
    setNotice(`Rejected “${story.title}”. The story stays private.`);
    reload();
  };

  const openNew = () => {
    setEditingId(null);
    setDraft({ ...emptyStoryDraft });
    setEditorOpen(true);
    setFormError(null);
    setNotice(null);
    window.requestAnimationFrame(() => document.getElementById("field-title")?.focus());
  };

  const startEdit = (story: AdminStory) => {
    setEditingId(story.id);
    setDraft({
      title: story.title,
      slug: story.slug,
      category: story.category ?? "community",
      excerpt: story.excerpt ?? "",
      body: story.body,
      author_name: story.author_name ?? "",
      author_role: story.author_role ?? "",
      cover_image_path: story.cover_image_path ?? "",
      cover_image_url: story.cover_image_url ?? "",
      sort_order: story.sort_order,
      is_sample: story.is_sample,
    });
    setEditorOpen(true);
    setFormError(null);
    setNotice(null);
    window.requestAnimationFrame(() => document.getElementById("field-title")?.focus());
  };

  const cancelEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setDraft(null);
    setFormError(null);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;

    setSaving(true);
    setFormError(null);

    const payload: StoryDraft = {
      title: String(draft.title ?? "").trim(),
      slug: String(draft.slug ?? "").trim(),
      category: (draft.category as StoryCategory) ?? "community",
      excerpt: String(draft.excerpt ?? "").trim() || null,
      body: String(draft.body ?? ""),
      author_name: String(draft.author_name ?? "").trim() || null,
      author_role: String(draft.author_role ?? "").trim() || null,
      cover_image_path: String(draft.cover_image_path ?? "").trim() || null,
      cover_image_url: String(draft.cover_image_url ?? "").trim() || null,
      sort_order: Number(draft.sort_order || 0),
      is_sample: Boolean(draft.is_sample),
    };

    try {
      if (editingId === null) {
        await createAdminStory(payload);
        setNotice("Story saved as a draft. Approve it when it is ready to publish.");
        if (filter === "all") reload();
        else {
          setLoading(true);
          setFilter("all");
        }
      } else {
        await updateAdminStory(editingId, payload);
        setNotice("Story content saved. Its moderation status did not change.");
        reload();
      }

      setEditorOpen(false);
      setEditingId(null);
      setDraft(null);
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Unable to save this story.");
    } finally {
      setSaving(false);
    }
  };

  const filters: Array<{ id: StoryStatusFilter; label: string }> = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "draft", label: "Draft" },
    { id: "all", label: "All" },
  ];

  const actionsDisabled = busyId !== null;

  return (
    <AdminCard
      title="Stories & submissions"
      description="Review reader submissions, approve or reject them, and keep the Notes from the Bandstand editor for admin-authored stories."
      actions={
        <>
          <button type="button" className={primaryButton} onClick={openNew}>
            New story
          </button>
          <button type="button" className={secondaryButton} onClick={reload} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
        <p className="text-sm text-body">
          <strong className="font-serif text-lg font-semibold text-ink">{counts.pending}</strong>{" "}
          {counts.pending === 1 ? "submission" : "submissions"} waiting for review.
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter stories by moderation status"
        >
          {filters.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={filter === entry.id}
              onClick={() => changeFilter(entry.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright ${
                filter === entry.id
                  ? "border-brass/40 bg-brass-bright text-night-950"
                  : "border-line bg-surface text-muted hover:border-brass/40 hover:text-brass"
              }`}
            >
              {entry.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[0.6rem] ${
                  filter === entry.id ? "bg-night-950/15" : "bg-paper-2 text-muted"
                }`}
              >
                {counts[entry.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          ref={noticeRef}
          tabIndex={-1}
          className="mt-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-bright"
        >
          <AdminNotice>{notice}</AdminNotice>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <AdminNotice tone="error">{error}</AdminNotice>
        </div>
      )}

      {editorOpen && draft && (
        <div className="mt-5">
          <p className="mb-3 text-xs text-muted">
            {editingId === null
              ? "New stories start as drafts. Use Approve in the list when the story is ready to publish."
              : "Editing content does not change the story's moderation status."}
          </p>
          <RecordForm
            fields={storyEditorFields}
            draft={draft}
            onChange={(name, value) =>
              setDraft((current) => (current ? { ...current, [name]: value } : current))
            }
            onSubmit={save}
            onCancel={cancelEditor}
            busy={saving}
            error={formError}
            heading={editingId === null ? "New story" : "Edit story"}
          />
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {loading && stories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper p-6 text-sm text-muted">
            Loading submissions…
          </p>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-paper p-8 text-center">
            <IconMusic className="mx-auto size-7 text-brass" />
            <p className="mt-2 font-serif text-lg font-semibold text-ink">
              {filter === "pending"
                ? "The moderation queue is clear"
                : "No stories match this filter"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {filter === "pending"
                ? "New reader submissions will appear here for review."
                : "Try another status filter or create a story."}
            </p>
          </div>
        ) : (
          stories.map((story) => {
            const canApprove = canApproveStory(story.status);
            const canReject = canRejectStory(story.status);
            const canReopen = canReopenStory(story.status);

            return (
              <article key={story.id} className="rounded-2xl border border-line bg-paper p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-semibold text-ink">{story.title}</h3>
                      <StoryStatusBadge status={story.status} />
                      <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">
                        {getCategoryLabel(story.category)}
                      </span>
                      {story.reference_code && (
                        <span
                          className="font-mono text-[0.65rem] text-muted"
                          title="Reference code"
                        >
                          {story.reference_code}
                        </span>
                      )}
                      {story.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brass-bright/40 bg-amber-400/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-300">
                          <IconSparkle className="size-2.5" />
                          Featured
                        </span>
                      )}
                      {story.is_sample && (
                        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted">
                          Sample
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-words text-xs text-muted">
                      {story.author_name || "Unknown author"}
                      {story.author_email ? ` · ${story.author_email}` : ""} · Submitted{" "}
                      {submittedAt(story.created_at)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-body">
                      {story.excerpt || story.body}
                    </p>
                    {story.cover_image_url && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={story.cover_image_url}
                          alt=""
                          className="h-9 w-14 rounded-lg border border-line object-cover"
                        />
                        <span className="text-xs text-muted">Cover photo linked</span>
                      </div>
                    )}
                    {story.rejection_reason && (
                      <p className="mt-2 text-xs leading-relaxed text-plume">
                        <strong className="font-bold">
                          {story.status === "rejected"
                            ? "Rejection reason:"
                            : "Previous rejection reason:"}
                        </strong>{" "}
                        {story.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 lg:max-w-xs lg:justify-end">
                    <button
                      type="button"
                      className={smallButton}
                      onClick={() => setPreviewStory(story)}
                      aria-label={`Preview ${story.title}`}
                    >
                      Preview
                    </button>
                    {story.status === "approved" && (
                      <>
                        <Link
                          to={`/stories/${story.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={smallButton}
                          aria-label={`View public story ${story.title}`}
                        >
                          View public
                        </Link>
                        {story.is_featured ? (
                          <button
                            type="button"
                            className={smallButton}
                            onClick={() => unfeature(story)}
                            disabled={actionsDisabled}
                            aria-label={`Unfeature ${story.title}`}
                          >
                            {busyId === story.id ? "Working…" : "Unfeature"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={smallButton}
                            onClick={() => feature(story)}
                            disabled={actionsDisabled}
                            aria-label={`Feature ${story.title}`}
                          >
                            {busyId === story.id ? "Working…" : "Feature"}
                          </button>
                        )}
                      </>
                    )}
                    {canApprove && (
                      <button
                        type="button"
                        className={smallPrimaryButton}
                        onClick={() => approve(story)}
                        disabled={actionsDisabled}
                        aria-label={`Approve ${story.title}`}
                      >
                        {busyId === story.id ? "Working…" : "Approve"}
                      </button>
                    )}
                    {canReject && (
                      <button
                        type="button"
                        className={dangerButton}
                        onClick={() => setRejectStory(story)}
                        disabled={actionsDisabled}
                        aria-label={`Reject ${story.title}`}
                      >
                        Reject
                      </button>
                    )}
                    {canReopen && (
                      <button
                        type="button"
                        className={smallButton}
                        onClick={() => reopen(story)}
                        disabled={actionsDisabled}
                        aria-label={`Reopen ${story.title}`}
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      type="button"
                      className={smallButton}
                      onClick={() => startEdit(story)}
                      disabled={actionsDisabled}
                      aria-label={`Edit ${story.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={dangerButton}
                      onClick={() => remove(story)}
                      disabled={actionsDisabled}
                      aria-label={`Delete ${story.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {previewStory && (
        <StoryPreviewDialog story={previewStory} onClose={() => setPreviewStory(null)} />
      )}
      {rejectStory && (
        <RejectStoryDialog
          story={rejectStory}
          onClose={() => setRejectStory(null)}
          onRejected={(reason) => reject(rejectStory, reason)}
        />
      )}
    </AdminCard>
  );
}

function SettingsAdmin() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAdminSettings()
      .then((remote) => {
        if (cancelled) return;
        setSettings(
          Object.fromEntries(
            Object.entries(remote).map(([key, value]) => [key, String(value ?? "")]),
          ),
        );
        setError(null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Unable to load settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const groups = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const result: Record<string, Array<[string, string]>> = {};
    Object.entries(settings).forEach(([key, value]) => {
      if (query && !key.toLowerCase().includes(query) && !value.toLowerCase().includes(query))
        return;
      const group = key.split(".")[0] || "general";
      (result[group] ??= []).push([key, value]);
    });
    Object.values(result).forEach((entries) => entries.sort(([a], [b]) => a.localeCompare(b)));
    return result;
  }, [settings, filter]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await updateAdminSettings(settings);
      setNotice("Settings saved. Public pages will use the new values on their next load.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard
      title="Site settings"
      description="Navigation labels, contact details, social links, SEO copy, and public notices are all driven by these values."
      actions={
        <>
          <button
            type="button"
            className={primaryButton}
            onClick={() => void save()}
            disabled={busy || loading}
          >
            {busy ? "Saving…" : "Save all settings"}
          </button>
          <button type="button" className={secondaryButton} onClick={reload} disabled={loading}>
            Refresh
          </button>
        </>
      }
    >
      {notice && <AdminNotice>{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}
      <div className="mt-4">
        <label htmlFor="settings-filter" className={labelClass}>
          Filter settings
        </label>
        <input
          id="settings-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className={inputClass}
          placeholder="Search by key or value…"
        />
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-muted">Loading settings…</p>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(groups).map(([group, entries]) => (
            <div key={group}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-brass">
                {group}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {entries.map(([key, value]) => {
                  const long =
                    value.length > 90 ||
                    /description|notice|tagline|copyright|address|schedule|body/.test(key);
                  return (
                    <div key={key} className={long ? "lg:col-span-2" : ""}>
                      <label htmlFor={`setting-${key}`} className={labelClass}>
                        {key}
                      </label>
                      {long ? (
                        <textarea
                          id={`setting-${key}`}
                          value={value}
                          onChange={(event) =>
                            setSettings((current) => ({ ...current, [key]: event.target.value }))
                          }
                          className={textareaClass}
                          rows={3}
                        />
                      ) : (
                        <input
                          id={`setting-${key}`}
                          value={value}
                          onChange={(event) =>
                            setSettings((current) => ({ ...current, [key]: event.target.value }))
                          }
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groups).length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-paper p-6 text-sm text-muted">
              No settings match that filter.
            </p>
          )}
        </div>
      )}
    </AdminCard>
  );
}

function Overview({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [counts, setCounts] = useState<Record<string, number | string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      fetchAdminPage("home"),
      fetchAdminPage("about"),
      fetchAdminPerformances(),
      fetchAdminTestimonials(),
      fetchAdminStories(),
      fetchAdminSettings(),
    ]).then((results) => {
      if (cancelled) return;
      const value = (index: number) => {
        const result = results[index];
        if (result.status !== "fulfilled") return "—";
        if (index < 2) return (result.value as AdminPageContent).sections.length;
        if (index === 4) return (result.value as { stories: AdminStory[] }).stories.length;
        if (index === 5) return Object.keys(result.value as Record<string, string>).length;
        return (result.value as unknown[]).length;
      };
      setCounts({
        home: value(0),
        about: value(1),
        performances: value(2),
        testimonials: value(3),
        stories: value(4),
        settings: value(5),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: Array<{
    tab: Tab;
    label: string;
    value: number | string | undefined;
    icon: typeof IconMusic;
    hint: string;
  }> = [
    {
      tab: "home",
      label: "Home sections",
      value: counts.home,
      icon: IconCap,
      hint: "Page copy and layouts",
    },
    {
      tab: "about",
      label: "About sections",
      value: counts.about,
      icon: IconInfo,
      hint: "Story, values, FAQ",
    },
    {
      tab: "performances",
      label: "Performances",
      value: counts.performances,
      icon: IconTicket,
      hint: "Concerts and outreach",
    },
    {
      tab: "testimonials",
      label: "Testimonials",
      value: counts.testimonials,
      icon: IconUsers,
      hint: "Voices from the band",
    },
    {
      tab: "stories",
      label: "Stories",
      value: counts.stories,
      icon: IconMusic,
      hint: "Notes from the Bandstand",
    },
    {
      tab: "settings",
      label: "Settings",
      value: counts.settings,
      icon: IconKey,
      hint: "Contact, SEO, notices",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="stage relative isolate overflow-hidden rounded-3xl border border-stage-line-strong">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_30px,var(--stage-staff)_30px_32px)]" />
          <div className="absolute -right-16 top-0 size-64 rounded-full bg-amber-400/10 blur-3xl" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brass">CMS overview</p>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl font-semibold tracking-tight text-balance text-stage-fg sm:text-4xl">
            Welcome back to the CMS.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stage-muted">
            Everything visitors see is managed here. Start with the home page, then check the
            schedule and Stories before publishing.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => onNavigate("home")}>
              Edit home page
            </button>
            <button type="button" className={secondaryButton} onClick={() => onNavigate("stories")}>
              Review Stories
            </button>
            <a href="/" target="_blank" rel="noreferrer" className={secondaryButton}>
              Open public site
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ tab, label, value, icon: Icon, hint }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onNavigate(tab)}
            className="group rounded-2xl border border-line bg-surface p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-lg"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brass/10 text-brass">
              <Icon className="size-5" />
            </span>
            <p className="mt-4 font-serif text-3xl font-semibold text-ink">{value ?? "…"}</p>
            <p className="mt-0.5 text-sm font-bold text-ink">{label}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </button>
        ))}
      </div>

      <AdminCard
        title="Publishing checklist"
        description="A short pass before you announce anything new."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Check the date", "Confirm the performance date, start time, venue, and city."],
            ["Read it aloud", "Stories should sound like a person, not a press release."],
            ["Preview first", "Open the public page in a new tab before publishing."],
          ].map(([heading, copy]) => (
            <div key={heading} className="rounded-2xl border border-line bg-paper p-4">
              <p className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
                <IconCheckCircle className="size-4 text-brass" />
                {heading}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function AdminDashboard() {
  usePageTitle("CMS dashboard");
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabFromParam(searchParams.get("tab"));

  const setTab = useCallback(
    (next: Tab) => {
      setSearchParams(next === "overview" ? {} : { tab: next }, { replace: true });
    },
    [setSearchParams],
  );

  const onLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const active = tabs.find((entry) => entry.id === tab) ?? tabs[0];

  return (
    <div className="min-h-screen bg-paper text-body" data-active-tab={tab}>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-night-950 ring-1 ring-brass/50">
              <img src={logo} alt="" className="size-5" />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate font-serif text-sm font-semibold text-ink">
                Music Without Borders
              </span>
              <span className="block text-[0.62rem] font-bold uppercase tracking-widest text-muted">
                CMS workspace
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-line bg-paper px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:border-brass/40 hover:text-brass sm:inline-flex"
            >
              View site
            </a>
            <ThemeToggle />
            <div className="hidden max-w-48 truncate text-right lg:block">
              <p className="truncate text-xs font-bold text-ink">{user?.name}</p>
              <p className="truncate text-[0.65rem] text-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-2 text-xs font-bold text-muted transition-colors hover:border-plume/30 hover:text-plume"
            >
              <IconArrowLeft className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[230px_1fr] lg:gap-7 lg:px-8 lg:py-7">
        <aside className="mb-4 lg:mb-0">
          <nav
            aria-label="CMS sections"
            className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-2 shadow-sm lg:sticky lg:top-24 lg:flex-col lg:overflow-visible"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full ${
                  tab === id
                    ? "bg-brass-bright text-night-950 shadow-sm"
                    : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brass">
                Admin
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink">
                {active.label}
              </h1>
            </div>
            <p className="text-xs text-muted">
              Signed in as <span className="font-bold text-ink">{user?.email}</span>
            </p>
          </div>

          {tab === "overview" && <Overview onNavigate={setTab} />}
          {tab === "home" && <PageEditor page="home" />}
          {tab === "about" && <PageEditor page="about" />}
          {tab === "performances" && <PerformancesAdmin />}
          {tab === "testimonials" && <TestimonialsAdmin />}
          {tab === "stories" && <StoriesAdmin />}
          {tab === "settings" && <SettingsAdmin />}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
