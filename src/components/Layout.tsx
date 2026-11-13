import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, CreditCard, Wallet, CalendarDays, UserCog, DoorOpen, Settings, Menu, X, Dumbbell, DoorClosed } from 'lucide-react';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ingressi', label: 'Check-in', icon: DoorOpen },
  { to: '/iscritti', label: 'Iscritti', icon: Users },
  { to: '/abbonamenti', label: 'Abbonamenti', icon: CreditCard },
  { to: '/pagamenti', label: 'Pagamenti', icon: Wallet },
  { to: '/corsi', label: 'Corsi', icon: CalendarDays },
  { to: '/sale', label: 'Stanze', icon: DoorClosed },
  { to: '/istruttori', label: 'Istruttori', icon: UserCog },
  { to: '/impostazioni', label: 'Impostazioni', icon: Settings },
];

function Sidebar({ onNav }: { onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 h-20">
        <div className="h-10 w-10 rounded-xl bg-sidebar-primary grid place-items-center text-white shadow-lg shadow-primary/40">
          <Dumbbell size={20} />
        </div>
        <div>
          <p className="font-extrabold text-white text-lg leading-none tracking-tight">IronHub</p>
          <p className="text-xs opacity-60 mt-1">Gestionale Palestra</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onNav}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-sidebar-accent text-white' : 'hover:bg-sidebar-accent/60 hover:text-white')}>
            {({ isActive }) => (<>
              <Icon size={18} className={isActive ? 'text-sidebar-primary' : ''} />{label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </>)}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 flex items-center justify-between border-t border-sidebar-border">
        <p className="px-2 text-xs opacity-40">© {new Date().getFullYear()} IronHub</p>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  return (
    <div className="min-h-screen">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64"><Sidebar /></aside>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-sidebar text-white px-4 h-14">
        <span className="font-extrabold flex items-center gap-2"><Dumbbell size={18} className="text-sidebar-primary" />IronHub</span>
        <div className="flex items-center gap-1"><ThemeToggle /><button onClick={() => setOpen(true)} aria-label="Apri menu"><Menu /></button></div>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <button className="absolute right-3 top-6 text-white z-10" onClick={() => setOpen(false)} aria-label="Chiudi menu"><X /></button>
            <Sidebar onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8"><Outlet /></div>
      </main>
    </div>
  );
}
