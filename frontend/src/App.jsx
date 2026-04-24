import { useEffect, useState } from 'react';
import { getSummary, getInterfaces, getHourlyStats } from './api/interfaceApi';
import Toast from './components/Toast';
import RegisterModal from './components/RegisterModal';
import DetailModal from './components/DetailModal';
import DashboardPage  from './pages/DashboardPage';
import InterfacePage  from './pages/InterfacePage';
import MonitoringPage from './pages/MonitoringPage';
import ReprocessPage  from './pages/ReprocessPage';
import LogPage        from './pages/LogPage';
import SettingsPage   from './pages/SettingsPage';
import './index.css';

const TABS = [
  {key:'dashboard',  icon:'◉', label:'대시보드'},
  {key:'interfaces', icon:'⇄', label:'인터페이스'},
  {key:'monitor',    icon:'📡', label:'모니터링'},
  {key:'reprocess',  icon:'↺', label:'재처리'},
  {key:'logs',       icon:'≡', label:'로그·성능'},
  {key:'settings',   icon:'⚙', label:'설정'},
];

export default function App() {
  const [tab, setTab]             = useState('dashboard');
  const [summary, setSummary]     = useState({total:0,normal:0,error:0,pending:0,running:0});
  const [interfaces, setIfaces]   = useState([]);
  const [showReg, setShowReg]     = useState(false);
  const [selectedIface, setSelectedIface] = useState(null);
  const [toast, setToast]         = useState({message:'',type:''});
  const [hourlyStats, setHourlyStats] = useState([]);
  const [initFilter, setInitFilter] = useState('');
  const [monitorRefresh, setMonitorRefresh] = useState(0);

  // 페이지 이동 + 필터 동시에
  const goWithFilter = (tab, filter = '') => {
  setInitFilter(filter);
  setTab(tab);
  };

  const load = async () => {
    const [s, i, h] = await Promise.all([
      getSummary(),
      getInterfaces(),
      getHourlyStats()
    ]);
    setSummary(s.data);
    setIfaces(i.data);
    setHourlyStats(h.data);
  };

  useEffect(()=>{ load(); },[]);

  const showToast = (message, type='') => setToast({message, type});

  return (
    <>
      {/* Top Nav */}
      <nav className="topbar">
        <div className="logo" onClick={()=>setTab('dashboard')}>
          <div className="logo-icon">🏦</div>
          <div>
            <div className="logo-text">IF·IMS</div>
            <div className="logo-sub">Insurance Financial Interface Mgmt.</div>
          </div>
        </div>
        <div className="nav-tabs">
          {TABS.map(t=>(
            <button key={t.key} className={`nav-tab ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
              <span className="tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div className="topbar-right">
          <div className="badge-live"><span className="live-dot"/> LIVE</div>
          <button className="btn-primary btn-sm" onClick={()=>setShowReg(true)}>+ 인터페이스 등록</button>
        </div>
      </nav>

      {/* Pages */}
      {tab==='dashboard' && <DashboardPage summary={summary} interfaces={interfaces} hourlyStats={hourlyStats} onTabChange={setTab} onSelectIface={setSelectedIface} onGoWithFilter={goWithFilter} />}
      {tab==='interfaces' && <InterfacePage interfaces={interfaces} onRefresh={load} onRegizster={()=>setShowReg(true)} showToast={showToast} initFilter={initFilter} />}  
      {tab==='monitor' && <MonitoringPage hourlyStats={hourlyStats} interfaces={interfaces}  onSelectIface={setSelectedIface} showToast={showToast} refreshKey={monitorRefresh}/>}
      {tab==='reprocess'  && <ReprocessPage  interfaces={interfaces} onRefresh={load} showToast={showToast} />}
      {tab==='logs' && <LogPage interfaces={interfaces} onSelectIface={setSelectedIface} />}
      {tab==='settings'   && <SettingsPage />}

      {/* Modals */}
      {showReg && <RegisterModal onClose={()=>setShowReg(false)} onCreated={load} showToast={showToast} />}
      {selectedIface && <DetailModal iface={selectedIface} onClose={()=>setSelectedIface(null)} onRefresh={()=>{ load(); setMonitorRefresh(p => p + 1); }} showToast={showToast} />}
      {/* Toast */}
      <Toast message={toast.message} type={toast.type} onHide={()=>setToast({message:'',type:''})} />
    </>
  );
}