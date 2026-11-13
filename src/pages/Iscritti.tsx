import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Mail, Phone, DoorOpen } from 'lucide-react';
import { useStore, useLookup, Iscritto } from '../lib/store';
import { PageHeader, DataTable, Modal, Confirm, Field, Badge, Avatar, RowActions, Col } from '../components/ui';
import { fmtDate, fmtEur, fmtDateTime, subStatus, daysUntil, uid, todayISO, initials } from '../lib/utils';

const schema = z.object({
  nome: z.string().trim().min(1, 'Nome obbligatorio'),
  cognome: z.string().trim().min(1, 'Cognome obbligatorio'),
  email: z.string().trim().email('Email non valida').or(z.literal('')),
  telefono: z.string().trim().min(6, 'Telefono non valido'),
});

const vuoto = (): Iscritto => ({ id: '', nome: '', cognome: '', email: '', telefono: '', dataNascita: '', dataIscrizione: todayISO(), certificatoScadenza: '', note: '' });

export function IscrittoForm({ initial, onDone }: { initial: Iscritto; onDone: () => void }) {
  const { upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof Iscritto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(v);
    if (!r.success) { setErr(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    upsert('iscritti', { ...v, id: v.id || uid() });
    toast.success(v.id ? 'Iscritto aggiornato' : 'Iscritto aggiunto');
    onDone();
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Nome *" error={err.nome}><input className="input" value={v.nome} onChange={set('nome')} /></Field>
      <Field label="Cognome *" error={err.cognome}><input className="input" value={v.cognome} onChange={set('cognome')} /></Field>
      <Field label="Email" error={err.email}><input className="input" type="email" value={v.email} onChange={set('email')} /></Field>
      <Field label="Telefono *" error={err.telefono}><input className="input" value={v.telefono} onChange={set('telefono')} /></Field>
      <Field label="Data di nascita"><input className="input" type="date" value={v.dataNascita} onChange={set('dataNascita')} /></Field>
      <Field label="Data iscrizione"><input className="input" type="date" value={v.dataIscrizione} onChange={set('dataIscrizione')} /></Field>
      <Field label="Scadenza certificato medico" className="sm:col-span-2"><input className="input" type="date" value={v.certificatoScadenza} onChange={set('certificatoScadenza')} /></Field>
      <Field label="Note" className="sm:col-span-2"><textarea className="input h-24 py-2" value={v.note} onChange={set('note')} /></Field>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onDone}>Annulla</button>
        <button className="btn-primary">Salva</button>
      </div>
    </form>
  );
}

function Dettaglio({ m, onEdit }: { m: Iscritto; onEdit: () => void }) {
  const { data, upsert } = useStore();
  const { piano } = useLookup();
  const abb = data.abbonamenti.filter((a) => a.iscrittoId === m.id).sort((a, b) => b.fine.localeCompare(a.fine));
  const pag = data.pagamenti.filter((p) => p.iscrittoId === m.id).sort((a, b) => b.data.localeCompare(a.data));
  const ing = data.ingressi.filter((i) => i.iscrittoId === m.id).sort((a, b) => b.dataOra.localeCompare(a.dataOra));
  const cert = m.certificatoScadenza ? (daysUntil(m.certificatoScadenza) < 0 ? 'Scaduto' : 'Valido') : 'Nessuno';
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center text-lg font-bold">{initials(m.nome, m.cognome)}</div>
        <div className="flex-1"><p className="text-xl font-bold">{m.nome} {m.cognome}</p><p className="text-sm text-muted-foreground">Iscritto dal {fmtDate(m.dataIscrizione)}</p></div>
        <button className="btn-outline" onClick={onEdit}>Modifica</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <p className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground" />{m.email || '—'}</p>
        <p className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" />{m.telefono}</p>
        <p>Nato il: <b>{fmtDate(m.dataNascita)}</b></p>
        <p className="flex items-center gap-2">Certificato: <Badge>{cert}</Badge> <span className="text-muted-foreground">{fmtDate(m.certificatoScadenza)}</span></p>
      </div>
      {m.note && <p className="rounded-lg bg-muted p-3 text-sm">{m.note}</p>}
      <button className="btn-primary w-full" onClick={() => { upsert('ingressi', { id: uid(), iscrittoId: m.id, dataOra: new Date().toISOString() }); toast.success('Ingresso registrato'); }}>
        <DoorOpen size={16} />Registra ingresso ora
      </button>
      <Section title="Abbonamenti">{abb.map((a) => <Row key={a.id} l={piano(a.pianoId)?.nome ?? '—'} r={<><span className="text-muted-foreground">{fmtDate(a.inizio)} → {fmtDate(a.fine)}</span><Badge>{subStatus(a.fine)}</Badge></>} />)}</Section>
      <Section title="Pagamenti">{pag.slice(0, 6).map((p) => <Row key={p.id} l={`${fmtDate(p.data)} · ${p.metodo}`} r={<><b>{fmtEur(p.importo)}</b><Badge>{p.stato}</Badge></>} />)}</Section>
      <Section title={`Ultimi ingressi (${ing.length})`}>{ing.slice(0, 5).map((i) => <Row key={i.id} l={fmtDateTime(i.dataOra)} r={null} />)}</Section>
    </div>
  );
}
const Section = ({ title, children }: { title: string; children: React.ReactNode[] }) => (
  <div><h4 className="label">{title}</h4>{children.length ? <div className="rounded-lg border divide-y">{children}</div> : <p className="text-sm text-muted-foreground">Nessun dato</p>}</div>
);
const Row = ({ l, r }: { l: string; r: React.ReactNode }) => <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm"><span>{l}</span><span className="flex items-center gap-2">{r}</span></div>;

