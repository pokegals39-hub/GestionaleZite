import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore, useLookup, Abbonamento, Piano } from '../lib/store';
import { PageHeader, DataTable, Modal, Confirm, Field, Badge, RowActions, Col } from '../components/ui';
import { fmtDate, fmtEur, subStatus, uid, todayISO, addMonths } from '../lib/utils';

function PianoForm({ initial, onDone }: { initial: Piano; onDone: () => void }) {
  const { upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.nome.trim() || v.durataMesi < 1 || v.prezzo < 0) { setErr('Compila nome, durata (≥1) e prezzo'); return; }
    upsert('piani', { ...v, id: v.id || uid() }); toast.success('Piano salvato'); onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome piano *"><input className="input" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Durata (mesi) *"><input className="input" type="number" min={1} value={v.durataMesi} onChange={(e) => setV({ ...v, durataMesi: +e.target.value })} /></Field>
        <Field label="Prezzo (€) *"><input className="input" type="number" min={0} step="0.01" value={v.prezzo} onChange={(e) => setV({ ...v, prezzo: +e.target.value })} /></Field>
      </div>
      <Field label="Descrizione"><input className="input" value={v.descrizione} onChange={(e) => setV({ ...v, descrizione: e.target.value })} /></Field>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

function AbbForm({ initial, onDone }: { initial: Abbonamento; onDone: () => void }) {
  const { data, upsert } = useStore();
  const { piano } = useLookup();
  const [v, setV] = useState(initial);
  const [pagato, setPagato] = useState(!initial.id);
  const [metodo, setMetodo] = useState<'Carta' | 'Contanti' | 'Bonifico' | 'Satispay'>('Carta');
  const [err, setErr] = useState('');
  const setPiano = (pianoId: string) => setV({ ...v, pianoId, fine: addMonths(v.inizio, piano(pianoId)?.durataMesi ?? 1) });
  const setInizio = (inizio: string) => setV({ ...v, inizio, fine: addMonths(inizio, piano(v.pianoId)?.durataMesi ?? 1) });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.iscrittoId || !v.pianoId || !v.inizio || !v.fine) { setErr('Seleziona iscritto, piano e date'); return; }
    if (v.fine < v.inizio) { setErr('La data di fine deve essere successiva all’inizio'); return; }
    upsert('abbonamenti', { ...v, id: v.id || uid() });
    const p = piano(v.pianoId);
    if (pagato && p) upsert('pagamenti', { id: uid(), iscrittoId: v.iscrittoId, importo: p.prezzo, data: todayISO(), metodo, descrizione: `Abbonamento ${p.nome}`, stato: 'Pagato' });
    toast.success('Abbonamento salvato'); onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Iscritto *"><select className="input" value={v.iscrittoId} onChange={(e) => setV({ ...v, iscrittoId: e.target.value })}>
        <option value="">Seleziona…</option>{[...data.iscritti].sort((a, b) => a.cognome.localeCompare(b.cognome)).map((m) => <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>)}
      </select></Field>
      <Field label="Piano *"><select className="input" value={v.pianoId} onChange={(e) => setPiano(e.target.value)}>
        <option value="">Seleziona…</option>{data.piani.map((p) => <option key={p.id} value={p.id}>{p.nome} — {fmtEur(p.prezzo)}</option>)}
      </select></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Inizio *"><input className="input" type="date" value={v.inizio} onChange={(e) => setInizio(e.target.value)} /></Field>
        <Field label="Fine *"><input className="input" type="date" value={v.fine} onChange={(e) => setV({ ...v, fine: e.target.value })} /></Field>
      </div>
      <div className="rounded-lg border p-3 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="accent-[hsl(var(--primary))] h-4 w-4" checked={pagato} onChange={(e) => setPagato(e.target.checked)} />Registra anche il pagamento</label>
        {pagato && <select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)}>{['Carta', 'Contanti', 'Bonifico', 'Satispay'].map((m) => <option key={m}>{m}</option>)}</select>}
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

