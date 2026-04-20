import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import {
  STAGE_LABEL,
  TOUCHPOINTS,
  TOUCHPOINT_TAG_META,
  type TouchpointMeta,
} from "@/lib/sales-agent/constants";
import type { Stage, TouchpointId, TouchpointTag } from "@/lib/sales-agent/types";
import {
  Callout,
  Drawer,
  Field,
  InfoTip,
  Modal,
  SAButton,
  SAInput,
  SASelect,
  SAToggle,
  StatusDot,
} from "./primitives";
import {
  ChevronRight,
  MessageSquare,
  Package,
  Search,
  Mail,
  Undo2,
  Check,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";

/* ── Small tag chip for touchpoint tags ─────────────────── */
function TouchpointTagChip({ tag }: { tag: TouchpointTag }) {
  const meta = TOUCHPOINT_TAG_META[tag];
  return (
    <span
      className={cn(
        "inline-flex items-center h-[18px] px-1.5 rounded border text-[10px] font-medium leading-none",
        meta.className,
      )}
    >
      {tag === "seel_exclusive" && (
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
      )}
      {meta.label}
    </span>
  );
}

/* ── Shopify Plus required widget ───────────────────────── */
function ShopifyPlusWidget({ met }: { met: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3",
        met
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-amber-50 border-amber-200",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border",
          met
            ? "bg-white border-emerald-200 text-emerald-700"
            : "bg-white border-amber-200 text-amber-700",
        )}
      >
        {met ? (
          <Check className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              "text-[13px] font-semibold",
              met ? "text-emerald-800" : "text-amber-900",
            )}
          >
            Required: Shopify Plus
          </p>
          <span
            className={cn(
              "inline-flex items-center h-[18px] px-1.5 rounded text-[10px] font-medium border",
              met
                ? "bg-white text-emerald-700 border-emerald-300"
                : "bg-white text-amber-700 border-amber-300",
            )}
          >
            {met ? "Met" : "Not met"}
          </span>
        </div>
        <p
          className={cn(
            "text-[12px] mt-0.5",
            met ? "text-emerald-700/80" : "text-amber-800/90",
          )}
        >
          {met
            ? "Your store is on Shopify Plus, so this touchpoint is available."
            : "This touchpoint relies on Shopify Plus-only customizations. Upgrade to Shopify Plus to enable it."}
        </p>
      </div>
    </div>
  );
}

/* ── Icon per touchpoint ───────────────────────────────── */
const TOUCHPOINT_ICON: Record<TouchpointId, typeof Search> = {
  search_bar: Search,
  live_widget: MessageSquare,
  thank_you_page: Package,
  seel_rc: Undo2,
  wfp_email: Mail,
};

