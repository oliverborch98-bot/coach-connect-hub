import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, CheckSquare, MessageSquare, User, Dumbbell } from 'lucide-react';

const navItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/client/training', icon: Dumbbell, label: 'Træning' },
  { to: '/client/checkin', icon: ClipboardCheck, label: 'Check-in' },
  { to: '/client/habits', icon: CheckSquare, label: 'Habits' },
  { to: '/client/messages', icon: MessageSquare, label: 'Beskeder' },
  { to: '/client/profile', icon: User, label: 'Profil' },
];

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-center p-4 border-b border-border">
        <h1 className="text-base font-bold gold-text">THE BUILD METHOD</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around py-2 z-50">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-1.5 text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }>
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
