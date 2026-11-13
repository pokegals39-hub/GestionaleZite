import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Wallet, DoorOpen, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { useStore, useLookup } from '../lib/store';
import { PageHeader, StatCard, Badge, Avatar, Empty } from '../components/ui';
import { fmtEur, fmtDate, subStatus, daysUntil, todayISO, initials, addDays } from '../lib/utils';

export default function Dashboard() {
  const { data } = useStore();
  const { iscritto, istruttore, abbonamentoAttuale } = useLookup();
  const t = todayISO();
  const mese = t.slice(0, 7);

  const stats = useMemo(() => {
    const attivi = data.iscritti.filter((m) => { const a = abbonamentoAttuale(m.id); return a && subStatus(a.fine) !== 'Scaduto'; }).length;
    const incassoMese = data.pagamenti.filter((p) => p.stato === 'Pagato' && p.data.startsWith(mese)).reduce((s, p) => s + p.importo, 0);
    const oggi = data.ingressi.filter((i) => i.dataOra.slice(0, 10) === t).length;
    const scadenze = data.abbonamenti.filter((a) => subStatus(a.fine) === 'In scadenza' && abbonamentoAttuale(a.iscrittoId)?.id === a.id)
      .sort((a, b) => a.fine.localeCompare(b.fine));
    return { attivi, incassoMese, oggi, scadenze };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const incassi = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    const k = d.toISOString().slice(0, 7);
    return { mese: d.toLocaleDateString('it-IT', { month: 'short' }), totale: data.pagamenti.filter((p) => p.stato === 'Pagato' && p.data.startsWith(k)).reduce((s, p) => s + p.importo, 0) };
  }), [data.pagamenti]);

  const presenze = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const k = addDays(t, i - 13);
    return { giorno: new Date(k).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }), ingressi: data.ingressi.filter((x) => x.dataOra.slice(0, 10) === k).length };
  }), [data.ingressi, t]);

  const giornoOggi = (new Date().getDay() + 6) % 7;
  const corsiOggi = data.corsi.filter((c) => c.giorno === giornoOggi).sort((a, b) => a.ora.localeCompare(b.ora));
  const certScaduti = data.iscritti.filter((m) => m.certificatoScadenza && daysUntil(m.certificatoScadenza) < 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={<Link to="/ingressi" className="btn-primary"><DoorOpen size={16} />Registra ingresso</Link>} />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent label="Iscritti attivi" value={stats.attivi} icon={<Users size={18} />} hint={`su ${data.iscritti.length} totali`} />
        <StatCard label="Incassi del mese" value={fmtEur(stats.incassoMese)} icon={<Wallet size={18} />} hint="Pagamenti completati" />
        <StatCard label="Ingressi oggi" value={stats.oggi} icon={<DoorOpen size={18} />} hint="Check-in registrati" />
        <StatCard label="In scadenza" value={stats.scadenze.length} icon={<AlertTriangle size={18} />} hint="Entro 14 giorni" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-bold mb-4">Incassi ultimi 6 mesi</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={incassi}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="mese" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={50} />
                <Tooltip formatter={(v: number) => fmtEur(v)} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="totale" name="Incassi" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold mb-4">Presenze ultimi 14 giorni</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={presenze}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="giorno" tickLine={false} axisLine={false} fontSize={11} interval={2} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="ingressi" name="Ingressi" stroke="hsl(var(--chart-2))" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">Abbonamenti in scadenza</h3>
            <Link to="/abbonamenti" className="text-sm text-primary font-semibold">Vedi tutti</Link>
          </div>
          {stats.scadenze.length === 0 ? <Empty text="Nessun abbonamento in scadenza" /> : (
            <ul className="divide-y">
              {stats.scadenze.slice(0, 6).map((a) => { const m = iscritto(a.iscrittoId); return (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <Avatar text={initials(m?.nome ?? '?', m?.cognome ?? '')} />
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{m?.nome} {m?.cognome}</p><p className="text-xs text-muted-foreground">Scade il {fmtDate(a.fine)}</p></div>
                  <Badge>In scadenza</Badge>
                  <span className="text-sm font-semibold w-16 text-right">{daysUntil(a.fine)} gg</span>
                </li>); })}
            </ul>
          )}
          {certScaduti.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-300 p-3 text-sm flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {certScaduti.length} iscritti hanno il certificato medico scaduto: {certScaduti.slice(0, 3).map((m) => `${m.nome} ${m.cognome}`).join(', ')}{certScaduti.length > 3 ? '…' : ''}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Corsi di oggi</h3>
          {corsiOggi.length === 0 ? <Empty text="Nessun corso oggi" /> : (
            <ul className="space-y-2">
              {corsiOggi.map((c) => { const i = istruttore(c.istruttoreId); return (
                <li key={c.id} className="flex gap-3 rounded-lg border p-3">
                  <div className="text-primary font-mono text-sm font-medium flex items-center gap-1"><Clock size={14} />{c.ora}</div>
                  <div><p className="font-semibold leading-tight">{c.nome}</p><p className="text-xs text-muted-foreground">{c.sala} · {i ? `${i.nome} ${i.cognome}` : '—'}</p></div>
                </li>); })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
