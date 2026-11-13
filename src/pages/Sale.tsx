import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Users, Ruler, Pencil, Trash2, Wrench, Clock } from 'lucide-react';
import { useStore, Sala } from '../lib/store';
import { PageHeader, Modal, Confirm, Field, Badge, Empty, StatCard } from '../components/ui';
import { uid, GIORNI } from '../lib/utils';

const STATI: Sala['stato'][] = ['Disponibile', 'In manutenzione', 'Chiusa'];

function SalaForm({ initial, onDone }: { initial: Sala; onDone: () => void }) {
  const { data, upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = v.nome.trim();
    if (!nome || v.capienza < 1) { setErr('Nome e capienza (almeno 1) sono obbligatori'); return; }
    if (data.sale.some((s) => s.id !== v.id && s.nome.toLowerCase() === nome.toLowerCase())) { setErr('Esiste già una stanza con questo nome'); return; }
    // Rinomina: aggiorna anche i corsi che usavano il vecchio nome
    if (v.id && initial.nome !== nome) data.corsi.filter((c) => c.sala === initial.nome).forEach((c) => upsert('corsi', { ...c, sala: nome }));
    upsert('sale', { ...v, nome, id: v.id || uid() }); toast.success('Stanza salvata'); onDone();
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      <Field label="Nome stanza *"><input className="input" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
      <Field label="Tipologia"><input className="input" value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value })} placeholder="Es. Yoga / Pilates" /></Field>
      <Field label="Capienza (persone) *"><input className="input" type="number" min={1} value={v.capienza} onChange={(e) => setV({ ...v, capienza: +e.target.value })} /></Field>
      <Field label="Superficie (m²)"><input className="input" type="number" min={0} value={v.metriQuadri || ''} onChange={(e) => setV({ ...v, metriQuadri: +e.target.value })} /></Field>
      <Field label="Stato" className="col-span-2"><select className="input" value={v.stato} onChange={(e) => setV({ ...v, stato: e.target.value as Sala['stato'] })}>{STATI.map((s) => <option key={s}>{s}</option>)}</select></Field>
      <Field label="Attrezzature" className="col-span-2"><textarea className="input h-20 py-2" value={v.attrezzature} onChange={(e) => setV({ ...v, attrezzature: e.target.value })} /></Field>
      <Field label="Note" className="col-span-2"><input className="input" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></Field>
      {err && <p className="col-span-2 text-sm text-destructive">{err}</p>}
      <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

function SalaCard({ s, onEdit, onDelete }: { s: Sala; onEdit: () => void; onDelete: () => void }) {
  const { data } = useStore();
  const corsi = data.corsi.filter((c) => c.sala === s.nome).sort((a, b) => a.giorno - b.giorno || a.ora.localeCompare(b.ora));
  const ore = corsi.reduce((t, c) => t + c.durata, 0) / 60;
  const occ = Math.min(100, Math.round((ore / 70) * 100)); // su 70 ore di apertura settimanali
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-bold text-lg leading-tight">{s.nome}</p><p className="text-sm text-primary font-medium">{s.tipo || '—'}</p></div>
        <div className="flex items-center gap-1"><Badge>{s.stato}</Badge>
          <button className="btn-icon" onClick={onEdit} aria-label="Modifica"><Pencil size={14} /></button>
          <button className="btn-icon" onClick={onDelete} aria-label="Elimina"><Trash2 size={14} /></button></div>
      </div>
      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Users size={14} />{s.capienza} posti</span>
        {s.metriQuadri > 0 && <span className="flex items-center gap-1.5"><Ruler size={14} />{s.metriQuadri} m²</span>}
      </div>
      {s.attrezzature && <p className="mt-3 text-sm">{s.attrezzature}</p>}
      {s.note && <p className="mt-2 text-xs rounded-md bg-muted px-2 py-1.5 flex items-center gap-1.5"><Wrench size={12} />{s.note}</p>}
      <div className="mt-4 mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Utilizzo settimanale</span><span>{ore.toFixed(1)} h · {occ}%</span></div>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${occ}%` }} /></div>
      </div>
      <div className="mt-auto pt-4 border-t flex flex-wrap gap-1.5">
        {corsi.length === 0 ? <span className="text-xs text-muted-foreground">Nessun corso programmato</span> :
          corsi.map((c) => <span key={c.id} className="rounded-md bg-muted px-2 py-1 text-xs font-medium flex items-center gap-1"><Clock size={11} />{c.nome} · {GIORNI[c.giorno].slice(0, 3)} {c.ora}</span>)}
      </div>
    </div>
  );
}

export default function Sale() {
  const { data, remove, upsert } = useStore();
  const [edit, setEdit] = useState<Sala | null>(null);
  const [del, setDel] = useState<Sala | null>(null);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('Tutte');
  const rows = data.sale.filter((s) => (filtro === 'Tutte' || s.stato === filtro) && `${s.nome} ${s.tipo} ${s.attrezzature}`.toLowerCase().includes(q.toLowerCase()));
  const disp = data.sale.filter((s) => s.stato === 'Disponibile');

  return (
    <>
      <PageHeader title="Stanze" subtitle="Sale della palestra, capienza, attrezzature e utilizzo"
        action={<button className="btn-primary" onClick={() => setEdit({ id: '', nome: '', tipo: '', capienza: 15, metriQuadri: 0, attrezzature: '', stato: 'Disponibile', note: '' })}><Plus size={16} />Nuova stanza</button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard accent label="Stanze disponibili" value={`${disp.length}/${data.sale.length}`} icon={<Users size={18} />} />
        <StatCard label="Capienza totale" value={disp.reduce((t, s) => t + s.capienza, 0)} icon={<Users size={18} />} hint="Persone nelle stanze disponibili" />
        <StatCard label="In manutenzione" value={data.sale.filter((s) => s.stato === 'In manutenzione').length} icon={<Wrench size={18} />} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input className="input pl-9" placeholder="Cerca stanza, tipologia o attrezzatura…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input sm:w-48" value={filtro} onChange={(e) => setFiltro(e.target.value)}>{['Tutte', ...STATI].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {rows.length === 0 ? <div className="card"><Empty text="Nessuna stanza trovata" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => <SalaCard key={s.id} s={s} onEdit={() => setEdit(s)} onDelete={() => setDel(s)} />)}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifica stanza' : 'Nuova stanza'}>{edit && <SalaForm initial={edit} onDone={() => setEdit(null)} />}</Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text={`Eliminare la stanza "${del?.nome}"? I corsi assegnati resteranno senza stanza.`}
        onConfirm={() => { data.corsi.filter((c) => c.sala === del!.nome).forEach((c) => upsert('corsi', { ...c, sala: '' })); remove('sale', del!.id); toast.success('Stanza eliminata'); }} />
    </>
  );
}
