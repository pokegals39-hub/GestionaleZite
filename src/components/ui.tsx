import { ReactNode, useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            className={cn('relative card w-full max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">{title}</h2>
              <button className="btn-icon" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Confirm({ open, onClose, onConfirm, text }: { open: boolean; onClose: () => void; onConfirm: () => void; text: string }) {
  return (
    <Modal open={open} onClose={onClose} title="Conferma eliminazione">
      <p className="text-muted-foreground">{text}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-outline" onClick={onClose}>Annulla</button>
        <button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>Elimina</button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive mt-1">{error}</span>}
    </label>
  );
}

const tones: Record<string, string> = {
  Attivo: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-600/20',
  Disponibile: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  'In manutenzione': 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300',
  Chiusa: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300',
  Pagato: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-600/20',
  Valido: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-600/20',
  'In scadenza': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-600/20',
  'In attesa': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-600/20',
  Scaduto: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 ring-red-600/20',
  Nessuno: 'bg-muted text-muted-foreground ring-border',
};
export function Badge({ children }: { children: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', tones[children] ?? tones.Nessuno)}>{children}</span>;
}

export function Avatar({ text }: { text: string }) {
  return <div className="h-9 w-9 shrink-0 rounded-full bg-accent text-accent-foreground grid place-items-center text-xs font-bold">{text}</div>;
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="py-14 text-center text-muted-foreground">
      <Inbox className="mx-auto mb-3 opacity-40" size={36} />
      <p>{text}</p>
    </div>
  );
}

export type Col<T> = { key: string; label: string; sort?: (r: T) => string | number; render: (r: T) => ReactNode; className?: string };

export function DataTable<T extends { id: string }>({ rows, cols, searchText, placeholder, toolbar, onRowClick, pageSize = 10, defaultSort }: {
  rows: T[]; cols: Col<T>[]; searchText: (r: T) => string; placeholder?: string; toolbar?: ReactNode;
  onRowClick?: (r: T) => void; pageSize?: number; defaultSort?: { key: string; dir: 1 | -1 };
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(defaultSort ?? { key: '', dir: 1 as 1 | -1 });
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = s ? rows.filter((x) => searchText(x).toLowerCase().includes(s)) : rows;
    const col = cols.find((c) => c.key === sort.key);
    if (col?.sort) r = [...r].sort((a, b) => (col.sort!(a) > col.sort!(b) ? 1 : -1) * sort.dir);
    return r;
  }, [rows, q, sort, cols, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = filtered.slice(p * pageSize, (p + 1) * pageSize);

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input className="input pl-9" placeholder={placeholder ?? 'Cerca…'} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        {toolbar}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={cn('th', c.sort && 'cursor-pointer select-none hover:text-foreground', c.className)}
                  onClick={() => c.sort && setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : 1 }))}>
                  <span className="inline-flex items-center gap-1">{c.label}
                    {sort.key === c.key && (sort.dir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {view.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className={cn('transition-colors hover:bg-muted/40', onRowClick && 'cursor-pointer')}>
                {cols.map((c) => <td key={c.key} className={cn('td', c.className)}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && <Empty text="Nessun risultato trovato" />}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
        <span>{filtered.length} risultati</span>
        <div className="flex items-center gap-2">
          <button className="btn-icon" disabled={p === 0} onClick={() => setPage(p - 1)} aria-label="Pagina precedente"><ChevronLeft size={16} /></button>
          <span>Pagina {p + 1} di {pages}</span>
          <button className="btn-icon" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} aria-label="Pagina successiva"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, hint, accent }: { label: string; value: ReactNode; icon: ReactNode; hint?: string; accent?: boolean }) {
  return (
    <div className={cn('card p-5 relative overflow-hidden', accent && 'bg-secondary text-secondary-foreground border-secondary')}>
      <div className="flex items-start justify-between">
        <p className={cn('text-sm font-medium', accent ? 'opacity-70' : 'text-muted-foreground')}>{label}</p>
        <div className={cn('h-9 w-9 rounded-lg grid place-items-center', accent ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>{icon}</div>
      </div>
      <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
      {hint && <p className={cn('text-xs mt-1', accent ? 'opacity-60' : 'text-muted-foreground')}>{hint}</p>}
    </div>
  );
}

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button className="btn-ghost h-8 px-3 text-xs" onClick={onEdit}>Modifica</button>
      <button className="btn-ghost h-8 px-3 text-xs text-destructive" onClick={onDelete}>Elimina</button>
    </div>
  );
}
