import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'gestionale-palestra-tema';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(() => localStorage.getItem(KEY) === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY, dark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('tema', { detail: dark }));
  }, [dark]);
  useEffect(() => {
    const h = (e: Event) => setDark((e as CustomEvent<boolean>).detail);
    window.addEventListener('tema', h);
    return () => window.removeEventListener('tema', h);
  }, []);
  return (
    <button onClick={() => setDark(!dark)} aria-label={dark ? 'Passa alla modalità giorno' : 'Passa alla modalità notte'}
      title={dark ? 'Modalità giorno' : 'Modalità notte'}
      className={`h-9 w-9 grid place-items-center rounded-lg transition-colors hover:bg-sidebar-accent ${className}`}>
      {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
    </button>
  );
}