export default function Iscritti() {
  const { data, remove } = useStore();
  const { piano, abbonamentoAttuale } = useLookup();
  const [edit, setEdit] = useState<Iscritto | null>(null);
  const [view, setView] = useState<Iscritto | null>(null);
  const [del, setDel] = useState<Iscritto | null>(null);
  const stato = (m: Iscritto) => { const a = abbonamentoAttuale(m.id); return a ? subStatus(a.fine) : 'Nessuno'; };

  const cols: Col<Iscritto>[] = [
    { key: 'nome', label: 'Iscritto', sort: (m) => `${m.cognome} ${m.nome}`, render: (m) => (
      <div className="flex items-center gap-3"><Avatar text={initials(m.nome, m.cognome)} /><div><p className="font-semibold">{m.nome} {m.cognome}</p><p className="text-xs text-muted-foreground">{m.email}</p></div></div>) },
    { key: 'tel', label: 'Telefono', render: (m) => m.telefono, className: 'hidden md:table-cell' },
    { key: 'piano', label: 'Piano', sort: (m) => piano(abbonamentoAttuale(m.id)?.pianoId ?? '')?.nome ?? '', render: (m) => piano(abbonamentoAttuale(m.id)?.pianoId ?? '')?.nome ?? '—', className: 'hidden lg:table-cell' },
    { key: 'scad', label: 'Scadenza', sort: (m) => abbonamentoAttuale(m.id)?.fine ?? '', render: (m) => fmtDate(abbonamentoAttuale(m.id)?.fine) },
    { key: 'stato', label: 'Stato', sort: stato, render: (m) => <Badge>{stato(m)}</Badge> },
    { key: 'az', label: '', render: (m) => <RowActions onEdit={() => setEdit(m)} onDelete={() => setDel(m)} /> },
  ];

  return (
    <>
      <PageHeader title="Iscritti" subtitle="Anagrafica completa dei soci della palestra"
        action={<button className="btn-primary" onClick={() => setEdit(vuoto())}><Plus size={16} />Nuovo iscritto</button>} />
      <DataTable rows={data.iscritti} cols={cols} placeholder="Cerca per nome, email o telefono…" onRowClick={(m: Iscritto) => setView(m)}
        searchText={(m) => `${m.nome} ${m.cognome} ${m.email} ${m.telefono}`} defaultSort={{ key: 'nome', dir: 1 }} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifica iscritto' : 'Nuovo iscritto'} wide>
        {edit && <IscrittoForm initial={edit} onDone={() => { setEdit(null); setView(null); }} />}
      </Modal>
      <Modal open={!!view} onClose={() => setView(null)} title="Scheda iscritto" wide>
        {view && <Dettaglio m={data.iscritti.find((x) => x.id === view.id) ?? view} onEdit={() => setEdit(view)} />}
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text={`Eliminare ${del?.nome} ${del?.cognome}? Verranno rimossi anche abbonamenti, pagamenti e ingressi collegati.`}
        onConfirm={() => { remove('iscritti', del!.id); toast.success('Iscritto eliminato'); }} />
    </>
  );
}
