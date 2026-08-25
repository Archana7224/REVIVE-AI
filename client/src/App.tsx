/* REVIVE AI — Signal Paper: Swiss editorial fintech shell, cobalt action signal, calm operational density. */
import { useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CircleHelp,
  Command,
  CreditCard,
  Database,
  FileSearch,
  Gauge,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Revenue Leaks", href: "/revenue-leaks", icon: BarChart3, group: "Revenue" },
  { label: "Recovery Center", href: "/recovery", icon: WalletCards, group: "Revenue" },
  { label: "Simulator", href: "/simulator", icon: Gauge, group: "Revenue" },
  { label: "Agent", href: "/agent", icon: Bot, group: "AI" },
  { label: "Audit Trail", href: "/audit", icon: FileSearch, group: "AI" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return <div className="flex items-center gap-3"><img src="/manus-storage/revive-logo_3c65231e.png" className="h-8 w-8 object-contain" alt="REVIVE mark" /><span className={`font-display text-[15px] font-bold tracking-[-0.04em] text-ink ${collapsed ? "hidden" : "block"}`}>REVIVE <span className="font-normal text-cobalt">AI</span></span></div>;
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: { collapsed: boolean; setCollapsed: (v: boolean) => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const groups = ["Overview", "Revenue", "AI", "System"];
  return <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-paper px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${collapsed ? "lg:w-[78px]" : "lg:w-[248px]"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
    <div className="flex items-center justify-between px-2"><Logo collapsed={collapsed} /><button onClick={() => setMobileOpen(false)} className="icon-button lg:hidden"><X size={17} /></button></div>
    <div className="mt-10 space-y-6 overflow-y-auto">
      {groups.map(group => <div key={group}><div className={`eyebrow px-3 ${collapsed ? "lg:hidden" : ""}`}>{group}</div><div className="mt-2 space-y-1">{nav.filter(item => item.group === group).map(item => { const active = location === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href}><a onClick={() => setMobileOpen(false)} className={`nav-item ${active ? "nav-item-active" : ""} ${collapsed ? "lg:justify-center lg:px-0" : ""}`}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>{active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cobalt" />}</a></Link>})}</div></div>)}
    </div>
    <div className={`mt-auto border-t border-line pt-4 ${collapsed ? "lg:px-0" : ""}`}>
      <div className="status-row"><span className="status-dot bg-cobalt" /><span className={collapsed ? "lg:hidden" : ""}>Razorpay Test Mode</span></div>
      <div className="status-row mt-2"><span className="status-dot bg-mint-strong" /><span className={collapsed ? "lg:hidden" : ""}>AI Agent Online</span></div>
      <button onClick={() => setCollapsed(!collapsed)} className="mt-5 hidden w-full items-center justify-center gap-2 rounded-md border border-line py-2 text-xs text-muted transition hover:border-cobalt hover:text-cobalt lg:flex">{collapsed ? <PanelLeftOpen size={15} /> : <><PanelLeftClose size={15} /> Collapse</>}</button>
    </div>
  </aside>;
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  return <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-line bg-paper/90 px-5 backdrop-blur-md lg:px-8"><div className="flex items-center gap-3"><button onClick={onMenu} className="icon-button lg:hidden"><Menu size={19} /></button><div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span className="font-medium text-ink">Acme Commerce</span><span className="text-line">/</span><span>Revenue operations</span></div><div className="flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-dark"><span className="h-1.5 w-1.5 rounded-full bg-amber" /> Test mode</div></div><div className="flex items-center gap-2"><button className="search-box hidden md:flex"><Search size={15} /><span>Search</span><kbd>⌘ K</kbd></button><button className="icon-button"><Bell size={17} /><span className="notification-dot" /></button><div className="ml-2 flex items-center gap-2 border-l border-line pl-3"><div className="avatar">AS</div><div className="hidden text-left sm:block"><div className="text-xs font-semibold text-ink">Aarav Shah</div><div className="text-[10px] text-muted">Admin</div></div><ChevronDown size={14} className="text-muted" /></div></div></header>;
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="min-h-screen bg-paper"><Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /><div className={`transition-[padding] duration-200 lg:pl-[248px] ${collapsed ? "lg:pl-[78px]" : ""}`}><Topbar onMenu={() => setMobileOpen(true)} /><main className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8"><Switch><Route path="/" component={Home} /><Route path="/dashboard" component={Home} /><Route path="/revenue-leaks" component={Home} /><Route path="/recovery" component={Home} /><Route path="/simulator" component={Home} /><Route path="/agent" component={Home} /><Route path="/audit" component={Home} /><Route path="/settings" component={Home} /><Route component={NotFound} /></Switch></main></div></div>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><Toaster /><AppLayout /></ThemeProvider></ErrorBoundary>; }
