import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, DoorOpen, Trash2, AlertTriangle } from 'lucide-react';
import { useStore, useLookup } from '../lib/store';
import { PageHeader, Badge, Avatar, Empty, Confirm } from '../components/ui';
import { subStatus, daysUntil, uid, initials, fmtDateTime, todayISO } from '../lib/utils';

export default function Ingressi() {
  const { data, upsert, remove } = useStore();
  const { abbonamentoAttuale, nomeIscritto, iscritto } = useLookup();
  const [q, setQ] = useState('');
  const [giorno, setGiorno] = useState(todayISO());
  const [del, setDel] = useState<string | null>(null);

  const risultati = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return data.iscritti.filter((m) => `${m.nome} ${m.cognome} ${m.telefono}`.toLowerCase().includes(s)).slice(0, 6);
  }, [q, data.iscritti]);

  const registra = (id: string) => {
    const a = abbonamentoAttuale(id);
    const m = iscritto(id)!;
    upsert('ingressi', { id: uid(), iscrittoId: id, dataOra: new Date().toISOString() });
    if (!a || subStatus(a.fine) === 'Scaduto') toast.warning(`${m.nome} ${m.cognome}: ingresso registrato ma abbonamento non attivo`);
    else toast.success(`Benvenuto ${m.nome}! Ingresso registrato`);
    setQ('');
  };

  const delGiorno = data.ingressi.filter((i) => i.dataOra.slice(0, 10) === giorno).sort((a, b) => b.dataOra.localeCompare(a.dataOra));

  return (
    <>
      <PageHeader title="Check-in" subtitle="Registra gli ingressi dei soci in reception" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 card p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input autoFocus className="input h-14 pl-12 text-base" placeholder="Cerca iscritto per nome o telefono…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="mt-4 space-y-2">
            {q && risultati.length === 0 && <Empty text="Nessun iscritto trovato" />}
            {!q && <p className="text-sm text-muted-foreground text-center py-10">Inizia a digitare per trovare un iscritto</p>}
            {risultati.map((m) => {
              const a = abbonamentoAttuale(m.id);
              const st = a ? subStatus(a.fine) : 'Nessuno';
              const certKo = m.certificatoScadenza && daysUntil(m.certificatoScadenza) < 0;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border p-3 hover:border-primary/40 transition">
                  <Avatar text={initials(m.nome, m.cognome)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{m.nome} {m.cognome}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap"><Badge>{st}</Badge>
                      {certKo && <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={12} />Certificato scaduto</span>}</div>
                  </div>
                  <button className="btn-primary" onClick={() => registra(m.id)}><DoorOpen size={16} /><span className="hidden sm:inline">Check-in</span></button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-bold">Ingressi ({delGiorno.length})</h3>
            <input type="date" className="input w-auto h-9" value={giorno} onChange={(e) => setGiorno(e.target.value)} />
          </div>
          {delGiorno.length === 0 ? <Empty text="Nessun ingresso in questa data" /> : (
            <ul className="divide-y max-h-[520px] overflow-y-auto">
              {delGiorno.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5 group">
                  <span className="font-mono text-sm text-primary w-12">{fmtDateTime(i.dataOra).split(', ')[1] ?? fmtDateTime(i.dataOra).slice(-5)}</span>
                  <span className="flex-1 text-sm font-medium">{nomeIscritto(i.iscrittoId)}</span>
                  <button className="btn-icon opacity-0 group-hover:opacity-100" onClick={() => setDel(i.id)} aria-label="Elimina"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Confirm open={!!del} onClose={() => setDel(null)} text="Eliminare questo ingresso?" onConfirm={() => { remove('ingressi', del!); toast.success('Ingresso eliminato'); }} />
    </>
  );
}
