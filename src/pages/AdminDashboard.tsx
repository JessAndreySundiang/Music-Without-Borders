import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  createAdminPerformance,
  createAdminStory,
  createAdminTestimonial,
  deleteAdminPerformance,
  deleteAdminStory,
  deleteAdminTestimonial,
  fetchAdminPage,
  fetchAdminPerformances,
  fetchAdminSettings,
  fetchAdminStories,
  fetchAdminTestimonials,
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
import { usePageTitle } from "../lib/usePageTitle";
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
const dangerButton =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-plume/30 bg-plume/10 px-2.5 py-1.5 text-xs font-semibold text-plume transition-colors hover:bg-plume/15";

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

type FieldType = "text" | "textarea" | "date" | "time" | "number" | "checkbox";
type Field = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  rows?: number;
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

function StoriesAdmin() {
  const fields: Field[] = [
    { name: "title", label: "Title", required: true },
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
    { name: "sort_order", label: "Sort order", type: "number" },
    { name: "is_published", label: "Published", type: "checkbox" },
    { name: "is_sample", label: "Sample story (shown with a label)", type: "checkbox" },
  ];

  return (
    <RecordManager<AdminStory>
      title="Stories"
      singular="story"
      description="Notes from the Bandstand. Drafts stay off the public site until you publish them."
      fields={fields}
      emptyDraft={{
        title: "",
        slug: "",
        excerpt: "",
        body: "",
        author_name: "Music Without Borders",
        author_role: "Notes from the Bandstand",
        cover_image_path: "",
        sort_order: 0,
        is_published: false,
        is_sample: false,
      }}
      fetchRecords={fetchAdminStories}
      createRecord={(draft) => createAdminStory(draft as unknown as StoryDraft)}
      updateRecord={(id, draft) => updateAdminStory(id, draft as unknown as StoryDraft)}
      deleteRecord={deleteAdminStory}
      recordTitle={(record) => record.title}
      recordMeta={(record) => (
        <>
          <span>{record.published_at ?? "Not published"}</span>
          <span>{record.author_name || "Music Without Borders"}</span>
          {record.is_sample && <span className="font-semibold text-brass">Sample content</span>}
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
      publicHref={(record) => (record.is_published ? `/stories/${record.slug}` : null)}
    />
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
  const [tab, setTab] = useState<Tab>("overview");

  const onLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const active = tabs.find((entry) => entry.id === tab) ?? tabs[0];

  return (
    <div className="min-h-screen bg-paper text-body">
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