export default function TouchpointsTab() {
  const store = useSalesAgent();
  const visible = useMemo(
    () =>
      TOUCHPOINTS.filter((t) => store.platform === "shopify" || !t.shopifyOnly),
    [store.platform],
  );
  const [selectedId, setSelectedId] = useState<TouchpointId>(
    visible[0]?.id ?? "seel_rc",
  );

  // Confirm dialog for enable actions
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    onConfirm: () => void;
  } | null>(null);

  const selected = visible.find((t) => t.id === selectedId) ?? visible[0];

  // Group by stage
  const grouped = useMemo(() => {
    const g: Record<Stage, TouchpointMeta[]> = {
      pre_purchase: [],
      live_chat: [],
      post_purchase: [],
    };
    visible.forEach((t) => g[t.stage].push(t));
    return g;
  }, [visible]);

  return (
    <div className="flex h-full min-h-0">
      {/* Left column: touchpoint cards */}
      <div className="w-[340px] shrink-0 border-r border-neutral-200 bg-[#fafafa] overflow-auto">
        <div className="px-4 py-5 space-y-5">
          {(Object.keys(grouped) as Stage[]).map((stage) => {
            if (grouped[stage].length === 0) return null;
            return (
              <div key={stage}>
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.08em] mb-2 px-0.5">
                  {STAGE_LABEL[stage]}
                </p>
                <div className="space-y-2">
                  {grouped[stage].map((t) => (
                    <TouchpointCard
                      key={t.id}
                      meta={t}
                      active={selected?.id === t.id}
                      onClick={() => setSelectedId(t.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column: detail with stacked sections */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-[760px] px-6 py-6">
          {selected && (
            <TouchpointDetail
              meta={selected}
              onRequestConfirm={(c) => setConfirm(c)}
            />
          )}
        </div>
      </div>

      {/* Enable confirmation */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ""}
        width="max-w-[420px]"
        footer={
          <>
            <SAButton variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </SAButton>
            <SAButton
              variant="primary"
              onClick={() => {
                confirm?.onConfirm();
                setConfirm(null);
              }}
            >
              Confirm
            </SAButton>
          </>
        }
      >
        <p className="text-[13px] text-neutral-700 leading-relaxed">
          {confirm?.body}
        </p>
      </Modal>
    </div>
  );
}

/* ── Touchpoint card ──────────────────────────────────── */
function TouchpointCard({
  meta,
  active,
  onClick,
}: {
  meta: TouchpointMeta;
  active: boolean;
  onClick: () => void;
}) {
  const store = useSalesAgent();
  const tp = store.touchpoints.find((t) => t.id === meta.id);
  const depMet =
    !meta.dependencyKey || store.dependency[meta.dependencyKey] === true;
  const Icon = TOUCHPOINT_ICON[meta.id];

  const isOn = !!tp?.enabled && depMet;
  const row = store.analytics.rows.find((r) => r.touchpointId === meta.id);
  const revenue = row?.revenue ?? 0;

  // Only show Seel-exclusive tag in the list
  const showTag = meta.tags?.includes("seel_exclusive");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-white border rounded-lg p-3 transition-all",
        active
          ? "border-primary/40 ring-2 ring-primary/10"
          : "border-neutral-200 hover:border-neutral-300",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center shrink-0 border",
            active
              ? "bg-primary/8 border-primary/20 text-primary"
              : "bg-neutral-50 border-neutral-200 text-neutral-600",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Title row: title + Seel-exclusive tag inline */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <p className="text-[13px] font-semibold text-neutral-900 truncate">
              {meta.label}
            </p>
            {showTag && <TouchpointTagChip tag="seel_exclusive" />}
            {meta.previewOnly && (
              <span className="text-[10px] text-neutral-500 bg-neutral-100 border border-neutral-200 px-1 py-[1px] rounded shrink-0">
                preview
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
            {meta.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            <StatusDot kind={isOn ? "on" : "off"} />
            <span
              className={cn(
                isOn ? "text-emerald-700" : "text-neutral-500",
              )}
            >
              {isOn ? "On" : "Off"}
            </span>
            {isOn && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-600 tabular-nums">
                  ${revenue.toLocaleString()} last 30d
                </span>
              </>
            )}
            {!depMet && meta.dependencyKey && (
              <>
                <span className="text-neutral-300">·</span>
                <Link href="/">
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline"
                  >
                    Set up
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Detail container — flat, two stacked sections ──────── */
function TouchpointDetail({
  meta,
  onRequestConfirm,
}: {
  meta: TouchpointMeta;
  onRequestConfirm: (c: {
    title: string;
    body: string;
    onConfirm: () => void;
  }) => void;
}) {
  const store = useSalesAgent();
  const Icon = TOUCHPOINT_ICON[meta.id];
  if (meta.id === "thank_you_page")
    return <ThankYouPageDetail onRequestConfirm={onRequestConfirm} />;
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3 pb-1">
        <div className="w-10 h-10 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-neutral-500 uppercase tracking-[0.08em]">
            {STAGE_LABEL[meta.stage]}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[18px] font-bold text-neutral-900 leading-tight">
              {meta.label}
            </h2>
            {meta.tags?.map((tag) => (
              <TouchpointTagChip key={tag} tag={tag} />
            ))}
          </div>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            {meta.description}
          </p>
        </div>
      </header>

      {meta.requiresShopifyPlus && (
        <ShopifyPlusWidget met={store.dependency.shopifyPlus} />
      )}

      <DetailSection title="Setting">
        {meta.dependencyKey ? (
          <DependencySetting
            meta={meta}
            onRequestConfirm={onRequestConfirm}
          />
        ) : (
          <StrategySetting meta={meta} onRequestConfirm={onRequestConfirm} />
        )}
      </DetailSection>

      <DetailSection title="Statistics">
        <TouchpointStats touchpointId={meta.id} />
      </DetailSection>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold text-neutral-900 mb-2">
        {title}
      </h3>
      <div className="bg-white border border-neutral-200 rounded-lg">
        {children}
      </div>
    </section>
  );
}

/* ── Setting: Search Bar / LiveChat Widget ───────────── */
function DependencySetting({
  meta,
  onRequestConfirm,
}: {
  meta: TouchpointMeta;
  onRequestConfirm: (c: {
    title: string;
    body: string;
    onConfirm: () => void;
  }) => void;
}) {
  const store = useSalesAgent();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;
  const depMet = store.dependency[meta.dependencyKey!];

  const handleToggle = (v: boolean) => {
    if (v) {
      onRequestConfirm({
        title: `Turn on ${meta.label}?`,
        body: `Once enabled, Sales Agent recommendations will be served on ${meta.label} in production. You can switch it off at any time.`,
        onConfirm: () => store.updateTouchpoint(meta.id, { enabled: true }),
      });
    } else {
      store.updateTouchpoint(meta.id, { enabled: false });
    }
  };

  return (
    <div className="px-5 py-4 space-y-4">
      {!depMet && (
        <Callout tone="warn" title="Dependency not met">
          <p>
            {meta.id === "search_bar"
              ? "AI Search is not enabled for this store. Enable Search Bar in Support Agent before turning on this touchpoint."
              : "LiveChat Widget is not connected to the storefront. Enable it from Support Agent before turning on this touchpoint."}
          </p>
          <div className="mt-2">
            <Link href="/">
              <SAButton variant="secondary" size="sm">
                Set up
              </SAButton>
            </Link>
          </div>
        </Callout>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-neutral-900">Enabled</p>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Show Sales Agent recommendations on {meta.label}.
          </p>
        </div>
        <SAToggle
          checked={tp.enabled}
          disabled={!depMet}
          onChange={handleToggle}
        />
      </div>

      <div className="text-[12px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2">
        Recommendations on {meta.label} are driven by the shopper's real-time
        query or conversation, so no explicit strategy is selected.
      </div>
    </div>
  );
}

/* ── Setting: Seel RC / WFP Email ──────────────────────── */
function StrategySetting({
  meta,
  onRequestConfirm,
}: {
  meta: TouchpointMeta;
  onRequestConfirm: (c: {
    title: string;
    body: string;
    onConfirm: () => void;
  }) => void;
}) {
  const store = useSalesAgent();
  const [, navigate] = useLocation();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;

  const handleToggle = (v: boolean) => {
    if (v) {
      onRequestConfirm({
        title: `Turn on ${meta.label}?`,
        body: `Once enabled, recommendations from the selected strategy will be served at this touchpoint. You can switch it off at any time.`,
        onConfirm: () => store.updateTouchpoint(meta.id, { enabled: true }),
      });
    } else {
      store.updateTouchpoint(meta.id, { enabled: false });
    }
  };

  const handleStrategyChange = (v: string) => {
    if (v === "__new__") {
      navigate("/sales-agent/strategies");
      return;
    }
    const next = v || null;
    if (tp.enabled && next !== tp.strategyId) {
      onRequestConfirm({
        title: `Change strategy for ${meta.label}?`,
        body: `This touchpoint is live. Changes apply immediately to shoppers in production.`,
        onConfirm: () =>
          store.updateTouchpoint(meta.id, { strategyId: next }),
      });
    } else {
      store.updateTouchpoint(meta.id, { strategyId: next });
    }
  };

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-neutral-900">Enabled</p>
          <p className="text-[12px] text-neutral-500 mt-0.5">
            Serve recommendations at this touchpoint.
          </p>
        </div>
        <SAToggle checked={tp.enabled} onChange={handleToggle} />
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <Field
          label="Strategy"
          help="This strategy is shared with other touchpoints using it."
        >
          <div className="flex items-center gap-2">
            <SASelect
              value={tp.strategyId ?? ""}
              onChange={(e) => handleStrategyChange(e.target.value)}
              className="flex-1"
            >
              <option value="">— None selected —</option>
              {store.strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option disabled>──────────</option>
              <option value="__new__">+ Create new strategy…</option>
            </SASelect>
          </div>
        </Field>
      </div>
    </div>
  );
}

/* ── Statistics (per-touchpoint) ───────────────────────── */
function TouchpointStats({ touchpointId }: { touchpointId: TouchpointId }) {
  const store = useSalesAgent();
  const row = store.analytics.rows.find((r) => r.touchpointId === touchpointId);
  const isEmpty = !row || row.impressions === 0;

  if (isEmpty) {
    return (
      <div className="px-5 py-6 text-center text-[12px] text-neutral-500">
        No traffic in the last 30 days.
      </div>
    );
  }

  const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;

  const cells: {
    label: string;
    value: string;
    tip: string;
    sub?: string;
  }[] = [
    {
      label: "Impressions",
      value: row.impressions.toLocaleString(),
      tip: "Times recommendations were shown at this touchpoint.",
    },
    {
      label: "CTR",
      value: `${(ctr * 100).toFixed(1)}%`,
      tip: "Clicks divided by impressions.",
    },
    {
      label: "Orders",
      value: row.orders.toLocaleString(),
      tip: "Orders attributed to this touchpoint within the 7-day window.",
    },
    {
      label: "Revenue",
      value: `$${row.revenue.toLocaleString()}`,
      tip: "Attributed revenue from recommended products (Own products only).",
      sub: formatDeltaInline(row.delta),
    },
  ];

  return (
    <div className="px-5 py-4 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
              <span className="uppercase tracking-[0.06em] font-medium">
                {c.label}
              </span>
              <InfoTip>{c.tip}</InfoTip>
            </div>
            <p className="text-[18px] font-semibold text-neutral-900 tabular-nums mt-0.5">
              {c.value}
            </p>
            {c.sub && (
              <p className="text-[11px] mt-0.5 tabular-nums">
                <span
                  className={cn(
                    c.sub.startsWith("+") && "text-emerald-700",
                    c.sub.startsWith("−") && "text-red-700",
                  )}
                >
                  {c.sub}
                </span>
                <span className="text-neutral-400 ml-1">vs previous</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
        Last 30 days · attribution window 7 days.
      </p>
    </div>
  );
}

function formatDeltaInline(d: number): string {
  if (d === 0) return "0.0%";
  const pct = Math.abs(d * 100).toFixed(1);
  return d > 0 ? `+${pct}%` : `−${pct}%`;
}

/* ── Thank You Page detail (V2 preview) ────────────────── */
function ThankYouPageDetail({
  onRequestConfirm,
}: {
  onRequestConfirm: (c: {
    title: string;
    body: string;
    onConfirm: () => void;
  }) => void;
}) {
  const store = useSalesAgent();
  const meta = TOUCHPOINTS.find((t) => t.id === "thank_you_page")!;
  const [drawerWidgetId, setDrawerWidgetId] = useState<string | null>(null);
  const widget = store.thankYouWidgets.find((w) => w.id === drawerWidgetId);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3 pb-1">
        <div className="w-10 h-10 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600">
          <Package className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-neutral-500 uppercase tracking-[0.08em]">
            Post-purchase
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[18px] font-bold text-neutral-900 leading-tight">
              Thank You Page
            </h2>
            {meta.tags?.map((tag) => (
              <TouchpointTagChip key={tag} tag={tag} />
            ))}
          </div>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Order confirmation recommendations.
          </p>
        </div>
      </header>

      {meta.requiresShopifyPlus && (
        <ShopifyPlusWidget met={store.dependency.shopifyPlus} />
      )}

      <Callout tone="info" title="Preview — not in this release">
        The Thank You Page composer ships in V2. Widgets below are read-only
        previews of the upcoming capability set.
      </Callout>

      <DetailSection title="Setting">
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-neutral-800">
              Widgets ({store.thankYouWidgets.length})
            </p>
            <SAButton variant="secondary" size="sm" disabled>
              Add widget
            </SAButton>
          </div>

          <div className="border border-neutral-200 rounded-md divide-y divide-neutral-100">
            {store.thankYouWidgets.map((w) => {
              const strategy = store.strategies.find(
                (s) => s.id === w.strategyId,
              );
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <StatusDot kind={w.enabled ? "on" : "off"} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-neutral-900 truncate">
                        {w.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {strategy?.name ?? "No strategy"} · {w.productCount}{" "}
                        products · CTA "{w.ctaLabel}"
                      </p>
                    </div>
                  </div>
                  <SAButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrawerWidgetId(w.id)}
                  >
                    Edit
                    <ChevronRight className="w-3 h-3 ml-0.5 opacity-60" />
                  </SAButton>
                </div>
              );
            })}
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Statistics">
        <TouchpointStats touchpointId="thank_you_page" />
      </DetailSection>

      <ThankYouWidgetDrawer
        open={!!widget}
        widgetId={drawerWidgetId}
        onClose={() => setDrawerWidgetId(null)}
        onRequestConfirm={onRequestConfirm}
      />
    </div>
  );
}

/* ── Thank You widget drawer ────────────────────────────── */
function ThankYouWidgetDrawer({
  open,
  widgetId,
  onClose,
  onRequestConfirm,
}: {
  open: boolean;
  widgetId: string | null;
  onClose: () => void;
  onRequestConfirm: (c: {
    title: string;
    body: string;
    onConfirm: () => void;
  }) => void;
}) {
  const store = useSalesAgent();
  const [v2Open, setV2Open] = useState(false);
  const widget = store.thankYouWidgets.find((w) => w.id === widgetId);
  if (!widget && !open) return null;

  const handleToggle = (v: boolean) => {
    if (!widget) return;
    if (v) {
      onRequestConfirm({
        title: `Turn on "${widget.name}"?`,
        body: "Widget will start appearing on the Thank You Page for eligible shoppers.",
        onConfirm: () =>
          store.updateThankYouWidget(widget.id, { enabled: true }),
      });
    } else {
      store.updateThankYouWidget(widget.id, { enabled: false });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Thank You Page widget"
      footer={
        <>
          <SAButton variant="ghost" onClick={onClose}>
            Close
          </SAButton>
          <span title="Thank You Page editing ships in V2">
            <SAButton variant="primary" disabled>
              Save
            </SAButton>
          </span>
        </>
      }
    >
      {widget && (
        <div className="p-5 space-y-4">
          <Callout tone="info">
            This drawer is a V2 preview. Fields are editable locally, but Save
            is disabled for this release.
          </Callout>

          <Field label="Widget name" htmlFor="ty_name">
            <SAInput
              id="ty_name"
              value={widget.name}
              onChange={(e) =>
                store.updateThankYouWidget(widget.id, { name: e.target.value })
              }
            />
          </Field>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-neutral-900">Enabled</p>
              <p className="text-[12px] text-neutral-500">
                Toggle this widget on the Thank You Page.
              </p>
            </div>
            <SAToggle checked={widget.enabled} onChange={handleToggle} />
          </div>

          <Field label="Strategy" htmlFor="ty_strategy">
            <SASelect
              id="ty_strategy"
              value={widget.strategyId}
              onChange={(e) =>
                store.updateThankYouWidget(widget.id, {
                  strategyId: e.target.value,
                })
              }
            >
              {store.strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SASelect>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" htmlFor="ty_title">
              <SAInput
                id="ty_title"
                value={widget.title}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    title: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Subtitle" htmlFor="ty_sub">
              <SAInput
                id="ty_sub"
                value={widget.subtitle}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    subtitle: e.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Product count" htmlFor="ty_count">
              <SAInput
                id="ty_count"
                type="number"
                min={1}
                max={10}
                value={widget.productCount}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    productCount: Number(e.target.value) || 1,
                  })
                }
              />
            </Field>
            <Field label="CTA label" htmlFor="ty_cta">
              <SAInput
                id="ty_cta"
                value={widget.ctaLabel}
                onChange={(e) =>
                  store.updateThankYouWidget(widget.id, {
                    ctaLabel: e.target.value,
                  })
                }
              />
            </Field>
          </div>

          <div className="border border-neutral-200 rounded-md">
            <button
              type="button"
              onClick={() => setV2Open((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-left"
            >
              <span className="text-[13px] font-medium text-neutral-900">
                V2 capabilities
              </span>
              <span className="text-[11px] text-neutral-500">
                {v2Open ? "Hide" : "Show"}
              </span>
            </button>
            {v2Open && (
              <div className="border-t border-neutral-200 divide-y divide-neutral-100">
                {[
                  { k: "Layout", v: "Grid (default)" },
                  { k: "Countdown", v: "Not configured" },
                  { k: "Discount", v: "None" },
                  { k: "Customer Segment", v: "All customers" },
                  { k: "A/B experiment", v: "Not configured" },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="flex items-center justify-between px-3 py-2 opacity-60"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-neutral-700">
                        {row.k}
                      </p>
                      <p className="text-[11px] text-neutral-500">{row.v}</p>
                    </div>
                    <SAToggle checked={false} disabled onChange={() => {}} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
