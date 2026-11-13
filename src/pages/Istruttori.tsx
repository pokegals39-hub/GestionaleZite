import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { useStore, Istruttore } from '../lib/store';
import { PageHeader, Modal, Confirm, Field, Empty } from '../components/ui';
import { uid, initials, GIORNI } from '../lib/utils';

function IstrForm({ initial, onDone }: { initial: Istruttore; onDone: () => void }) {
  const { upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const set = (k: keyof Istruttore) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.nome.trim() || !v.cognome.trim()) { setErr('Nome e cognome sono obbligatori'); return; }
    if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) { setErr('Email non valida'); return; }
    upsert('istruttori', { ...v, id: v.id || uid() }); toast.success('Istruttore salvato'); onDone();
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      <Field label="Nome *"><input className="input" value={v.nome} onChange={set('nome')} /></Field>
      <Field label="Cognome *"><input className="input" value={v.cognome} onChange={set('cognome')} /></Field>
      <Field label="Specialità" className="col-span-2"><input className="input" value={v.specialita} onChange={set('specialita')} placeholder="Es. Yoga, Pilates" /></Field>
      <Field label="Email"><input className="input" value={v.email} onChange={set('email')} /></Field>
      <Field label="Telefono"><input className="input" value={v.telefono} onChange={set('telefono')} /></Field>
      {err && <p className="col-span-2 text-sm text-destructive">{err}</p>}
      <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

export default function Istruttori() {
  const { data, remove } = useStore();
  const [edit, setEdit] = useState<Istruttore | null>(null);
  const [del, setDel] = useState<Istruttore | null>(null);
  return (
    <>
      <PageHeader title="Istruttori" subtitle="Lo staff tecnico della palestra"
        action={<button className="btn-primary" onClick={() => setEdit({ id: '', nome: '', cognome: '', specialita: '', email: '', telefono: '' })}><Plus size={16} />Nuovo istruttore</button>} />
      {data.istruttori.length === 0 ? <div className="card"><Empty text="Nessun istruttore" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.istruttori.map((i) => {
            const corsi = data.corsi.filter((c) => c.istruttoreId === i.id);
            return (
              <div key={i.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center text-lg font-bold">{initials(i.nome, i.cognome)}</div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-lg">{i.nome} {i.cognome}</p><p className="text-sm text-primary font-medium">{i.specialita || '—'}</p></div>
                  <div className="flex"><button className="btn-icon" onClick={() => setEdit(i)} aria-label="Modifica"><Pencil size={14} /></button><button className="btn-icon" onClick={() => setDel(i)} aria-label="Elimina"><Trash2 size={14} /></button></div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail size={14} />{i.email || '—'}</p>
                  <p className="flex items-center gap-2"><Phone size={14} />{i.telefono || '—'}</p>
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-1.5">
                  {corsi.length === 0 ? <span className="text-xs text-muted-foreground">Nessun corso assegnato</span> :
                    corsi.map((c) => <span key={c.id} className="rounded-md bg-muted px-2 py-1 text-xs font-medium">{c.nome} · {GIORNI[c.giorno].slice(0, 3)} {c.ora}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifica istruttore' : 'Nuovo istruttore'}>{edit && <IstrForm initial={edit} onDone={() => setEdit(null)} />}</Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text={`Eliminare ${del?.nome} ${del?.cognome}? I suoi corsi resteranno senza istruttore.`} onConfirm={() => { remove('istruttori', del!.id); toast.success('Istruttore eliminato'); }} />
    </>
  );
}
