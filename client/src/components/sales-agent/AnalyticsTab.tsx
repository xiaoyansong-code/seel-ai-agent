import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { TOUCHPOINTS, touchpointLabel } from "@/lib/sales-agent/constants";
import type { TouchpointId } from "@/lib/sales-agent/types";
import {
  Callout,
  Panel,
  SAButton,
  SASelect,
} from "./primitives";

type Range = "7d" | "30d" | "90d";

export default function AnalyticsTab() {
  const store = useSalesAgent();
  const [range, setRange] = useState<Range>("30d");
  const [selected, setSelected] = useState<TouchpointId[]>(
    TOUCHPOINTS.map((t) => t.id),
  );

  const data = store.analytics;
  const isEmpty = data.daily.length === 0;

  const filteredRows = useMemo(
    () => data.rows.filter((r) => selected.includes(r.touchpointId)),
    [data.rows, selected],
  );

  const exportCsv = () => {
    const headers = [
      "Touchpoint",
      "Widget",
      "Strategy",
      "Impressions",
      "CTR",
      "Orders",
      "Revenue",
      "Delta",
    ];
    const lines = filteredRows.map((r) => {
      const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
      const strategy = store.strategies.find((s) => s.id === r.strategyId)?.name ?? "—";
      return [
        touchpointLabel(r.touchpointId),
        r.widget,
        strategy,
        r.impressions,
        (ctr * 100).toFixed(2) + "%",
        r.orders,
        r.revenue,
        (r.delta * 100).toFixed(1) + "%",
      ].join(",");
    });
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-agent-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-[12px] text-neutral-500">Time range</label>
          <SASelect
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </SASelect>
        </div>
        <TouchpointFilter selected={selected} onChange={setSelected} />
        <div className="ml-auto">
          <SAButton variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="w-3 h-3" />
            Export CSV
          </SAButton>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Attributed Revenue"
          value={isEmpty ? "—" : formatCurrency(data.revenue)}
          delta={data.deltaRevenue}
          hint="Revenue from orders containing a Sales Agent recommendation (Own products)."
        />
        <KpiCard
          label="Orders Influenced"
          value={isEmpty ? "—" : data.orders.toLocaleString()}
          delta={data.deltaOrders}
          hint="Orders within the 7-day attribution window that include a recommended product."
        />
        <KpiCard
          label="CTR"
          value={
            isEmpty
              ? "—"
              : formatPct(
                  data.impressions > 0 ? data.clicks / data.impressions : 0,
                )
          }
          delta={data.deltaCtr}
          hint="Clicks divided by impressions across all Sales Agent touchpoints."
        />
        <KpiCard
          label="AOV of Influenced Orders"
          value={isEmpty ? "—" : formatCurrency(data.aov)}
          delta={data.deltaAov}
          hint="Average order value for orders attributed to Sales Agent."
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <Panel className="p-4">
          <p className="text-[13px] font-medium text-neutral-900">
            Revenue trend
          </p>
          <p className="text-[11px] text-neutral-500 mb-2">
            Attributed revenue by day
          </p>
          <div className="h-[220px]">
            {isEmpty ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.daily.map((d) => ({
                    date: d.date.slice(5),
                    revenue: d.revenue,
                  }))}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#737373" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e5e5" }}
                    interval={Math.ceil(data.daily.length / 8)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#737373" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "none",
                      borderRadius: 4,
                      color: "#fff",
                      fontSize: 12,
                      padding: "6px 8px",
                    }}
                    labelStyle={{ color: "#a3a3a3" }}
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#171717"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: "#171717" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="text-[13px] font-medium text-neutral-900">
            Revenue by touchpoint
          </p>
          <p className="text-[11px] text-neutral-500 mb-3">
            Share of attributed revenue
          </p>
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <TouchpointBars data={data.byTouchpoint} total={data.revenue} />
          )}
        </Panel>
      </div>

      {/* Detail table */}
      <Panel className="overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <p className="text-[13px] font-semibold text-neutral-900">
            Touchpoint × Widget × Strategy
          </p>
          <p className="text-[11px] text-neutral-500">
            Detailed breakdown of the selected time range.
          </p>
        </div>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_90px_80px_80px_100px_70px] px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em]">
          <div>Touchpoint</div>
          <div>Widget</div>
          <div>Strategy</div>
          <div className="text-right">Impr.</div>
          <div className="text-right">CTR</div>
          <div className="text-right">Orders</div>
          <div className="text-right">Revenue</div>
          <div className="text-right">Δ</div>
        </div>
        {filteredRows.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-neutral-500">
            No data yet
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredRows.map((r) => {
              const ctr = r.impressions > 0 ? r.clicks / r.impressions : 0;
              const strategy = store.strategies.find(
                (s) => s.id === r.strategyId,
              );
              return (
                <div
                  key={`${r.touchpointId}-${r.widget}`}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_90px_80px_80px_100px_70px] items-center px-4 py-2.5 text-[13px] text-neutral-900 hover:bg-neutral-50"
                >
                  <div className="truncate">
                    {touchpointLabel(r.touchpointId)}
                  </div>
                  <div className="truncate text-neutral-500 font-mono text-[12px]">
                    {r.widget}
                  </div>
                  <div className="truncate text-neutral-700">
                    {strategy?.name ?? (
                      <span className="text-neutral-400">—</span>
                    )}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.impressions.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {formatPct(ctr)}
                  </div>
                  <div className="text-right tabular-nums">
                    {r.orders.toLocaleString()}
                  </div>
                  <div className="text-right tabular-nums">
                    {formatCurrency(r.revenue)}
                  </div>
                  <div className="text-right tabular-nums">
                    <DeltaText value={r.delta} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <MetricDefinitions />

      {isEmpty && (
        <Callout tone="info">
          No traffic has been attributed in this window yet. KPI values and
          charts will populate once the Sales Agent serves live recommendations.
        </Callout>
      )}
    </div>
  );
}

/* ── Touchpoint filter (popover) ───────────────────────── */
function TouchpointFilter({
  selected,
  onChange,
}: {
  selected: TouchpointId[];
  onChange: (ids: TouchpointId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allIds = TOUCHPOINTS.map((t) => t.id);
  const label =
    selected.length === allIds.length
      ? "All touchpoints"
      : selected.length === 0
        ? "None"
        : `${selected.length} touchpoints`;

  return (
    <div className="relative">
      <SAButton
        variant="secondary"
        size="md"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </SAButton>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 left-0 w-[240px] bg-white border border-neutral-200 rounded-[4px] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-600 hover:bg-neutral-50"
              onClick={() =>
                onChange(selected.length === allIds.length ? [] : allIds)
              }
            >
              {selected.length === allIds.length ? "Clear all" : "Select all"}
            </button>
            <div className="border-t border-neutral-100" />
            {TOUCHPOINTS.map((t) => {
              const checked = selected.includes(t.id);
              return (
                <label
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-neutral-50 text-[13px]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      if (checked) onChange(selected.filter((x) => x !== t.id));
                      else onChange([...selected, t.id]);
                    }}
                    className="h-3.5 w-3.5 accent-neutral-900"
                  />
                  {t.label}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── KPI card ───────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string;
  value: string;
  delta: number | null;
  hint: string;
}) {
  return (
    <Panel className="p-3.5">
      <p className="text-[12px] text-neutral-500">{label}</p>
      <p className="text-[22px] font-semibold text-neutral-900 tabular-nums leading-tight mt-1">
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <DeltaText value={delta} />
        <span className="text-[11px] text-neutral-400">vs previous period</span>
      </div>
      <p className="text-[11px] text-neutral-500 mt-2 leading-snug">{hint}</p>
    </Panel>
  );
}

/* ── Delta text ─────────────────────────────────────────── */
function DeltaText({ value }: { value: number | null }) {
  if (value === null || value === undefined)
    return <span className="text-[12px] text-neutral-400">—</span>;
  const pct = (value * 100).toFixed(1);
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span
      className={cn(
        "text-[12px] font-medium tabular-nums",
        zero && "text-neutral-400",
        !zero && positive && "text-emerald-700",
        !zero && !positive && "text-red-700",
      )}
    >
      {positive && "+"}
      {pct}%
    </span>
  );
}

/* ── Revenue-by-touchpoint horizontal bar ──────────────── */
function TouchpointBars({
  data,
  total,
}: {
  data: { touchpointId: TouchpointId; revenue: number }[];
  total: number;
}) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  return (
    <div className="space-y-2">
      {sorted.map((d) => {
        const pct = total > 0 ? (d.revenue / total) * 100 : 0;
        return (
          <div key={d.touchpointId}>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-0.5">
              <span className="text-neutral-700 text-[12px]">
                {touchpointLabel(d.touchpointId)}
              </span>
              <span className="tabular-nums">
                {formatCurrency(d.revenue)}
              </span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-800 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Empty chart ───────────────────────────────────────── */
function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-[12px] text-neutral-400">No data yet</p>
    </div>
  );
}

/* ── Metric definitions (collapsible) ──────────────────── */
function MetricDefinitions() {
  const [open, setOpen] = useState(false);
  const defs = [
    {
      name: "Attributed Revenue",
      def: "Total revenue from orders that include a product surfaced by Sales Agent, Own products only.",
      calc: "Sum of order totals where ≥1 line item was clicked from a Sales Agent surface within the attribution window.",
    },
    {
      name: "Orders Influenced",
      def: "Count of distinct orders that include a Sales Agent recommendation.",
      calc: "Distinct order_id count, 7-day click-to-purchase attribution window.",
    },
    {
      name: "CTR",
      def: "Fraction of recommendation impressions that received a click.",
      calc: "Clicks / Impressions, across all selected touchpoints.",
    },
    {
      name: "AOV of Influenced Orders",
      def: "Average basket size of orders attributed to Sales Agent.",
      calc: "Attributed Revenue / Orders Influenced.",
    },
  ];
  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="text-left">
          <p className="text-[13px] font-medium text-neutral-900">
            Metric definitions
          </p>
          <p className="text-[11px] text-neutral-500">
            How each KPI is calculated.
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-500" />
        )}
      </button>
      {open && (
        <div className="border-t border-neutral-100 divide-y divide-neutral-100">
          {defs.map((d) => (
            <div key={d.name} className="px-4 py-3">
              <p className="text-[13px] font-medium text-neutral-900">
                {d.name}
              </p>
              <p className="text-[12px] text-neutral-700 mt-0.5">{d.def}</p>
              <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                {d.calc}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ── formatting helpers ────────────────────────────────── */
function formatCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
