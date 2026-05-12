/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  LayoutGrid,
  Activity, 
  Zap, 
  TrendingUp, 
  CloudSun, 
  Settings, 
  Bell, 
  Download, 
  Sun, 
  Battery, 
  AlertTriangle, 
  ChevronRight,
  Menu,
  X,
  User,
  Clock,
  Thermometer,
  CloudLightning,
  BarChart3,
  Search,
  CheckCircle2,
  Moon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface GenerationPoint {
  time: string;
  generation: number;
  forecast: number;
  temp: number;
  consumption: number;
}

interface Panel {
  id: string;
  name: string;
  status: 'Active' | 'Charging' | 'Maintenance' | 'Faulty';
  engineers: string[];
  irradiance: number;
  energy: string;
  battery: number;
  temperature: number;
  healthIssue?: 'Low Energy' | 'Needs Cleaning' | 'Cell Failure' | 'None';
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  time: string;
}

// --- Mock Data Generator ---
const generateData = (points: number = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    const day = time.getDay();
    
    // Seasonal and diurnal patterns
    const diurnal = hour > 6 && hour < 18 ? Math.sin((hour - 6) * Math.PI / 12) : 0;
    const seasonal = 1 + 0.2 * Math.sin(time.getMonth() * Math.PI / 6);
    
    const baseGen = 500 * diurnal * seasonal;
    const noise = Math.random() * 50 * (diurnal + 0.1);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generation: Math.max(0, baseGen + noise),
      forecast: Math.max(0, baseGen * 0.98 + (Math.random() - 0.5) * 20),
      temp: 15 + (diurnal * 15) + (Math.random() * 5),
      consumption: 200 + (Math.random() * 150) + (hour > 17 || hour < 8 ? 100 : 0)
    });
  }
  return data;
};

// Generate 5000 points for "Big Data" simulation
const INITIAL_DATA = generateData(2000);

// Generate 100 panels for large-scale asset management
const GENERATE_PANELS = (): Panel[] => {
  const panels: Panel[] = [];
  const prefixes = ['AH', 'LO', 'DE', 'HT', 'XK', 'TR'];
  const statuses: Panel['status'][] = ['Active', 'Active', 'Active', 'Charging', 'Maintenance', 'Faulty'];
  const issues: Panel['healthIssue'][] = ['None', 'None', 'None', 'None', 'Low Energy', 'Needs Cleaning', 'Cell Failure'];

  for (let i = 1; i <= 100; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const issue = status === 'Active' || status === 'Charging' ? issues[Math.floor(Math.random() * issues.length)] : (status === 'Maintenance' ? 'Cell Failure' : 'Low Energy');
    
    panels.push({
      id: i.toString(),
      name: `${prefix}-${Math.floor(Math.random() * 9 + 1)}x${Math.floor(Math.random() * 9 + 1)}`,
      status: status,
      engineers: [`E${Math.floor(Math.random() * 20 + 1)}`, `E${Math.floor(Math.random() * 20 + 1)}`],
      irradiance: Number((Math.random() * 200).toFixed(2)),
      energy: `${(Math.random() * 100 + 10).toFixed(2)}Wh`,
      battery: Math.floor(Math.random() * 100),
      temperature: Number((30 + Math.random() * 15).toFixed(1)),
      healthIssue: issue
    });
  }
  return panels;
};

const PANELS = GENERATE_PANELS();

const MOCK_ALERTS: Alert[] = [
  { id: '1', type: 'warning', message: 'Low voltage detected in Panel Cluster B4', time: '10 mins ago' },
  { id: '2', type: 'error', message: 'Inverter #02 critical failure - System bypass active', time: '2 hrs ago' },
  { id: '3', type: 'success', message: 'Daily generation target reached', time: '24 mins ago' },
  { id: '4', type: 'info', message: 'Routine maintenance scheduled for May 15', time: '1 day ago' },
];

// --- Components ---

