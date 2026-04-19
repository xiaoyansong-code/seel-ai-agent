import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import {
  STAGE_LABEL,
  TOUCHPOINTS,
  type TouchpointMeta,
} from "@/lib/sales-agent/constants";
import type { Stage, TouchpointId } from "@/lib/sales-agent/types";
import {
  Callout,
  Drawer,
  Field,
  Panel,
  SAButton,
  SAInput,
  SASelect,
  SAToggle,
  StatusDot,
} from "./primitives";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";

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

  // If the selected touchpoint is filtered out by platform, fall back
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
      {/* Left list */}
      <div className="w-[280px] shrink-0 border-r border-neutral-200 bg-white overflow-auto">
        <div className="px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-500 mb-2 px-1">
            Touchpoints
          </p>
          {(Object.keys(grouped) as Stage[]).map((stage) => {
            if (grouped[stage].length === 0) return null;
            return (
              <div key={stage} className="mb-3 last:mb-0">
                <p className="text-[11px] text-neutral-500 px-1 mb-1">
                  {STAGE_LABEL[stage]}
                </p>
                <div className="space-y-0.5">
                  {grouped[stage].map((t) => (
                    <TouchpointListRow
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

      {/* Right config */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-[760px] px-6 py-6">
          {selected && <TouchpointConfig meta={selected} />}
        </div>
      </div>
    </div>
  );
}

/* ── List row ──────────────────────────────────────────── */
function TouchpointListRow({
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

  let statusKind: "on" | "off" | "warn" = "off";
  if (!depMet && meta.dependencyKey) statusKind = "warn";
  else if (tp?.enabled) statusKind = "on";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-left",
        active
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-700 hover:bg-neutral-50",
      )}
    >
      <StatusDot kind={statusKind} />
      <span className="text-[13px] truncate flex-1">{meta.label}</span>
      {meta.previewOnly && (
        <span className="text-[10px] text-neutral-500 border border-neutral-300 px-1 rounded-[3px]">
          preview
        </span>
      )}
    </button>
  );
}

/* ── Config panel ──────────────────────────────────────── */
function TouchpointConfig({ meta }: { meta: TouchpointMeta }) {
  if (meta.id === "thank_you_page") return <ThankYouPagePanel />;
  if (meta.dependencyKey) return <DependencyTouchpointPanel meta={meta} />;
  return <StrategyTouchpointPanel meta={meta} />;
}

/* ── Search Bar / LiveWidget panel ─────────────────────── */
function DependencyTouchpointPanel({ meta }: { meta: TouchpointMeta }) {
  const store = useSalesAgent();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;
  const depMet = store.dependency[meta.dependencyKey!];

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[11px] text-neutral-500 uppercase tracking-[0.06em]">
          {STAGE_LABEL[meta.stage]}
        </p>
        <h2 className="text-[16px] font-semibold text-neutral-900 mt-0.5">
          {meta.label}
        </h2>
        <p className="text-[12px] text-neutral-500 mt-0.5">{meta.description}</p>
      </header>

      {!depMet && (
        <Callout tone="warn" title="Dependency not met">
          <p>
            {meta.id === "search_bar"
              ? "AI Search is not enabled for this store. Enable Search Bar in Support Agent before turning on this touchpoint."
              : "LiveWidget is not connected to the storefront. Enable it from Support Agent before turning on this touchpoint."}
          </p>
          <div className="mt-2">
            <Link href="/">
              <SAButton variant="secondary" size="sm">
                Go to Support Agent
              </SAButton>
            </Link>
          </div>
        </Callout>
      )}

      <Panel className="p-4">
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
            onChange={(v) => store.updateTouchpoint(meta.id, { enabled: v })}
          />
        </div>
      </Panel>

      <Callout tone="info">
        Recommendations on {meta.label} are driven by the shopper's real-time
        query or conversation, so no explicit strategy is selected.
      </Callout>
    </div>
  );
}

/* ── Seel RC / WFP Email panel ──────────────────────────── */
function StrategyTouchpointPanel({ meta }: { meta: TouchpointMeta }) {
  const store = useSalesAgent();
  const [, navigate] = useLocation();
  const tp = store.touchpoints.find((t) => t.id === meta.id)!;

  const currentStrategy = store.strategies.find((s) => s.id === tp.strategyId);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[11px] text-neutral-500 uppercase tracking-[0.06em]">
          {STAGE_LABEL[meta.stage]}
        </p>
        <h2 className="text-[16px] font-semibold text-neutral-900 mt-0.5">
          {meta.label}
        </h2>
        <p className="text-[12px] text-neutral-500 mt-0.5">{meta.description}</p>
      </header>

      <Panel className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-neutral-900">Enabled</p>
            <p className="text-[12px] text-neutral-500 mt-0.5">
              Serve recommendations at this touchpoint.
            </p>
          </div>
          <SAToggle
            checked={tp.enabled}
            onChange={(v) => store.updateTouchpoint(meta.id, { enabled: v })}
          />
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <Field
            label="Strategy"
            help={
              currentStrategy
                ? "This strategy is shared with other touchpoints using it."
                : "Select a strategy to start serving recommendations."
            }
          >
            <div className="flex items-center gap-2">
              <SASelect
                value={tp.strategyId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__new__") {
                    navigate("/sales-agent/strategies");
                    return;
                  }
                  store.updateTouchpoint(meta.id, { strategyId: v || null });
                }}
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
      </Panel>
    </div>
  );
}

