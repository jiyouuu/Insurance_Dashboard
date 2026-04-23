import { useEffect, useState, useRef } from 'react';
import { getAllLogs, getInterfaces, getAlerts } from '../api/interfaceApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const protoData = [{name:'REST',v:18420},{name:'SFTP',v:3240},{name:'SOAP',v:2810},{name:'MQ',v:360},{name:'BATCH',v:1240},{name:'FTP',v:180}];
const protoColors = {'REST':'#58a6ff','SFTP':'#bc8cff','SOAP':'#d29922','MQ':'#3fb950','BATCH':'#f85149','FTP':'#ff9500'};

// ── 원형 게이지 컴포넌트 ──
function CircleGauge({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#3fb950' : score >= 60 ? '#d29922' : '#f85149';
  const label = score >= 80 ? '양호' : score >= 60 ? '주의' : '위험';
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <svg width={140} height={140}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--bg3)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{transform:'rotate(-90deg)',transformOrigin:'70px 70px',transition:'stroke-dashoffset 1s ease'}}
        />
        <text x={70} y={64} textAnchor="middle" fill={color} fontSize={28} fontWeight={700} fontFamily="IBM Plex Mono">{score}</text>
        <text x={70} y={84} textAnchor="middle" fill="var(--text2)" fontSize={13}>{label}</text>
      </svg>
      <div style={{fontSize:11,color:'var(--text3)',fontFamily:'IBM Plex Mono',letterSpacing:1}}>HEALTH SCORE</div>
    </div>
  );
}

// ── SLA 게이지 바 ──
function SlaBar({ label, value, target, unit, good }) {
  const isGood = good ? value >= target : value <= target;
  const color = isGood ? 'var(--green)' : 'var(--red)';
  const pct = good ? Math.min(100, (value / (target * 1.2)) * 100) : Math.min(100, (value / (target * 2)) * 100);
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12}}>
        <span style={{color:'var(--text2)'}}>{label}</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontFamily:'IBM Plex Mono',fontWeight:700,color}}>{value}{unit}</span>
          <span style={{fontSize:10,color:'var(--text3)',fontFamily:'IBM Plex Mono'}}>목표 {target}{unit}</span>
        </div>
      </div>
      <div style={{height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 1s ease'}} />
      </div>
    </div>
  );
}

