import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, StickyNote, Phone, TrendingUp, Camera, Target, CheckSquare, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tabs = [
  { id: 'overview', label: 'Oversigt', icon: TrendingUp },
  { id: 'checkins', label: 'Check-ins', icon: FileText },
  { id: 'photos', label: 'Billeder', icon: Camera },
  { id: 'goals', label: 'Mål', icon: Target },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'notes', label: 'Noter', icon: StickyNote },
  { id: 'messages', label: 'Beskeder', icon: MessageSquare },
];

const mockClient = {
  name: 'Thomas Andersen',
  age: 28,
  phone: '+45 12 34 56 78',
  goal: 'Tab 8 kg fedt, opbyg muskelmasse',
  package: 'The Build Method 12 uger',
  startDate: '13. jan 2026',
  week: 7,
  startWeight: 92,
  currentWeight: 86.5,
  goalWeight: 84,
  phase: 'Acceleration',
  compliance: 92,
};

const mockCheckins = [
  { week: 7, date: '22. feb', weight: 86.5, fat: 18.2, kcal: 2150, workouts: '4/4', energy: 8, sleep: 7, status: 'submitted' },
  { week: 6, date: '15. feb', weight: 87.1, fat: 18.5, kcal: 2200, workouts: '3/4', energy: 7, sleep: 8, status: 'reviewed' },
  { week: 5, date: '8. feb', weight: 87.8, fat: 18.9, kcal: 2100, workouts: '4/4', energy: 8, sleep: 7, status: 'reviewed' },
  { week: 4, date: '1. feb', weight: 88.3, fat: 19.1, kcal: 2250, workouts: '4/4', energy: 7, sleep: 6, status: 'reviewed' },
];

export default function CoachClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/coach')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">TA</div>
          <div>
            <h1 className="text-xl font-bold">{mockClient.name}</h1>
            <p className="text-sm text-muted-foreground">Uge {mockClient.week}/12 — {mockClient.phase}</p>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Besked
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 flex items-center gap-2">
            <Phone className="h-4 w-4" /> Book call
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Alder</p>
                <p className="text-sm font-medium">{mockClient.age} år</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="text-sm font-medium">{mockClient.phone}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Pakke</p>
                <p className="text-sm font-medium">{mockClient.package}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Primært mål</p>
                <p className="text-sm font-medium">{mockClient.goal}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Startdato</p>
                <p className="text-sm font-medium">{mockClient.startDate}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Compliance</p>
                <p className="text-sm font-semibold text-success">{mockClient.compliance}%</p>
              </div>
            </div>

            {/* Weight Progress */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Vægtudvikling</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{mockClient.startWeight}</p>
                  <p className="text-xs text-muted-foreground">Start</p>
                </div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full gold-gradient rounded-full"
                    style={{ width: `${((mockClient.startWeight - mockClient.currentWeight) / (mockClient.startWeight - mockClient.goalWeight)) * 100}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{mockClient.currentWeight}</p>
                  <p className="text-xs text-muted-foreground">Nu</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{mockClient.goalWeight}</p>
                  <p className="text-xs text-muted-foreground">Mål</p>
                </div>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Seneste check-ins</h3>
              <div className="grid gap-2">
                {mockCheckins.slice(0, 4).map(ci => (
                  <div key={ci.week} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-secondary px-2 py-1 rounded font-medium">Uge {ci.week}</span>
                      <span className="text-xs text-muted-foreground">{ci.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>{ci.weight} kg</span>
                      <span>{ci.kcal} kcal</span>
                      <span>{ci.workouts}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        ci.status === 'reviewed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {ci.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkins' && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Check-in historik</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Uge</th>
                    <th className="text-left py-2 font-medium">Dato</th>
                    <th className="text-right py-2 font-medium">Vægt</th>
                    <th className="text-right py-2 font-medium">Fedt%</th>
                    <th className="text-right py-2 font-medium">Kcal</th>
                    <th className="text-right py-2 font-medium">Træning</th>
                    <th className="text-right py-2 font-medium">Energi</th>
                    <th className="text-right py-2 font-medium">Søvn</th>
                    <th className="text-right py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCheckins.map(ci => (
                    <tr key={ci.week} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium">{ci.week}</td>
                      <td className="py-2.5 text-muted-foreground">{ci.date}</td>
                      <td className="py-2.5 text-right">{ci.weight}</td>
                      <td className="py-2.5 text-right">{ci.fat}%</td>
                      <td className="py-2.5 text-right">{ci.kcal}</td>
                      <td className="py-2.5 text-right">{ci.workouts}</td>
                      <td className="py-2.5 text-right">{ci.energy}/10</td>
                      <td className="py-2.5 text-right">{ci.sleep}/10</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          ci.status === 'reviewed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {ci.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && activeTab !== 'checkins' && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Denne sektion kommer snart...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
