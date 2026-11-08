import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* AgentStation shared UI primitives                                   */
/* One source of truth for buttons, cards, badges, empty states,       */
/* skeletons, tooltips, progress rings and stat tiles.                 */
/* ------------------------------------------------------------------ */

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'ghost' | 'subtle';

const TONE_CLASSES: Record<Tone, string> = {
  default: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70',
  primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 border border-blue-500/40',
  success: 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/40',
  warning: 'bg-amber-600/90 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 border border-amber-500/40',
  danger: 'bg-red-600/90 hover:bg-red-500 text-white shadow-md shadow-red-600/20 border border-red-500/40',
  ghost: 'bg-transparent hover:bg-slate-800/70 text-slate-300 border border-transparent',
  subtle: 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border border-slate-800',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  tone = 'default',
  size = 'sm',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-1 text-[11px] rounded-md gap-1'
      : size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-lg gap-1.5'
      : size === 'lg'
      ? 'px-5 py-3 text-sm rounded-xl gap-2'
      : 'px-4 py-2 text-sm rounded-lg gap-2';
  return (
    <button
      className={`as-focus-ring inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${TONE_CLASSES[tone]} ${sizeClasses} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ padded = true, interactive = false, className = '', children, ...rest }) => (
  <div
    className={`as-card rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-sm ${
      interactive ? 'as-card-interactive cursor-pointer' : ''
    } ${padded ? 'p-4' : ''} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

type BadgeTone = 'neutral' | 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'cyan';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/70',
  blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  red: 'bg-red-500/10 text-red-300 border-red-500/30',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
};

export const Badge: React.FC<{ tone?: BadgeTone; className?: string; children: React.ReactNode }> = ({
  tone = 'neutral',
  className = '',
  children,
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${BADGE_TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}> = ({ icon, title, description, action, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
    <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400 mb-3">
      {icon}
    </div>
    <p className="text-sm font-semibold text-slate-200">{title}</p>
    {description && <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`as-skeleton rounded-md ${className}`} aria-hidden="true" />
);

export const ProgressBar: React.FC<{ value: number; tone?: 'blue' | 'emerald' | 'amber' | 'red'; className?: string }> = ({
  value,
  tone = 'blue',
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const bar =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'amber'
      ? 'bg-amber-500'
      : tone === 'red'
      ? 'bg-red-500'
      : 'bg-blue-500';
  return (
    <div className={`h-1.5 w-full rounded-full bg-slate-800 overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${bar} transition-all duration-500 ease-out`} style={{ width: `${clamped}%` }} />
    </div>
  );
};

export const ProgressRing: React.FC<{ value: number; size?: number; stroke?: number; tone?: 'blue' | 'emerald' | 'amber' | 'red'; label?: string }> = ({
  value,
  size = 44,
  stroke = 4,
  tone = 'blue',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color =
    tone === 'emerald' ? '#10b981' : tone === 'amber' ? '#f59e0b' : tone === 'red' ? '#ef4444' : '#3b82f6';
  return (
    <div className="relative inline-flex items-center justify-center" role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-bold text-slate-200">{label ?? `${Math.round(clamped)}%`}</span>
    </div>
  );
};

export const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'cyan';
  onClick?: () => void;
}> = ({ icon, label, value, hint, tone = 'blue', onClick }) => {
  const iconTones: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  };
  const tileContent = (
    <>
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconTones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-lg font-bold tracking-tight text-slate-100 leading-tight">{value}</div>
        <div className="text-[11px] font-medium text-slate-400 truncate">{label}</div>
        {hint && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{hint}</div>}
      </div>
    </>
  );
  const tileClass = "as-card w-full text-left rounded-xl border border-slate-800/90 bg-slate-900/60 p-3.5 flex items-start gap-3";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${tileClass} as-card-interactive`}>
      {tileContent}
    </button>
  ) : (
    <div className={tileClass}>{tileContent}</div>
  );
};

/* ------------------------------------------------------------------ */
/* Tooltip (CSS-driven, hover/focus accessible)                        */
/* ------------------------------------------------------------------ */
export const Tooltip: React.FC<{ label: string; children: React.ReactNode; side?: 'top' | 'bottom' }> = ({
  label,
  children,
  side = 'top',
}) => (
  <span className="as-tooltip-wrap relative inline-flex" tabIndex={0} aria-label={label}>
    {children}
    <span
      role="tooltip"
      className={`as-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-200 shadow-lg opacity-0 transition-opacity duration-150 ${
        side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      }`}
    >
      {label}
    </span>
  </span>
);

/* ------------------------------------------------------------------ */
/* Modal shell with escape-to-close, backdrop click, focus trap        */
/* ------------------------------------------------------------------ */
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, subtitle, icon, children, footer, maxWidth = 'max-w-2xl' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const items = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || []
        ).filter((item) => item.offsetParent !== null);
        if (items.length === 0) {
          e.preventDefault();
          panelRef.current?.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`as-modal relative w-full ${maxWidth} max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-200`}
      >
        {(title || icon) && (
          <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3 min-w-0">
              {icon && <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-300 shrink-0">{icon}</div>}
              <div className="min-w-0">
                {title && <h2 className="text-base font-bold text-white tracking-tight truncate">{title}</h2>}
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2 shrink-0 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* useDebouncedValue — small hook for search inputs                    */
/* ------------------------------------------------------------------ */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/* ------------------------------------------------------------------ */
/* useLocalStorage — safe persisted state                              */
/* ------------------------------------------------------------------ */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, [key]);
  return [value, set];
}

/* ------------------------------------------------------------------ */
/* Form primitives — labels, inputs, segmented controls, switches,     */
/* chips. Shared so every form in the app looks and behaves the same.  */
/* ------------------------------------------------------------------ */

export const Field: React.FC<{
  label: string;
  htmlFor?: string;
  hint?: string;
  tooltip?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, hint, tooltip, error, required, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-200">
        {label}
        {required && <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {tooltip && (
        <Tooltip label={tooltip}>
          <span
            role="img"
            aria-label={tooltip}
            className="w-3.5 h-3.5 rounded-full border border-slate-600 text-slate-400 text-[9px] font-bold flex items-center justify-center cursor-help"
          >
            ?
          </span>
        </Tooltip>
      )}
    </div>
    {children}
    {error ? (
      <p className="text-[11px] text-red-400 flex items-center gap-1" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>
    ) : null}
  </div>
);

const INPUT_BASE =
  'w-full rounded-lg bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40';

export const TextInput: React.FC<
  React.ComponentPropsWithRef<'input'> & { invalid?: boolean }
> = ({ invalid = false, className = '', ...rest }) => (
  <input
    className={`${INPUT_BASE} ${invalid ? 'border-red-500/70' : 'border-slate-800 focus:border-blue-500'} ${className}`}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);

export const TextArea: React.FC<
  React.ComponentPropsWithRef<'textarea'> & { invalid?: boolean }
> = ({ invalid = false, className = '', ...rest }) => (
  <textarea
    className={`${INPUT_BASE} resize-none leading-relaxed ${invalid ? 'border-red-500/70' : 'border-slate-800 focus:border-blue-500'} ${className}`}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);

export const Segmented: React.FC<{
  options: { value: string; label: string; help?: string }[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  columns?: number;
}> = ({ options, value, onChange, ariaLabel, columns }) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    className={`grid gap-1.5 ${columns ? '' : 'sm:grid-cols-2'}`}
    style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(opt.value)}
          className={`as-focus-ring text-left rounded-lg border px-3 py-2 transition ${
            active
              ? 'border-blue-500/60 bg-blue-500/10 text-white'
              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
          }`}
        >
          <span className="block text-xs font-semibold">{opt.label}</span>
          {opt.help && <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.help}</span>}
        </button>
      );
    })}
  </div>
);

export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help?: string;
  id?: string;
}> = ({ checked, onChange, label, help, id }) => (
  <button
    type="button"
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="as-focus-ring w-full flex items-start gap-3 text-left rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5 hover:border-slate-700 transition"
  >
    <span
      className={`mt-0.5 relative w-8 h-4.5 rounded-full transition shrink-0 ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
      style={{ height: '1.125rem' }}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`}
      />
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-semibold text-slate-200">{label}</span>
      {help && <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{help}</span>}
    </span>
  </button>
);

export const Chip: React.FC<{
  label: string;
  selected?: boolean;
  onClick?: () => void;
  help?: string;
}> = ({ label, selected = false, onClick, help }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    title={help}
    className={`as-focus-ring inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
      selected
        ? 'border-blue-500/60 bg-blue-500/15 text-blue-200'
        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
    }`}
  >
    {selected && <Check className="w-3 h-3" />}
    {label}
  </button>
);

export const Disclosure: React.FC<{
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, description, open, onToggle, children }) => (
  <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="as-focus-ring w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-slate-900/60 transition"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-200">{title}</span>
        {description && <span className="block text-[10px] text-slate-500 mt-0.5">{description}</span>}
      </span>
      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-3.5 pb-3.5 pt-1 space-y-3.5 border-t border-slate-800/70 as-enter-fast">{children}</div>}
  </div>
);
