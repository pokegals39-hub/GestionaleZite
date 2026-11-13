import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { uid, todayISO, addMonths, addDays } from './utils';

export type Iscritto = {
  id: string; nome: string; cognome: string; email: string; telefono: string;
  dataNascita: string; dataIscrizione: string; certificatoScadenza: string; note: string;
};
export type Piano = { id: string; nome: string; durataMesi: number; prezzo: number; descrizione: string };
export type Abbonamento = { id: string; iscrittoId: string; pianoId: string; inizio: string; fine: string };
export type Pagamento = {
  id: string; iscrittoId: string; importo: number; data: string;
  metodo: 'Contanti' | 'Carta' | 'Bonifico' | 'Satispay'; descrizione: string; stato: 'Pagato' | 'In attesa';
};
export type Istruttore = { id: string; nome: string; cognome: string; specialita: string; email: string; telefono: string };
export type Corso = {
  id: string; nome: string; istruttoreId: string; giorno: number; ora: string;
  durata: number; capienza: number; sala: string;
};
export type Sala = { id: string; nome: string; tipo: string; capienza: number; metriQuadri: number; attrezzature: string; stato: 'Disponibile' | 'In manutenzione' | 'Chiusa'; note: string };
export type Ingresso = { id: string; iscrittoId: string; dataOra: string };

export type Data = {
  iscritti: Iscritto[]; piani: Piano[]; abbonamenti: Abbonamento[]; pagamenti: Pagamento[];
  istruttori: Istruttore[]; corsi: Corso[]; ingressi: Ingresso[]; sale: Sala[];
};
export type Collection = keyof Data;

const KEY = 'gestionale-palestra-v1';

function seed(): Data {
  const t = todayISO();
  const nomi = [
    ['Marco', 'Rossi'], ['Giulia', 'Bianchi'], ['Luca', 'Ferrari'], ['Sara', 'Esposito'], ['Andrea', 'Romano'],
    ['Chiara', 'Colombo'], ['Matteo', 'Ricci'], ['Francesca', 'Marino'], ['Davide', 'Greco'], ['Elena', 'Bruno'],
    ['Simone', 'Gallo'], ['Martina', 'Conti'],
  ];
  const iscritti: Iscritto[] = nomi.map(([n, c], i) => ({
    id: `m${i}`, nome: n, cognome: c, email: `${n}.${c}@email.it`.toLowerCase(), telefono: `+39 3${40 + i} 123 45${i % 10}${i % 7}`,
    dataNascita: `19${85 + (i % 14)}-0${(i % 9) + 1}-1${i % 9}`, dataIscrizione: addDays(t, -30 * (i + 1)),
    certificatoScadenza: addDays(t, i % 4 === 0 ? -5 : 40 * (i + 1)), note: '',
  }));
  const piani: Piano[] = [
    { id: 'p1', nome: 'Mensile Open', durataMesi: 1, prezzo: 49, descrizione: 'Accesso illimitato sala pesi e corsi' },
    { id: 'p2', nome: 'Trimestrale', durataMesi: 3, prezzo: 129, descrizione: 'Sala pesi + corsi, 3 mesi' },
    { id: 'p3', nome: 'Semestrale', durataMesi: 6, prezzo: 239, descrizione: 'Sala pesi + corsi, 6 mesi' },
    { id: 'p4', nome: 'Annuale Premium', durataMesi: 12, prezzo: 420, descrizione: 'Tutto incluso + 2 sessioni PT' },
  ];
  const abbonamenti: Abbonamento[] = iscritti.map((m, i) => {
    const p = piani[i % 4];
    const inizio = addDays(t, -[10, 80, 170, 300, 25, 95, 175, 360, 5, 60, 150, 40][i]);
    return { id: `a${i}`, iscrittoId: m.id, pianoId: p.id, inizio, fine: addMonths(inizio, p.durataMesi) };
  });
  const metodi: Pagamento['metodo'][] = ['Carta', 'Contanti', 'Bonifico', 'Satispay'];
  const pagamenti: Pagamento[] = [];
  for (let k = 0; k < 6; k++) {
    iscritti.forEach((m, i) => {
      if ((i + k) % 3 === 0) return;
      pagamenti.push({
        id: uid(), iscrittoId: m.id, importo: piani[i % 4].prezzo, data: addDays(t, -k * 30 - i),
        metodo: metodi[(i + k) % 4], descrizione: `Abbonamento ${piani[i % 4].nome}`,
        stato: k === 0 && i % 5 === 0 ? 'In attesa' : 'Pagato',
      });
    });
  }
  const istruttori: Istruttore[] = [
    { id: 'i1', nome: 'Alessio', cognome: 'Moretti', specialita: 'CrossFit, Functional', email: 'alessio@palestra.it', telefono: '+39 333 111 2233' },
    { id: 'i2', nome: 'Valentina', cognome: 'Lombardi', specialita: 'Yoga, Pilates', email: 'valentina@palestra.it', telefono: '+39 333 444 5566' },
    { id: 'i3', nome: 'Roberto', cognome: 'Fontana', specialita: 'Spinning, HIIT', email: 'roberto@palestra.it', telefono: '+39 333 777 8899' },
  ];
  const corsi: Corso[] = [
    { id: 'c1', nome: 'CrossFit', istruttoreId: 'i1', giorno: 0, ora: '18:30', durata: 60, capienza: 15, sala: 'Box' },
    { id: 'c2', nome: 'Yoga', istruttoreId: 'i2', giorno: 1, ora: '09:00', durata: 75, capienza: 20, sala: 'Sala Zen' },
    { id: 'c3', nome: 'Spinning', istruttoreId: 'i3', giorno: 1, ora: '19:00', durata: 45, capienza: 25, sala: 'Sala Bike' },
    { id: 'c4', nome: 'Pilates', istruttoreId: 'i2', giorno: 2, ora: '12:30', durata: 60, capienza: 12, sala: 'Sala Zen' },
    { id: 'c5', nome: 'HIIT', istruttoreId: 'i3', giorno: 3, ora: '07:30', durata: 45, capienza: 18, sala: 'Sala 1' },
    { id: 'c6', nome: 'Functional', istruttoreId: 'i1', giorno: 4, ora: '18:00', durata: 60, capienza: 15, sala: 'Box' },
    { id: 'c7', nome: 'Yoga Flow', istruttoreId: 'i2', giorno: 5, ora: '10:00', durata: 60, capienza: 20, sala: 'Sala Zen' },
  ];
  const sale: Sala[] = [
    { id: 's1', nome: 'Sala Pesi', tipo: 'Sala attrezzi', capienza: 40, metriQuadri: 220, attrezzature: 'Panche, rack, manubri 2-50 kg, macchine isotoniche', stato: 'Disponibile', note: '' },
    { id: 's2', nome: 'Box', tipo: 'Functional / CrossFit', capienza: 15, metriQuadri: 120, attrezzature: 'Bilancieri, kettlebell, rower, sbarre trazioni', stato: 'Disponibile', note: '' },
    { id: 's3', nome: 'Sala Zen', tipo: 'Yoga / Pilates', capienza: 20, metriQuadri: 90, attrezzature: 'Tappetini, blocchi, reformer', stato: 'Disponibile', note: '' },
    { id: 's4', nome: 'Sala Bike', tipo: 'Spinning', capienza: 25, metriQuadri: 80, attrezzature: '25 bike, impianto audio e luci', stato: 'In manutenzione', note: '3 bike da revisionare' },
    { id: 's5', nome: 'Sala 1', tipo: 'Polivalente', capienza: 18, metriQuadri: 100, attrezzature: 'Step, elastici, palle mediche', stato: 'Disponibile', note: '' },
  ];
  const ingressi: Ingresso[] = [];
  for (let d = 0; d < 14; d++) {
    const n = 4 + ((d * 7) % 6);
    for (let j = 0; j < n; j++) {
      const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(7 + ((j * 3) % 13), (j * 17) % 60);
      ingressi.push({ id: uid(), iscrittoId: iscritti[(d + j * 5) % iscritti.length].id, dataOra: dt.toISOString() });
    }
  }
  return { iscritti, piani, abbonamenti, pagamenti, istruttori, corsi, ingressi, sale };
}

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch { /* dati corrotti: riparte dai dati demo */ }
  return seed();
}