export default function MonitoringPage({ hourlyStats,interfaces, onSelectIface, showToast }) {
  const [logs, setLogs]     = useState([]);
  const [ifaces, setIfaces] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);
  const countRef    = useRef(null);
  const [showAllPerf, setShowAllPerf] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [perfTab, setPerfTab] = useState('worst'); // 'worst' | 'best'

 
  const handleAlertClick = (alert) => {
    const iface = interfaces.find(i => i.name === alert.iface);
    if (!iface) return;

    if (alert.type === 'error' && iface.status !== 'ERROR') {
      showToast(`'${iface.name}' 상태가 이미 복구되었습니다 ✓`, 'success');
      return;
    }
    onSelectIface(iface);
  };
  const fetchData = async () => {
    const [l, i, a] = await Promise.all([
      getAllLogs(), getInterfaces(), getAlerts()
    ]);
    setLogs(l.data);
    setIfaces(i.data);
    setAlerts(a.data);
    setLastUpdated(new Date());
    setCountdown(30);
  };

  useEffect(() => {
    fetchData();
    // 30초마다 자동 새로고침
    intervalRef.current = setInterval(fetchData, 30000);
    // 카운트다운
    countRef.current = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 30 : prev - 1);
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countRef.current);
    };
  }, []);

  // ── 헬스 스코어 계산 ──
  const total   = ifaces.length || 1;
  const errorCnt   = ifaces.filter(i => i.status === 'ERROR').length;
  const normalCnt  = ifaces.filter(i => i.status === 'NORMAL').length;
  // SUCCESS + INFO + WARN = 성공으로 보는 것
  const successLogs = logs.filter(l => l.result !== 'FAILURE').length;
  const failLogs    = logs.filter(l => l.result === 'FAILURE').length;
  const totalLogs   = logs.length || 1;
  const avgMs = logs.length ? Math.round(logs.reduce((s,l)=>s+l.durationMs,0)/logs.length) : 0;
  const successRate = Math.round((successLogs / totalLogs) * 100);
  const errorRate   = Math.round((failLogs / totalLogs) * 100 * 10) / 10;
  const normalRate  = Math.round((normalCnt / total) * 100);

  // 헬스 스코어
  const msScore = avgMs < 300 ? 100 : avgMs < 500 ? 75 : avgMs < 700 ? 50 : 30;
  const recentLogs = logs.slice(0, 50); // 최근 50개만
  const recentSuccess = recentLogs.filter(l => l.result !== 'FAILURE').length;
  const recentSuccessRate = recentLogs.length ? Math.round(recentSuccess / recentLogs.length * 100) : 100;

  const healthScore = Math.round(
    recentSuccessRate * 0.5 +   // 최근 성공률 50% (제일 민감)
    normalRate        * 0.3 +   // 정상률 30%
    msScore           * 0.2     // 응답시간 20%
  );

  // ── 성능 현황 ──
  const perfAll = ifaces.map(i => {
  const il = logs.filter(l => Number(l.interfaceId) === Number(i.id));
  const avg = il.length ? Math.round(il.reduce((s,l)=>s+l.durationMs,0)/il.length) : 0;
  const pct = Math.min(100, Math.round(avg / 10));
  const color = avg < 300 ? 'var(--green)' : avg < 550 ? 'var(--orange)' : 'var(--red)';
  return {name: i.name, avg, pct, color};
  }).filter(p => p.avg > 0)
  .sort((a,b) => b.avg - a.avg);
const worst = perfAll.slice(0, 10);    // 느린 10개
const best  = perfAll.slice(-10);      // 빠른 10개
const perfItems = [...worst, ...best]; // 기본 20개


