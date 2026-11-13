import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { StoreProvider } from './lib/store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Iscritti from './pages/Iscritti';
import Abbonamenti from './pages/Abbonamenti';
import Pagamenti from './pages/Pagamenti';
import Corsi from './pages/Corsi';
import Istruttori from './pages/Istruttori';
import Sale from './pages/Sale';
import Ingressi from './pages/Ingressi';
import Impostazioni from './pages/Impostazioni';

// HashRouter: funziona anche su GitHub Pages senza pagina bianca al refresh
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/iscritti" element={<Iscritti />} />
            <Route path="/abbonamenti" element={<Abbonamenti />} />
            <Route path="/pagamenti" element={<Pagamenti />} />
            <Route path="/corsi" element={<Corsi />} />
            <Route path="/sale" element={<Sale />} />
            <Route path="/istruttori" element={<Istruttori />} />
            <Route path="/ingressi" element={<Ingressi />} />
            <Route path="/impostazioni" element={<Impostazioni />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster richColors position="top-right" />
    </StoreProvider>
  );
}