type Ctx = {
  data: Data;
  upsert: <K extends Collection>(c: K, item: Data[K][number]) => void;
  remove: (c: Collection, id: string) => void;
  replaceAll: (d: Data) => void;
  resetDemo: () => void;
  clearAll: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);

  const upsert: Ctx['upsert'] = (c, item) =>
    setData((d) => {
      const list = d[c] as { id: string }[];
      const exists = list.some((x) => x.id === item.id);
      return { ...d, [c]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list] };
    });

  const remove = (c: Collection, id: string) =>
    setData((d) => {
      const next = { ...d, [c]: (d[c] as { id: string }[]).filter((x) => x.id !== id) } as Data;
      if (c === 'iscritti') {
        next.abbonamenti = next.abbonamenti.filter((a) => a.iscrittoId !== id);
        next.pagamenti = next.pagamenti.filter((a) => a.iscrittoId !== id);
        next.ingressi = next.ingressi.filter((a) => a.iscrittoId !== id);
      }
      return next;
    });

  const empty: Data = { iscritti: [], piani: [], abbonamenti: [], pagamenti: [], istruttori: [], corsi: [], ingressi: [], sale: [] };

  return (
    <StoreCtx.Provider value={{
      data, upsert, remove,
      replaceAll: (d) => setData({ ...empty, ...d }),
      resetDemo: () => setData(seed()),
      clearAll: () => setData(empty),
    }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore fuori da StoreProvider');
  return c;
}

export function useLookup() {
  const { data } = useStore();
  const iscritto = (id: string) => data.iscritti.find((m) => m.id === id);
  const nomeIscritto = (id: string) => { const m = iscritto(id); return m ? `${m.nome} ${m.cognome}` : 'Iscritto rimosso'; };
  const piano = (id: string) => data.piani.find((p) => p.id === id);
  const istruttore = (id: string) => data.istruttori.find((p) => p.id === id);
  const abbonamentoAttuale = (iscrittoId: string) =>
    data.abbonamenti.filter((a) => a.iscrittoId === iscrittoId).sort((a, b) => b.fine.localeCompare(a.fine))[0];
  return { iscritto, nomeIscritto, piano, istruttore, abbonamentoAttuale };
}
