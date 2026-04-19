import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSalesAgent } from "@/lib/sales-agent/store";
import { Panel, SAButton } from "./primitives";
import ExclusionRules from "./ExclusionRules";
import StrategyModal from "./StrategyModal";
import {
  STRATEGY_TYPE_LABEL,
  touchpointLabel,
} from "@/lib/sales-agent/constants";
import type { Strategy } from "@/lib/sales-agent/types";

export default function StrategiesTab() {
  const store = useSalesAgent();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  return (
    <div className="max-w-[1040px] mx-auto px-6 py-6 space-y-5">
      <ExclusionRules />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-neutral-900">
              Strategies
            </h2>
            <p className="text-[12px] text-neutral-500">
              Reusable recipes referenced by touchpoints.
            </p>
          </div>
          <SAButton variant="primary" onClick={openNew}>
            <Plus className="w-3.5 h-3.5" />
            New strategy
          </SAButton>
        </div>

        <StrategyTable onEdit={openEdit} />
      </section>

      <StrategyModal
        open={modalOpen}
        editingId={editingId}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

/* ── Strategy table ─────────────────────────────────────── */
function StrategyTable({ onEdit }: { onEdit: (id: string) => void }) {
  const store = useSalesAgent();

  const rows = useMemo(() => {
    return store.strategies.map((s) => {
      const refs = store.isStrategyReferenced(s.id);
      return { s, refs };
    });
  }, [store.strategies, store.touchpoints, store.thankYouWidgets]);

  if (rows.length === 0) {
    return (
      <Panel className="p-6 text-center">
        <p className="text-[13px] text-neutral-700 font-medium">
          No strategies yet
        </p>
        <p className="text-[12px] text-neutral-500 mt-1">
          Create a strategy to power a touchpoint.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1.4fr)_120px_80px] items-center px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-[11px] font-medium text-neutral-500 uppercase tracking-[0.06em]">
        <div>Name</div>
        <div>Type</div>
        <div>Used by</div>
        <div>Updated</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-neutral-100">
        {rows.map(({ s, refs }) => (
          <StrategyRow key={s.id} strategy={s} refs={refs} onEdit={onEdit} />
        ))}
      </div>
    </Panel>
  );
}

function StrategyRow({
  strategy,
  refs,
  onEdit,
}: {
  strategy: Strategy;
  refs: string[];
  onEdit: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1.4fr)_120px_80px] items-center px-4 py-3 text-[13px] text-neutral-900 hover:bg-neutral-50">
      <div className="min-w-0">
        <p className="font-medium truncate">{strategy.name}</p>
        <p className="text-[11px] text-neutral-500 truncate">
          {strategyDetail(strategy)}
        </p>
      </div>
      <div className="text-neutral-500">
        {STRATEGY_TYPE_LABEL[strategy.type]}
      </div>
      <div className="min-w-0">
        {refs.length === 0 ? (
          <span className="text-[12px] text-neutral-400">Unused</span>
        ) : (
          <span className="text-[12px] text-neutral-700 truncate block">
            {refs.map((r) => touchpointLabel(r as never)).join(", ")}
          </span>
        )}
      </div>
      <div className="text-[12px] text-neutral-500 tabular-nums">
        {formatDate(strategy.updatedAt)}
      </div>
      <div className="text-right">
        <SAButton variant="ghost" size="sm" onClick={() => onEdit(strategy.id)}>
          Edit
        </SAButton>
      </div>
    </div>
  );
}

function strategyDetail(s: Strategy): string {
  if (s.type === "best_sellers") return `Top performers from last ${s.timeWindow}d`;
  if (s.type === "new_arrivals") return `New in last ${s.timeWindow}d`;
  if (s.type === "similar") return `Similar to shopper's latest purchase`;
  if (s.mode === "products") return `${s.productIds.length} hand-picked products`;
  return `Sourced from a collection`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}
