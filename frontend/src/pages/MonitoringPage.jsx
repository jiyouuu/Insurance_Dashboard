import { useEffect, useState } from 'react';
import { getAllLogs, getInterfaces } from '../api/interfaceApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
const hours = Array.from({length:24},(_,i)=>String(i).padStart(2,'0'));
const errRates=[0.2,0.1,0,0,0,0.1,0.3,5.2,0.8,0.4,0.3,0.2,0.3,0.4,0.2,0.3,0.4,0.2,0.1,0.2,0.1,0.3,0.1,0.2];
const errData = hours.map((h,i)=>({h:`${h}:00`,v:errRates[i]}));
const protoData = [{name:'REST',v:18420},{name:'SFTP',v:3240},{name:'SOAP',v:2810},{name:'MQ',v:360}];
const protoColors = {'REST':'#58a6ff','SFTP':'#bc8cff','SOAP':'#d29922','MQ':'#3fb950'};

export default function MonitoringPage() {
  const [logs, setLogs]     = useState([]);
  const [ifaces, setIfaces] = useState([]);

  useEffect(()=>{
    getAllLogs().then(r=>setLogs(r.data));
    getInterfaces().then(r=>setIfaces(r.data));
  },[]);

  const perfItems = ifaces.map(i=>{
    const il = logs.filter(l => Number(l.interfaceId) === Number(i.id));
    const avg = il.length ? Math.round(il.reduce((s,l)=>s+l.durationMs,0)/il.length) : 0;
    const pct = Math.min(100, Math.round(avg/10));
    const color = avg<200?'var(--green)':avg<400?'var(--orange)':'var(--red)';
    return {name:i.name, avg, pct, color};
  }).slice(0,6);

  const alerts = [
    {type:'error', title:'제휴병원 청구 수신 - SFTP 인증 실패', desc:'SSH key 불일치로 연결 실패. 즉시 확인 필요.'},
    {type:'error', title:'재보험 데이터 교환 - API 503 오류', desc:'Swiss Re 서버 과부하. 자동 재처리 대기 중.'},
    {type:'warn',  title:'신용정보 조회 - 응답시간 경고', desc:'평균 응답시간 450ms. 임계값(300ms) 초과.'},
    {type:'info',  title:'정산 배치 처리 완료', desc:'오늘 00:00 배치 정상 완료. 총 12,481건 처리.'},
  ];

  return (
    <div className="page">
      <div className="section-header"><h2>실시간 모니터링</h2></div>
      <div className="monitor-grid">
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">성능 현황 (평균 응답시간)</div>
          {perfItems.map(p=>(
            <div key={p.name} className="perf-item">
              <div className="perf-name" style={{width:130,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
              <div className="perf-bar-wrap"><div className="perf-bar" style={{width:`${p.pct}%`,background:p.color}} /></div>
              <div className="perf-val" style={{color:p.color}}>{p.avg}ms</div>
            </div>
          ))}
        </div>
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">알림 현황</div>
          {alerts.map((a,i)=>(
            <div key={i} className={`alert-item alert-${a.type}`}>
              <div className="alert-title">{a.title}</div>
              <div className="alert-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="monitor-grid">
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">시간별 오류율 (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={errData} margin={{top:0,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,.6)" />
              <XAxis dataKey="h" tick={{fill:'#6e7681',fontSize:10}} interval={3} />
              <YAxis tick={{fill:'#6e7681',fontSize:10}} />
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} formatter={v=>[`${v}%`,'오류율']} />
              <Line type="monotone" dataKey="v" stroke="#f85149" strokeWidth={2} dot={{r:2}} fill="rgba(248,81,73,.1)" />
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
                {protoData.map(p=><Cell key={p.name} fill={protoColors[p.name]||'#58a6ff'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