export default function Abbonamenti() {
  const { data, remove } = useStore();
  const { nomeIscritto, piano } = useLookup();
  const [pEdit, setPEdit] = useState<Piano | null>(null);
  const [pDel, setPDel] = useState<Piano | null>(null);
  const [aEdit, setAEdit] = useState<Abbonamento | null>(null);
  const [aDel, setADel] = useState<Abbonamento | null>(null);
  const [filtro, setFiltro] = useState('Tutti');
  const rows = data.abbonamenti.filter((a) => filtro === 'Tutti' || subStatus(a.fine) === filtro);

  const cols: Col<Abbonamento>[] = [
    { key: 'isc', label: 'Iscritto', sort: (a) => nomeIscritto(a.iscrittoId), render: (a) => <span className="font-semibold">{nomeIscritto(a.iscrittoId)}</span> },
    { key: 'piano', label: 'Piano', sort: (a) => piano(a.pianoId)?.nome ?? '', render: (a) => piano(a.pianoId)?.nome ?? '—' },
    { key: 'inizio', label: 'Inizio', sort: (a) => a.inizio, render: (a) => fmtDate(a.inizio), className: 'hidden md:table-cell' },
    { key: 'fine', label: 'Fine', sort: (a) => a.fine, render: (a) => fmtDate(a.fine) },
    { key: 'stato', label: 'Stato', sort: (a) => subStatus(a.fine), render: (a) => <Badge>{subStatus(a.fine)}</Badge> },
    { key: 'az', label: '', render: (a) => <RowActions onEdit={() => setAEdit(a)} onDelete={() => setADel(a)} /> },
  ];

  return (
    <>
      <PageHeader title="Abbonamenti" subtitle="Piani tariffari e abbonamenti dei soci"
        action={<button className="btn-primary" onClick={() => setAEdit({ id: '', iscrittoId: '', pianoId: '', inizio: todayISO(), fine: addMonths(todayISO(), 1) })}><Plus size={16} />Nuovo abbonamento</button>} />
      <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-lg">Piani tariffari</h2>
        <button className="btn-outline h-9" onClick={() => setPEdit({ id: '', nome: '', durataMesi: 1, prezzo: 0, descrizione: '' })}><Plus size={14} />Piano</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {data.piani.map((p) => (
          <div key={p.id} className="card p-5 group">
            <div className="flex justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{p.durataMesi} {p.durataMesi === 1 ? 'mese' : 'mesi'}</p>
              <div className="flex opacity-60 group-hover:opacity-100"><button className="btn-icon" onClick={() => setPEdit(p)} aria-label="Modifica"><Pencil size={14} /></button><button className="btn-icon" onClick={() => setPDel(p)} aria-label="Elimina"><Trash2 size={14} /></button></div></div>
            <p className="font-bold text-lg mt-1">{p.nome}</p>
            <p className="text-3xl font-extrabold mt-2">{fmtEur(p.prezzo)}</p>
            <p className="text-sm text-muted-foreground mt-2">{p.descrizione}</p>
            <p className="text-xs text-muted-foreground mt-3">{data.abbonamenti.filter((a) => a.pianoId === p.id && subStatus(a.fine) !== 'Scaduto').length} abbonamenti attivi</p>
          </div>
        ))}
      </div>
      <DataTable rows={rows} cols={cols} placeholder="Cerca per iscritto o piano…" searchText={(a) => `${nomeIscritto(a.iscrittoId)} ${piano(a.pianoId)?.nome}`} defaultSort={{ key: 'fine', dir: 1 }}
        toolbar={<select className="input sm:w-44" value={filtro} onChange={(e) => setFiltro(e.target.value)}>{['Tutti', 'Attivo', 'In scadenza', 'Scaduto'].map((s) => <option key={s}>{s}</option>)}</select>} />
      <Modal open={!!pEdit} onClose={() => setPEdit(null)} title={pEdit?.id ? 'Modifica piano' : 'Nuovo piano'}>{pEdit && <PianoForm initial={pEdit} onDone={() => setPEdit(null)} />}</Modal>
      <Modal open={!!aEdit} onClose={() => setAEdit(null)} title={aEdit?.id ? 'Modifica abbonamento' : 'Nuovo abbonamento'}>{aEdit && <AbbForm initial={aEdit} onDone={() => setAEdit(null)} />}</Modal>
      <Confirm open={!!pDel} onClose={() => setPDel(null)} text={`Eliminare il piano "${pDel?.nome}"?`} onConfirm={() => { remove('piani', pDel!.id); toast.success('Piano eliminato'); }} />
      <Confirm open={!!aDel} onClose={() => setADel(null)} text="Eliminare questo abbonamento?" onConfirm={() => { remove('abbonamenti', aDel!.id); toast.success('Abbonamento eliminato'); }} />
    </>
  );
}