// 전체 보기는 상위 50개만
const perfMore = perfAll.slice(0, 50);

  // ── 오류율 차트 ──
  const errData = hourlyStats.map(h => ({
    h: `${String(h.hour).padStart(2,'0')}:00`,
    v: h.errorRate
  }));

  return (
    <div className="page">
      {/* 헤더 + LIVE */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:500}}>실시간 모니터링</h2>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontSize:11,color:'var(--text3)',fontFamily:'IBM Plex Mono'}}>
            마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
          </span>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'5px 12px'}}>
            <span className="live-dot" />
            <span style={{fontSize:11,color:'var(--green)',fontFamily:'IBM Plex Mono',fontWeight:700}}>LIVE</span>
            <span style={{fontSize:11,color:'var(--text3)',fontFamily:'IBM Plex Mono'}}>
              {countdown}s 후 갱신
            </span>
          </div>
          <button className="btn-ghost btn-sm" onClick={fetchData}>↺ 지금 새로고침</button>
        </div>
      </div>

    {/* 헬스 스코어 + SLA */}
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:16, marginBottom:16}}>
      <div className="chart-card" style={{marginBottom:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px'}}>
        <CircleGauge score={healthScore} />
        <div style={{marginTop:10, textAlign:'center'}}>
          <div style={{fontSize:11, color:'var(--text3)', lineHeight:1.6}}>
            정상률 · 성공률 · 응답시간<br/>종합 시스템 건강도
          </div>
        </div>
      </div>
      <div className="chart-card" style={{marginBottom:0}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
          <div className="card-title" style={{marginBottom:0}}>SLA 달성 현황</div>
          <span style={{fontSize:10, color:'var(--text3)', fontFamily:'IBM Plex Mono'}}>Service Level Agreement</span>
        </div>
        <div style={{fontSize:11, color:'var(--text3)', marginBottom:16}}>시스템이 약속한 품질 기준 달성 여부</div>
        <SlaBar label="시스템 정상률"  value={normalRate}   target={80}  unit="%" good={true} />
        <SlaBar label="요청 성공률"    value={successRate}  target={90}  unit="%" good={true} />
        <SlaBar label="평균 응답시간"  value={avgMs}        target={600} unit="ms" good={false} />
        <SlaBar label="오류율"         value={errorRate}    target={15}  unit="%" good={false} />
      </div>
    </div>

      {/* 성능 현황 + 알림 */}
      <div className="monitor-grid">
        <div className="chart-card" style={{marginBottom:0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <div className="card-title" style={{marginBottom:0}}>응답시간 현황</div>
            <div style={{display:'flex', gap:4}}>
              <button
                className={`btn-ghost btn-sm`}
                style={perfTab==='worst' ? {background:'var(--red)',color:'#fff',border:'none'} : {}}
                onClick={() => setPerfTab('worst')}
              >
                🔴 느린 순
              </button>
              <button
                className={`btn-ghost btn-sm`}
                style={perfTab==='best' ? {background:'var(--green)',color:'#fff',border:'none'} : {}}
                onClick={() => setPerfTab('best')}
              >
                🟢 빠른 순
              </button>
            </div>
          </div>
          {(perfTab === 'worst' ? perfAll.slice(0,10) : [...perfAll].reverse().slice(0,10)).map(p => (
            <div key={p.name} className="perf-item">
              <div className="perf-name" style={{width:140,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
              <div className="perf-bar-wrap"><div className="perf-bar" style={{width:`${p.pct}%`,background:p.color}} /></div>
              <div className="perf-val" style={{color:p.color}}>{p.avg}ms</div>
            </div>
          ))}
        </div>

        <div className="chart-card" style={{marginBottom:0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <div className="card-title" style={{marginBottom:0}}>알림 현황</div>
            {alerts.length > 4 &&
              <button className="btn-ghost btn-sm" onClick={() => setShowAllAlerts(p => !p)}>
                {showAllAlerts ? '접기 ↑' : `전체 보기 (${alerts.length}) ↓`}
              </button>
            }
          </div>
          {alerts.length === 0
            ? <div className="empty-state">알림 없음 ✅</div>
            : (showAllAlerts ? alerts : alerts.slice(0,4)).map((a, i) => (
              <div
                key={i}
                className={`alert-item alert-${a.type}`}
                onClick={() => handleAlertClick(a)}
                style={{cursor:'pointer', transition:'opacity .15s'}}
                onMouseEnter={e => e.currentTarget.style.opacity='.75'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <div className="alert-title">
                      {a.type==='error'?'🔴':a.type==='warn'?'🟡':'🔵'} {a.title}
                    </div>
                    <div className="alert-desc">{a.desc}</div>
                  </div>
                  <span style={{fontSize:10,color:'var(--text3)',fontFamily:'IBM Plex Mono',whiteSpace:'nowrap',marginLeft:12,marginTop:2}}>
                    {a.type==='error' ? '재처리 →' : '상세 →'}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* 차트 */}
      <div className="monitor-grid">
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">시간별 오류율 (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={errData} margin={{top:0,right:10,left:-15,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,.6)" />
              <XAxis dataKey="h" tick={{fill:'#6e7681',fontSize:10}} interval={3} />
              <YAxis tick={{fill:'#6e7681',fontSize:10}} />
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} formatter={v=>[`${v}%`,'오류율']} />
              <Line type="monotone" dataKey="v" stroke="#f85149" strokeWidth={2} dot={{r:2}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">프로토콜별 처리량</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={protoData} layout="vertical" margin={{top:0,right:20,left:10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,.6)" horizontal={false} />
              <XAxis type="number" tick={{fill:'#6e7681',fontSize:10}} />
              <YAxis type="category" dataKey="name" tick={{fill:'var(--text)',fontSize:12}} width={40} />
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} formatter={v=>[`${v.toLocaleString()}건`,'처리량']} />
              <Bar dataKey="v" radius={[0,4,4,0]} name="처리량">
                {protoData.map(p => <Cell key={p.name} fill={protoColors[p.name]||'#58a6ff'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}