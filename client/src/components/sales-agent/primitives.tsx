/* Sales Agent UI primitives.
 * Aligned with Merchant Dashboard visual language:
 * indigo primary (#4F46E5, via --primary token), 8px card radius,
 * 6px button radius, 1px borders, generous card padding.
 */

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  forwardRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Surface ───────────────────────────────────────────────
   Plain white panel, 1px border, 8px radius. Flat — no shadow. */
export const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Panel({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-neutral-200 rounded-lg",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ── Button ───────────────────────────────────────────────
   Primary = indigo (matches MD). Radius 6px. */
interface SABtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export const SAButton = forwardRef<HTMLButtonElement, SABtnProps>(
  function SAButton(
    { className, variant = "secondary", size = "md", ...props },
    ref,
  ) {
    const base =
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-40 tabular-nums";
    const sizes = {
      sm: "h-7 px-2.5 text-[12px]",
      md: "h-8 px-3.5 text-[13px]",
    };
    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
      secondary:
        "bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100",
      ghost:
        "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
      danger:
        "bg-white text-red-700 border border-red-200 hover:bg-red-50 active:bg-red-100",
    };
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    );
  },
);

/* ── Input ──────────────────────────────────────────────── */
export const SAInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function SAInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-neutral-50 disabled:text-neutral-400",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ── Select (native) ─────────────────────────────────────── */
export const SASelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SASelect({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-8 rounded-md border border-neutral-300 bg-white pl-2.5 pr-7 text-[13px] text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-neutral-50 disabled:text-neutral-400 appearance-none",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23525252%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat",
          "bg-[position:right_0.5rem_center]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

/* ── Toggle (switch) ─────────────────────────────────────── */
interface SAToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}
export function SAToggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: SAToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-primary" : "bg-neutral-300",
      )}
    >
      <span
        className={cn(
          "inline-block h-[14px] w-[14px] transform rounded-full bg-white transition-transform",
          checked ? "translate-x-[14px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

/* ── Chip ───────────────────────────────────────────────── */
interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}
export function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-md bg-neutral-100 text-neutral-800 text-[12px]",
        !onRemove && "pr-2",
        className,
      )}
    >
      <span className="truncate max-w-[220px]">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/* ── Status dot ─────────────────────────────────────────── */
export function StatusDot({ kind }: { kind: "on" | "off" | "warn" }) {
  const map: Record<string, string> = {
    on: "bg-emerald-500",
    off: "bg-neutral-300",
    warn: "bg-amber-500",
  };
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", map[kind])} />;
}

/* ── Callout (info / warn) ─────────────────────────────── */
interface CalloutProps {
  tone: "info" | "warn" | "danger";
  title?: string;
  children?: ReactNode;
  className?: string;
}
export function Callout({ tone, title, children, className }: CalloutProps) {
  const styles: Record<string, string> = {
    info: "bg-primary/5 border-primary/15 text-neutral-800",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-red-50 border-red-200 text-red-900",
  };
  return (
    <div
      className={cn(
        "text-[12px] leading-relaxed px-3 py-2 rounded-md border",
        styles[tone],
        className,
      )}
    >
      {title && <p className="font-medium mb-0.5">{title}</p>}
      {children && <div className="text-[12px]">{children}</div>}
    </div>
  );
}

/* ── InfoTip (hover ? icon → tooltip) ──────────────────── */
interface InfoTipProps {
  children: ReactNode;
  size?: number;
  className?: string;
}
export function InfoTip({ children, size = 12, className }: InfoTipProps) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors align-middle",
            className,
          )}
          aria-label="More info"
        >
          <HelpCircle style={{ width: size, height: size }} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[260px] bg-neutral-900 text-white text-[11px] leading-snug px-2.5 py-1.5 rounded-md"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string; // tailwind width class
}
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-[560px]",
}: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-[calc(100%-32px)] bg-white rounded-lg shadow-[0_10px_32px_-12px_rgba(0,0,0,0.25)] border border-neutral-200 flex flex-col max-h-[calc(100vh-64px)]",
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200 bg-neutral-50/50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Drawer (right-side) ────────────────────────────────── */
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = "w-[480px]",
}: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 bg-white border-l border-neutral-200 shadow-[0_0_32px_-8px_rgba(0,0,0,0.18)] flex flex-col",
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200">
          <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-200 bg-neutral-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────── */
interface FieldProps {
  label: string;
  htmlFor?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}
export function Field({ label, htmlFor, help, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] font-medium text-neutral-800"
      >
        {label}
      </label>
      {children}
      {help && <p className="text-[11px] text-neutral-500 leading-snug">{help}</p>}
    </div>
  );
}

/* ── Segmented control ──────────────────────────────────── */
interface SegmentProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  size?: "sm" | "md";
}
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: SegmentProps<T>) {
  const h = size === "sm" ? "h-7" : "h-8";
  const text = size === "sm" ? "text-[12px]" : "text-[13px]";
  return (
    <div
      className={cn(
        "inline-flex rounded-md bg-neutral-100 p-0.5",
        h,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 rounded-sm font-medium transition-colors",
              text,
              active
                ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Accordion ─────────────────────────────────────────── */
interface AccordionProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}
export function Accordion({
  title,
  subtitle,
  right,
  defaultOpen = true,
  children,
  className,
}: AccordionProps) {
  return (
    <Panel className={cn("overflow-hidden", className)}>
      <AccordionInner
        title={title}
        subtitle={subtitle}
        right={right}
        defaultOpen={defaultOpen}
      >
        {children}
      </AccordionInner>
    </Panel>
  );
}

function AccordionInner({
  title,
  subtitle,
  right,
  defaultOpen,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v: boolean) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-neutral-900">{title}</p>
          {subtitle && (
            <p className="text-[12px] text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
              "text-neutral-500 transition-transform",
              open ? "rotate-180" : "",
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>
      {open && <div className="border-t border-neutral-100">{children}</div>}
    </>
  );
}
