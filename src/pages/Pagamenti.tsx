import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Wallet, Clock, TrendingUp } from 'lucide-react';
import { useStore, useLookup, Pagamento } from '../lib/store';
import { PageHeader, DataTable, Modal, Confirm, Field, Badge, RowActions, Col, StatCard } from '../components/ui';
import { fmtDate, fmtEur, uid, todayISO } from '../lib/utils';

const METODI: Pagamento['metodo'][] = ['Carta', 'Contanti', 'Bonifico', 'Satispay'];

function PagForm({ initial, onDone }: { initial: Pagamento; onDone: () => void }) {
  const { data, upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.iscrittoId || !(v.importo > 0) || !v.data) { setErr('Seleziona iscritto, importo maggiore di zero e data'); return; }
    upsert('pagamenti', { ...v, id: v.id || uid() }); toast.success('Pagamento salvato'); onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Iscritto *"><select className="input" value={v.iscrittoId} onChange={(e) => setV({ ...v, iscrittoId: e.target.value })}>
        <option value="">Seleziona…</option>{[...data.iscritti].sort((a, b) => a.cognome.localeCompare(b.cognome)).map((m) => <option key={m.id} value={m.id}>{m.cognome} {m.nome}</option>)}
      </select></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Importo (€) *"><input className="input" type="number" min={0} step="0.01" value={v.importo || ''} onChange={(e) => setV({ ...v, importo: +e.target.value })} /></Field>
        <Field label="Data *"><input className="input" type="date" value={v.data} onChange={(e) => setV({ ...v, data: e.target.value })} /></Field>
        <Field label="Metodo"><select className="input" value={v.metodo} onChange={(e) => setV({ ...v, metodo: e.target.value as Pagamento['metodo'] })}>{METODI.map((m) => <option key={m}>{m}</option>)}</select></Field>
        <Field label="Stato"><select className="input" value={v.stato} onChange={(e) => setV({ ...v, stato: e.target.value as Pagamento['stato'] })}><option>Pagato</option><option>In attesa</option></select></Field>
      </div>
      <Field label="Descrizione"><input className="input" value={v.descrizione} onChange={(e) => setV({ ...v, descrizione: e.target.value })} placeholder="Es. Abbonamento mensile" /></Field>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

export default function Pagamenti() {
  const { data, remove, upsert } = useStore();
  const { nomeIscritto } = useLookup();
  const [edit, setEdit] = useState<Pagamento | null>(null);
  const [del, setDel] = useState<Pagamento | null>(null);
  const [filtro, setFiltro] = useState('Tutti');
  const mese = todayISO().slice(0, 7), anno = todayISO().slice(0, 4);
  const pagati = data.pagamenti.filter((p) => p.stato === 'Pagato');
  const sum = (l: Pagamento[]) => l.reduce((s, p) => s + p.importo, 0);
  const attesa = data.pagamenti.filter((p) => p.stato === 'In attesa');
  const rows = data.pagamenti.filter((p) => filtro === 'Tutti' || p.stato === filtro);

  const cols: Col<Pagamento>[] = [
    { key: 'data', label: 'Data', sort: (p) => p.data, render: (p) => fmtDate(p.data) },
    { key: 'isc', label: 'Iscritto', sort: (p) => nomeIscritto(p.iscrittoId), render: (p) => <span className="font-semibold">{nomeIscritto(p.iscrittoId)}</span> },
    { key: 'desc', label: 'Descrizione', render: (p) => <span className="text-muted-foreground">{p.descrizione || '—'}</span>, className: 'hidden lg:table-cell' },
    { key: 'met', label: 'Metodo', sort: (p) => p.metodo, render: (p) => p.metodo, className: 'hidden md:table-cell' },
    { key: 'imp', label: 'Importo', sort: (p) => p.importo, render: (p) => <b>{fmtEur(p.importo)}</b> },
    { key: 'stato', label: 'Stato', sort: (p) => p.stato, render: (p) => p.stato === 'In attesa'
      ? <button onClick={(e) => { e.stopPropagation(); upsert('pagamenti', { ...p, stato: 'Pagato' }); toast.success('Segnato come pagato'); }} title="Segna come pagato"><Badge>In attesa</Badge></button>
      : <Badge>Pagato</Badge> },
    { key: 'az', label: '', render: (p) => <RowActions onEdit={() => setEdit(p)} onDelete={() => setDel(p)} /> },
  ];

  return (
    <>
      <PageHeader title="Pagamenti" subtitle="Registro incassi e pagamenti in sospeso"
        action={<button className="btn-primary" onClick={() => setEdit({ id: '', iscrittoId: '', importo: 0, data: todayISO(), metodo: 'Carta', descrizione: '', stato: 'Pagato' })}><Plus size={16} />Nuovo pagamento</button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard accent label="Incassato questo mese" value={fmtEur(sum(pagati.filter((p) => p.data.startsWith(mese))))} icon={<Wallet size={18} />} />
        <StatCard label={`Incassato nel ${anno}`} value={fmtEur(sum(pagati.filter((p) => p.data.startsWith(anno))))} icon={<TrendingUp size={18} />} />
        <StatCard label="Da incassare" value={fmtEur(sum(attesa))} icon={<Clock size={18} />} hint={`${attesa.length} pagamenti in attesa`} />
      </div>
      <DataTable rows={rows} cols={cols} placeholder="Cerca per iscritto o descrizione…" searchText={(p) => `${nomeIscritto(p.iscrittoId)} ${p.descrizione} ${p.metodo}`} defaultSort={{ key: 'data', dir: -1 }}
        toolbar={<select className="input sm:w-44" value={filtro} onChange={(e) => setFiltro(e.target.value)}>{['Tutti', 'Pagato', 'In attesa'].map((s) => <option key={s}>{s}</option>)}</select>} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifica pagamento' : 'Nuovo pagamento'}>{edit && <PagForm initial={edit} onDone={() => setEdit(null)} />}</Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text="Eliminare questo pagamento?" onConfirm={() => { remove('pagamenti', del!.id); toast.success('Pagamento eliminato'); }} />
    </>
  );
}