/* ── Thank You Page panel (V2 preview) ─────────────────── */
function ThankYouPagePanel() {
  const store = useSalesAgent();
  const [drawerWidgetId, setDrawerWidgetId] = useState<string | null>(null);

  const widget = store.thankYouWidgets.find((w) => w.id === drawerWidgetId);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[11px] text-neutral-500 uppercase tracking-[0.06em]">
          Post-purchase
        </p>
        <h2 className="text-[16px] font-semibold text-neutral-900 mt-0.5">
          Thank You Page
        </h2>
        <p className="text-[12px] text-neutral-500 mt-0.5">
          Order confirmation recommendations.
        </p>
      </header>

      <Callout tone="info" title="Preview — not in this release">
        The Thank You Page composer ships in V2. Widgets below are read-only
        previews of the upcoming capability set.
      </Callout>

      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-neutral-800">
          Widgets ({store.thankYouWidgets.length})
        </p>
        <SAButton variant="secondary" size="sm" disabled>
          Add widget
        </SAButton>
      </div>

      <Panel className="divide-y divide-neutral-100">
        {store.thankYouWidgets.map((w) => {
          const strategy = store.strategies.find((s) => s.id === w.strategyId);
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
                    {strategy?.name ?? "No strategy"} · {w.productCount} products · CTA "
                    {w.ctaLabel}"
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
      </Panel>

      <ThankYouWidgetDrawer
        open={!!widget}
        widgetId={drawerWidgetId}
        onClose={() => setDrawerWidgetId(null)}
      />
    </div>
  );
}

/* ── Thank You widget drawer ────────────────────────────── */
function ThankYouWidgetDrawer({
  open,
  widgetId,
  onClose,
}: {
  open: boolean;
  widgetId: string | null;
  onClose: () => void;
}) {
  const store = useSalesAgent();
  const [v2Open, setV2Open] = useState(false);
  const widget = store.thankYouWidgets.find((w) => w.id === widgetId);
  if (!widget && !open) return null;

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
        <div className="p-4 space-y-4">
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
            <SAToggle
              checked={widget.enabled}
              onChange={(v) =>
                store.updateThankYouWidget(widget.id, { enabled: v })
              }
            />
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

          {/* V2 capabilities — collapsed, disabled */}
          <div className="border border-neutral-200 rounded-[4px]">
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