const Gauge = ({ label, value, unit, color, status }: { label: string, value: number, unit: string, color: string, status: string }) => (
  <div className="glass-card p-6 flex flex-col items-center text-center">
    <div className="relative w-32 h-32 mb-4">
      {/* Background track */}
      <svg className="w-full h-full -rotate-90">
        <circle 
          cx="64" cy="64" r="54" 
          fill="transparent" 
          stroke="var(--border-color)" 
          strokeWidth="10" 
          strokeDasharray="339.29" 
          strokeDashoffset="101.78"
          strokeLinecap="round"
        />
        <motion.circle 
          initial={{ strokeDashoffset: 339.29 }}
          animate={{ strokeDashoffset: 339.29 - (339.29 - 101.78) * (value / 100) }}
          cx="64" cy="64" r="54" 
          fill="transparent" 
          stroke={color} 
          strokeWidth="10" 
          strokeDasharray="339.29" 
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-display text-[var(--text-primary)]">{value}%</span>
        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{status}</span>
      </div>
    </div>
    <h3 className="text-sm font-bold text-[var(--text-secondary)]">{label}</h3>
    <p className="text-xs text-[var(--text-primary)] font-mono mt-1">{value} {unit}</p>
  </div>
);

const ProgressBarRow = ({ label, value, unit, percentage, color }: { label: string, value: string, unit: string, percentage: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-medium">
      <span className="text-[var(--text-secondary)]">{label} - {percentage}%</span>
      <span className="text-[var(--text-primary)]">{value} {unit}</span>
    </div>
    <div className="w-full h-2 bg-[var(--border-color)]/30 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn("h-full", color)}
      />
    </div>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
      active 
        ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20" 
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]"
    )}
  >
    <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "text-brand-cyan")} />
    <span>{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-cyan glow-cyan" />}
  </button>
);

const MetricCard = ({ title, value, unit, trend, icon: Icon, color }: { title: string, value: string, unit: string, trend: string, icon: any, color: string }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="glass-card glass-card-hover p-6 flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className={cn(
        "text-xs font-medium px-2 py-1 rounded-full",
        trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
      )}>
        {trend}
      </span>
    </div>
    <div>
      <h3 className="text-[var(--text-secondary)] text-sm font-medium">{title}</h3>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-display font-bold text-[var(--text-primary)]">{value}</span>
        <span className="text-xs text-[var(--text-muted)] font-mono">{unit}</span>
      </div>
    </div>
    <div className="w-full bg-[var(--border-color)]/30 h-1.5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '70%' }}
        className={cn("h-full", color)}
      />
    </div>
  </motion.div>
);

