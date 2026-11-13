import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Clock, MapPin, Users, Pencil, Trash2 } from 'lucide-react';
import { useStore, useLookup, Corso } from '../lib/store';
import { PageHeader, Modal, Confirm, Field, Empty } from '../components/ui';
import { GIORNI, uid } from '../lib/utils';

function CorsoForm({ initial, onDone }: { initial: Corso; onDone: () => void }) {
  const { data, upsert } = useStore();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.nome.trim() || !v.ora || v.durata < 1 || v.capienza < 1) { setErr('Compila nome, orario, durata e capienza'); return; }
    upsert('corsi', { ...v, id: v.id || uid() }); toast.success('Corso salvato'); onDone();
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      <Field label="Nome corso *" className="col-span-2"><input className="input" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} /></Field>
      <Field label="Giorno"><select className="input" value={v.giorno} onChange={(e) => setV({ ...v, giorno: +e.target.value })}>{GIORNI.map((g, i) => <option key={g} value={i}>{g}</option>)}</select></Field>
      <Field label="Orario *"><input className="input" type="time" value={v.ora} onChange={(e) => setV({ ...v, ora: e.target.value })} /></Field>
      <Field label="Durata (min) *"><input className="input" type="number" min={1} value={v.durata} onChange={(e) => setV({ ...v, durata: +e.target.value })} /></Field>
      <Field label="Capienza *"><input className="input" type="number" min={1} value={v.capienza} onChange={(e) => setV({ ...v, capienza: +e.target.value })} /></Field>
      <Field label="Stanza"><select className="input" value={v.sala} onChange={(e) => setV({ ...v, sala: e.target.value })}>
        <option value="">Nessuna</option>{v.sala && !data.sale.some((s) => s.nome === v.sala) && <option value={v.sala}>{v.sala}</option>}
        {data.sale.map((s) => <option key={s.id} value={s.nome} disabled={s.stato !== 'Disponibile'}>{s.nome}{s.stato !== 'Disponibile' ? ` (${s.stato.toLowerCase()})` : ''}</option>)}</select></Field>
      <Field label="Istruttore"><select className="input" value={v.istruttoreId} onChange={(e) => setV({ ...v, istruttoreId: e.target.value })}>
        <option value="">Nessuno</option>{data.istruttori.map((i) => <option key={i.id} value={i.id}>{i.nome} {i.cognome}</option>)}</select></Field>
      {err && <p className="col-span-2 text-sm text-destructive">{err}</p>}
      <div className="col-span-2 flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onDone}>Annulla</button><button className="btn-primary">Salva</button></div>
    </form>
  );
}

export default function Corsi() {
  const { data, remove } = useStore();
  const { istruttore } = useLookup();
  const [edit, setEdit] = useState<Corso | null>(null);
  const [del, setDel] = useState<Corso | null>(null);
  const oggi = (new Date().getDay() + 6) % 7;

  return (
    <>
      <PageHeader title="Corsi" subtitle="Calendario settimanale delle lezioni"
        action={<button className="btn-primary" onClick={() => setEdit({ id: '', nome: '', istruttoreId: '', giorno: oggi, ora: '18:00', durata: 60, capienza: 15, sala: '' })}><Plus size={16} />Nuovo corso</button>} />
      {data.corsi.length === 0 ? <div className="card"><Empty text="Nessun corso in calendario" /></div> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {GIORNI.map((g, gi) => {
            const list = data.corsi.filter((c) => c.giorno === gi).sort((a, b) => a.ora.localeCompare(b.ora));
            return (
              <div key={g} className={`rounded-xl p-2 ${gi === oggi ? 'bg-accent ring-1 ring-primary/30' : 'bg-muted/60'}`}>
                <p className={`px-2 py-1.5 text-sm font-bold ${gi === oggi ? 'text-accent-foreground' : ''}`}>{g}{gi === oggi && <span className="ml-1 text-xs font-medium">· oggi</span>}</p>
                <div className="space-y-2">
                  {list.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">Nessun corso</p>}
                  {list.map((c) => { const i = istruttore(c.istruttoreId); return (
                    <div key={c.id} className="card p-3 group border-l-4 border-l-primary">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold leading-tight">{c.nome}</p>
                        <div className="flex -mr-1 -mt-1 opacity-50 group-hover:opacity-100">
                          <button className="btn-icon h-7 w-7" onClick={() => setEdit(c)} aria-label="Modifica"><Pencil size={13} /></button>
                          <button className="btn-icon h-7 w-7" onClick={() => setDel(c)} aria-label="Elimina"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5"><Clock size={12} /><span className="font-mono">{c.ora}</span> · {c.durata} min</p>
                        {c.sala && <p className="flex items-center gap-1.5"><MapPin size={12} />{c.sala}</p>}
                        <p className="flex items-center gap-1.5"><Users size={12} />Max {c.capienza} posti</p>
                      </div>
                      {i && <p className="mt-2 text-xs font-medium">{i.nome} {i.cognome}</p>}
                    </div>); })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifica corso' : 'Nuovo corso'}>{edit && <CorsoForm initial={edit} onDone={() => setEdit(null)} />}</Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} text={`Eliminare il corso "${del?.nome}"?`} onConfirm={() => { remove('corsi', del!.id); toast.success('Corso eliminato'); }} />
    </>
  );
}
