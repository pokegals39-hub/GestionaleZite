import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload, RotateCcw, Trash2, Database } from 'lucide-react';
import { useStore, Data } from '../lib/store';
import { PageHeader, Confirm } from '../components/ui';
import { todayISO } from '../lib/utils';

export default function Impostazioni() {
  const { data, replaceAll, resetDemo, clearAll } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [conf, setConf] = useState<'demo' | 'clear' | null>(null);

  const esporta = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `backup-palestra-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(a.href); toast.success('Backup scaricato');
  };
  const importa = async (f?: File) => {
    if (!f) return;
    try {
      const d = JSON.parse(await f.text()) as Data;
      if (!Array.isArray(d.iscritti)) throw new Error();
      replaceAll(d); toast.success('Dati importati');
    } catch { toast.error('File non valido'); }
    if (file.current) file.current.value = '';
  };

  const conteggi = [['Iscritti', data.iscritti.length], ['Abbonamenti', data.abbonamenti.length], ['Pagamenti', data.pagamenti.length], ['Corsi', data.corsi.length], ['Istruttori', data.istruttori.length], ['Stanze', data.sale.length], ['Ingressi', data.ingressi.length]] as const;

  return (
    <>
      <PageHeader title="Impostazioni" subtitle="Backup, ripristino e gestione dei dati" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-bold flex items-center gap-2"><Database size={18} className="text-primary" />Dati salvati</h3>
          <p className="text-sm text-muted-foreground mt-1">I dati sono salvati nel browser di questo dispositivo. Esegui backup regolari.</p>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {conteggi.map(([l, n]) => <div key={l} className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}
          </div>
        </div>
        <div className="card p-6 space-y-3">
          <h3 className="font-bold">Backup e ripristino</h3>
          <button className="btn-primary w-full" onClick={esporta}><Download size={16} />Esporta backup (JSON)</button>
          <button className="btn-outline w-full" onClick={() => file.current?.click()}><Upload size={16} />Importa backup</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => importa(e.target.files?.[0])} />
          <div className="border-t pt-3 space-y-3">
            <button className="btn-outline w-full" onClick={() => setConf('demo')}><RotateCcw size={16} />Ripristina dati demo</button>
            <button className="btn-danger w-full" onClick={() => setConf('clear')}><Trash2 size={16} />Cancella tutti i dati</button>
          </div>
        </div>
      </div>
      <Confirm open={conf === 'demo'} onClose={() => setConf(null)} text="I dati attuali verranno sostituiti con i dati dimostrativi." onConfirm={() => { resetDemo(); toast.success('Dati demo ripristinati'); }} />
      <Confirm open={conf === 'clear'} onClose={() => setConf(null)} text="Tutti i dati verranno eliminati definitivamente. Consigliamo di esportare prima un backup." onConfirm={() => { clearAll(); toast.success('Dati cancellati'); }} />
    </>
  );
}