export default function App() {
  const [data, setData] = useState<GenerationPoint[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Sync theme with document element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const dataTimer = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        const nextHour = (parseInt(last.time.split(':')[0]) + 1) % 24;
        const baseGen = nextHour > 6 && nextHour < 18 ? Math.sin((nextHour - 6) * Math.PI / 12) * 500 : 0;
        const noise = Math.random() * 20;
        
        newData.push({
          time: `${nextHour.toString().padStart(2, '0')}:00`,
          generation: Math.max(0, baseGen + noise),
          forecast: Math.max(0, baseGen * 0.95 + Math.random() * 30),
          temp: 20 + Math.sin((nextHour - 4) * Math.PI / 12) * 10 + Math.random() * 2
        });
        
        return newData.slice(-24);
      });
    }, 5000);
    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const stats = useMemo(() => {
    const current = data[data.length - 1].generation;
    const avg = data.reduce((acc, curr) => acc + curr.generation, 0) / data.length;
    return {
      current: current.toFixed(1),
      dailyTotal: (avg * 24).toFixed(0),
      peak: Math.max(...data.map(d => d.generation)).toFixed(1),
      efficiency: (84.5 + Math.random() * 2).toFixed(1)
    };
  }, [data]);

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden font-sans transition-colors duration-300">
      {/* --- Sidebar --- */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] shrink-0 flex flex-col relative z-30"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="p-2 bg-brand-cyan rounded-lg shadow-lg shadow-brand-cyan/20">
                <CloudLightning className="text-white w-6 h-6" />
              </div>
              <h1 className="font-display font-bold text-xl tracking-tight text-[var(--text-primary)]">
                SK POWER <span className="text-brand-cyan font-light italic">CORE</span>
              </h1>
            </div>

            <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
              <SidebarItem icon={LayoutGrid} label="Asset Tracking" active={activeTab === 'Asset Tracking'} onClick={() => setActiveTab('Asset Tracking')} />
              <SidebarItem icon={TrendingUp} label="Forecasting" active={activeTab === 'Forecasting'} onClick={() => setActiveTab('Forecasting')} />
              <SidebarItem icon={Zap} label="Peak Analysis" active={activeTab === 'Peak Analysis'} onClick={() => setActiveTab('Peak Analysis')} />
              <SidebarItem icon={BarChart3} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
              <SidebarItem icon={Bell} label="Security" active={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />
              <SidebarItem icon={Settings} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />

              <div className="mt-8 px-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-muted)]">System Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-medium whitespace-nowrap">ONLINE</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Grid Load</span>
                    <span className="text-[var(--text-primary)] font-mono">1.2 GW</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Carbon Saved</span>
                    <span className="text-[var(--text-primary)] font-mono">24.5k Tons</span>
                  </div>
                </div>
              </div>
            </nav>

            <div className="p-4 mt-auto border-t border-[var(--border-color)]">
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center border-2 border-[var(--border-color)]">
                  <User className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Shaikh Ramjan</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Admin Specialist</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-[var(--bg-main)]">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-8 py-4 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition-colors text-[var(--text-secondary)]"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div>
              <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">{activeTab}</h2>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Real-time Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-brand-cyan transition-colors" />
              <input 
                placeholder="Search panels, alerts..." 
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-brand-cyan/50 focus:ring-4 focus:ring-brand-cyan/10 transition-all w-64 text-[var(--text-primary)]"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-brand-cyan/50 transition-all shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Weather</span>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-tighter">Sunny • 28°C</span>
                </div>
                <div className="p-2 bg-brand-amber/10 rounded-full border border-brand-amber/20">
                  <CloudSun className="text-brand-amber w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
          {activeTab === 'Dashboard' && (
            <div className="space-y-8">
              {/* Gauges Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Gauge label="Solar Efficiency" value={60} unit="%" color="#10b981" status="High" />
                <Gauge label="Power Generation" value={6.5} unit="Kw" color="#f59e0b" status="Moderate" />
                <Gauge label="Energy Consumed" value={79.13} unit="KWh" color="#0ea5e9" status="High" />
              </div>

              {/* Middle Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Monitoring */}
                <div className="glass-card p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Performance Monitoring</h3>
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-6 w-full">
                      <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Total Charging</p>
                        <p className="text-3xl font-display font-bold text-emerald-500">80.88</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">Min 3.0 • Max 6.0</p>
                      </div>
                      <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Power Usage</p>
                        <p className="text-3xl font-display font-bold text-[var(--text-primary)]">12.35</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">1 Hour usage 6.8 kwh</p>
                      </div>
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl border border-[var(--border-color)]">
                      <img 
                        src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=600&auto=format&fit=crop" 
                        alt="Solar panels" 
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 left-4 right-4 glass-card p-3 flex justify-between items-center bg-black/60 backdrop-blur-md border-white/10">
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">210 kWh</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-brand-cyan" />
                          <span className="text-xs font-bold text-white">178 kwh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Energy Consumption Detail */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-8">Home Energy Consumption</h3>
                  <div className="space-y-6">
                    <ProgressBarRow label="Meter Power" value="0.8" unit="kw" percentage={50} color="bg-brand-cyan" />
                    <ProgressBarRow label="Meter Energy" value="2.656" unit="kw" percentage={16} color="bg-emerald-500" />
                    <ProgressBarRow label="Utility Meter Uptime" value="75d 4h 25m" unit="" percentage={34} color="bg-brand-amber" />
                  </div>
                  <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Tariff Settings</h4>
                      <button className="text-[10px] uppercase font-bold text-brand-cyan">View Settings</button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Standard Tariff</span>
                        <span className="text-[var(--text-primary)] font-mono">12.8 kwh</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Meter Energy</span>
                        <span className="text-[var(--text-primary)] font-mono">1.56 USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Energy Consumption History */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Energy Consumption</h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-color)]">Yearly</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.slice(0, 12)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                        <Line type="monotone" dataKey="consumption" stroke="#0ea5e9" strokeWidth={3} dot={false} animationDuration={1000} />
                        <Line type="monotone" dataKey="generation" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Panel Location Status */}
                <div className="glass-card p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Pimpri Chinchwad, India</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Maharashtra Sector • 100 Active Units</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('Asset Tracking')}
                      className="text-[10px] uppercase font-bold text-brand-cyan hover:underline"
                    >
                      View Full Registry
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-[var(--border-color)] group">
                        <img 
                          src={`https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=200&auto=format&fit=crop&sig=${i}`} 
                          alt="Cluster" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Massive Information Table Section */}
              <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-[var(--border-color)]">
                  <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">Panel Diagnostics Information</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Detailed real-time metrics and health diagnostics for every unit.</p>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Name</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Engineers</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Irradiance</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Energy</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Battery</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Temperature</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Health Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/30">
                      {PANELS.map((panel) => (
                        <tr key={panel.id} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                          <td className="px-8 py-6 font-bold text-sm text-[var(--text-primary)]">{panel.name}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                              panel.status === 'Active' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                              panel.status === 'Charging' && "bg-brand-amber/10 text-brand-amber border border-brand-amber/20",
                              panel.status === 'Maintenance' && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                              panel.status === 'Faulty' && "bg-rose-500/10 text-rose-500 border border-rose-500/20",
                            )}>
                              {panel.status}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex -space-x-2">
                              {panel.engineers.map((e, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
                                  {e}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-[var(--text-primary)] font-mono">{panel.irradiance}</td>
                          <td className="px-8 py-6 text-sm text-[var(--text-primary)] font-mono">{panel.energy}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-[var(--border-color)]/30 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${panel.battery}%` }} className={cn("h-full", panel.battery > 50 ? "bg-emerald-500" : "bg-brand-amber")} />
                              </div>
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">{panel.battery}%</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-[var(--text-primary)] font-mono">{panel.temperature}°C</td>
                          <td className="px-8 py-6">
                            {panel.healthIssue !== 'None' ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className={cn(
                                  "w-4 h-4",
                                  panel.healthIssue === 'Cell Failure' ? "text-rose-500" : "text-brand-amber"
                                )} />
                                <span className={cn(
                                  "text-xs font-bold",
                                  panel.healthIssue === 'Cell Failure' ? "text-rose-500" : "text-brand-amber"
                                )}>
                                  {panel.healthIssue}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-500">Optimal</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-bold text-[var(--text-primary)]">Yield Daily</h3>
                       <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-brand-cyan" />
                             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Yield Energy</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Exported Energy</span>
                          </div>
                       </div>
                    </div>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.slice(0, 10)}>
                             <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                             <XAxis dataKey="time" hide />
                             <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                             <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }} />
                             <Bar dataKey="generation" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                             <Bar dataKey="consumption" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="glass-card p-6 bg-gradient-to-br from-[var(--bg-card)] to-emerald-500/5">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Battery Status</h3>
                    <div className="flex flex-col items-center justify-center h-48 relative">
                       <div className="w-32 h-32 rounded-full border-8 border-emerald-500/20 border-t-emerald-500 animate-[spin_10s_linear_infinite]" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-display font-bold text-emerald-500">92%</span>
                          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Efficiency</span>
                       </div>
                    </div>
                    <div className="mt-8 space-y-4">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--text-secondary)]">Charge Level</span>
                          <span className="text-emerald-500 font-bold">Excellent</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-[var(--text-secondary)]">Cycle Count</span>
                          <span className="text-[var(--text-primary)] font-bold">142</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'Forecasting' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* AI Forecasting Module */}
              <section className="glass-card bg-gradient-to-br from-[var(--bg-card)] to-brand-cyan/5 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 blur-2xl">
                  <CloudLightning className="w-96 h-96 text-brand-cyan" />
                </div>
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-cyan text-xs font-bold uppercase tracking-widest mb-4">
                        <Zap className="w-3 h-3 animate-pulse" />
                        AI Forecasting Core
                      </div>
                      <h2 className="text-4xl font-display font-bold text-[var(--text-primary)] leading-tight">
                        Intelligent Solar <br />
                        Yield Prediction
                      </h2>
                      <p className="text-[var(--text-secondary)] mt-4 leading-relaxed max-w-lg">
                        Neural networks analyzing historical patterns, meteorological shifts, and panel degradation to provide 98% accurate week-ahead forecasts.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)] backdrop-blur-sm">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Confidence Score</p>
                        <p className="text-2xl font-mono font-bold text-brand-cyan">97.8%</p>
                      </div>
                      <div className="p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)] backdrop-blur-sm">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Weekly Forecast</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400">32.4 MW</p>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-cyan hover:opacity-90 text-white rounded-full font-semibold transition-all shadow-lg shadow-brand-cyan/20 hover:scale-105 group">
                      Generate Energy Report
                      <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="flex-1 w-full glass-card p-6 border-[var(--border-color)]">
                    <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-6 flex items-center justify-between">
                      Weekly Prediction Trend
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">Next 7 Days (Est.)</span>
                    </h4>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { day: 'Mon', val: 120 }, { day: 'Tue', val: 140 }, { day: 'Wed', val: 110 },
                          { day: 'Thu', val: 160 }, { day: 'Fri', val: 150 }, { day: 'Sat', val: 130 }, { day: 'Sun', val: 145 },
                        ]}>
                          <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'var(--accent-glow)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none' }} />
                          <Bar dataKey="val" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'Settings' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl"
            >
              <div className="glass-card p-8 sm:p-12">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                  <div>
                    <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">Settings</h3>
                    <p className="text-[var(--text-secondary)] mt-2">Manage your core interface and system preferences.</p>
                  </div>
                  <div className="bg-brand-cyan/10 px-4 py-2 rounded-xl border border-brand-cyan/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                      <span className="text-xs font-bold text-brand-cyan uppercase tracking-widest">Version 2.4.1 Peak</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-16">
                  {/* Theme Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Activity className="w-5 h-5 text-brand-cyan" />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Interface Theme</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setTheme('light')}
                        className={cn(
                          "group relative flex flex-col p-6 rounded-2xl border transition-all text-left",
                          theme === 'light' 
                            ? "bg-[var(--bg-card)] border-brand-cyan shadow-xl shadow-brand-cyan/5" 
                            : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                          theme === 'light' ? "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/30" : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] group-hover:scale-110"
                        )}>
                          <Sun className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-[var(--text-primary)] text-lg">Light Atmosphere</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Stark white interface optimized for high-brightness environments.</p>
                        {theme === 'light' && (
                          <motion.div layoutId="check" className="absolute top-6 right-6">
                            <CheckCircle2 className="w-6 h-6 text-brand-cyan" />
                          </motion.div>
                        )}
                      </button>

                      <button 
                        onClick={() => setTheme('dark')}
                        className={cn(
                          "group relative flex flex-col p-6 rounded-2xl border transition-all text-left",
                          theme === 'dark' 
                            ? "bg-[var(--bg-card)] border-brand-cyan shadow-xl shadow-brand-cyan/5" 
                            : "bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
                          theme === 'dark' ? "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/30" : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] group-hover:scale-110"
                        )}>
                          <Moon className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-[var(--text-primary)] text-lg">Deep Space</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Deep, absolute black interface for maximum focus and OLED efficiency.</p>
                        {theme === 'dark' && (
                          <motion.div layoutId="check" className="absolute top-6 right-6">
                            <CheckCircle2 className="w-6 h-6 text-brand-cyan" />
                          </motion.div>
                        )}
                      </button>
                    </div>
                  </section>

                  {/* Operational Settings (Mock) */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <Zap className="w-5 h-5 text-brand-cyan" />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Operational Controls</h4>
                    </div>
                    <div className="grid gap-4">
                      {[
                        { title: 'AI Yield Prediction', desc: 'Enable neural network forecasting for solar generation.', active: true },
                        { title: 'Thermal Safety Lock', desc: 'Auto-throttle output when panel temperature exceeds 45°C.', active: true },
                        { title: 'Grid Sync Mode', desc: 'Sync energy distribution with public utility fluctuations.', active: false }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]/30">
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{item.title}</p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">{item.desc}</p>
                          </div>
                          <button className={cn(
                            "w-14 h-7 rounded-full p-1 transition-all duration-300",
                            item.active ? "bg-brand-cyan" : "bg-[var(--text-muted)]/30"
                          )}>
                            <div className={cn(
                              "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300",
                              item.active ? "translate-x-7" : "translate-x-0"
                            )} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Asset Tracking' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="glass-card p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-[var(--text-primary)]">Industrial Asset Registry</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Live monitoring of all 100 power collection units</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-[10px] text-emerald-500 font-bold uppercase">Optimal</p>
                      <p className="text-lg font-bold text-emerald-500">82</p>
                    </div>
                    <div className="px-4 py-2 bg-brand-amber/10 border border-brand-amber/20 rounded-xl">
                      <p className="text-[10px] text-brand-amber font-bold uppercase">Warning</p>
                      <p className="text-lg font-bold text-brand-amber">12</p>
                    </div>
                    <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <p className="text-[10px] text-rose-500 font-bold uppercase">Critical</p>
                      <p className="text-lg font-bold text-rose-500">6</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[800px] overflow-y-auto custom-scrollbar border border-[var(--border-color)] rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Unit ID</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Status</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Engineers</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Efficiency</th>
                        <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Health Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/30">
                      {PANELS.map((panel) => (
                        <tr key={panel.id} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                          <td className="px-8 py-4 font-mono text-sm text-[var(--text-primary)]">{panel.name}</td>
                          <td className="px-8 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                              panel.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-amber/10 text-brand-amber"
                            )}>
                              {panel.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-xs text-[var(--text-secondary)]">{panel.engineers.join(', ')}</td>
                          <td className="px-8 py-4">
                            <div className="w-24 h-1.5 bg-[var(--border-color)]/30 rounded-full overflow-hidden">
                              <div className={cn("h-full", panel.battery > 70 ? "bg-emerald-500" : "bg-brand-amber")} style={{ width: `${panel.battery}%` }} />
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className={cn(
                              "text-xs font-bold",
                              panel.healthIssue === 'None' ? "text-emerald-500" : "text-brand-amber"
                            )}>
                              {panel.healthIssue === 'None' ? 'Optimal Performance' : panel.healthIssue}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Peak Analysis' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="glass-card p-8">
                <div className="mb-12">
                  <h3 className="text-3xl font-display font-bold text-[var(--text-primary)]">Peak Load Intelligence</h3>
                  <p className="text-[var(--text-secondary)] mt-2">Correlation analysis between solar peaks and industrial demand in the Pimpri Chinchwad grid.</p>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="h-96 glass-card p-6 border border-brand-cyan/20">
                    <h4 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">Efficiency Overload Sync</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.slice(0, 24)}>
                        <defs>
                          <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="generation" stroke="#0ea5e9" fill="url(#colorPeak)" />
                        <Area type="step" dataKey="consumption" stroke="#f59e0b" fill="transparent" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-8 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl">
                      <div className="w-10 h-10 bg-brand-cyan/20 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="text-brand-cyan w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Peak Amplitude</p>
                      <h5 className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">428.5 kW</h5>
                      <p className="text-xs text-brand-cyan font-bold mt-2">Reached at 13:42 IST</p>
                    </div>
                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Zap className="text-emerald-500 w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Grid Stability</p>
                      <h5 className="text-3xl font-display font-bold text-[var(--text-primary)] mt-1">98.2%</h5>
                      <p className="text-xs text-emerald-500 font-bold mt-2">Stable load distribution</p>
                    </div>
                    <div className="md:col-span-2 p-6 glass-card border border-[var(--border-color)]">
                       <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase mb-4">Anisotropy Index</h4>
                       <div className="flex gap-1 h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                          <div className="w-[40%] bg-brand-cyan" />
                          <div className="w-[30%] bg-emerald-500" />
                          <div className="w-[10%] bg-brand-amber" />
                          <div className="w-[20%] bg-rose-500" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'Security' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 glass-card p-8">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-8">System Event Logs</h3>
                <div className="space-y-4">
                  {MOCK_ALERTS.map((alert) => (
                    <div key={alert.id} className="p-6 rounded-2xl border border-[var(--border-color)] flex items-start gap-4 hover:shadow-lg transition-all">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        alert.type === 'error' ? "bg-rose-500/10 text-rose-500" : "bg-brand-amber/10 text-brand-amber"
                      )}>
                        {alert.type === 'error' ? <X className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-[var(--text-primary)] uppercase tracking-tight">{alert.type} Incident</p>
                          <span className="text-xs text-[var(--text-muted)]">{alert.time}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] font-bold text-sm hover:border-brand-cyan hover:text-brand-cyan transition-all">
                    Load Archive logs (Legacy Data)
                  </button>
                </div>
              </div>
              <div className="glass-card p-8 space-y-8">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Security Protocols</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Intrusion Detection</span>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">ACTIVE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Firewall Clusters</span>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded">ENCRYPTED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Automated Lockdown</span>
                    <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded">STANDBY</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Reports' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-5xl mx-auto space-y-12"
            >
              <div className="glass-card p-12 text-center bg-gradient-to-br from-[var(--bg-card)] to-brand-cyan/5">
                <BarChart3 className="w-16 h-16 text-brand-cyan mx-auto mb-6" />
                <h2 className="text-4xl font-display font-bold text-[var(--text-primary)]">Resource Intelligence Reports</h2>
                <p className="text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">Generate high-fidelity reports powered by the SK Power Core big data engine. Analysis covers panel degradation, grid load, and carbon offsets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'Yield Analytics', icon: Zap, desc: 'Detailed 48-hour power generation trend vs forecast.' },
                  { title: 'Health Audit', icon: Activity, desc: 'Full scan of all 100 panels and maintenance logs.' },
                  { title: 'Sustainability', icon: Sun, desc: 'Carbon offset metrics and green energy compliance.' }
                ].map((report, i) => (
                  <div key={i} className="glass-card p-8 group hover:border-brand-cyan transition-all">
                    <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <report.icon className="w-6 h-6 text-brand-cyan" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{report.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">{report.desc}</p>
                    <button className="flex items-center gap-2 text-brand-cyan font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                      Download PDF <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
