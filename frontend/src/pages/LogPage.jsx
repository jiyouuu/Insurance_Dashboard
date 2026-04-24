import { useEffect, useState } from 'react';
import { getAllLogs, getInterfaces } from '../api/interfaceApi';

const LEVELS = ['','INFO','ERROR','WARN','SUCCESS'];

export default function LogPage({ interfaces, onSelectIface }) {
  const [logs, setLogs]     = useState([]);
  const [ifaces, setIfaces] = useState([]);
  const [filterL, setFilterL] = useState('');
  const [filterI, setFilterI] = useState('');
  const [filterMsg, setFilterMsg] = useState('');
  useEffect(()=>{
    getAllLogs().then(r=>setLogs(r.data));
    getInterfaces().then(r=>setIfaces(r.data));
  },[]);

  // 로그에 level 추가 (result 기반)
  const enriched = logs.map(l=>({
    ...l,
   level: l.result === 'SUCCESS' ? 'SUCCESS'
     : l.result === 'FAILURE' ? 'ERROR'
     : l.result === 'WARN'    ? 'WARN'
     : 'INFO',
    ifaceName: ifaces.find(i=>i.id===l.interfaceId)?.name || `#${l.interfaceId}`
  }));

  const filtered = enriched.filter(l=>{
    if (filterL && l.level !== filterL) return false;
    if (filterI && String(l.interfaceId) !== filterI) return false;
    if (filterMsg && !l.message.includes(filterMsg)) return false;
    return true;
  });

  const total   = logs.length;
  const success = logs.filter(l=>l.result==='SUCCESS').length;
  const fail    = logs.filter(l=>l.result==='FAILURE').length;
  const avgMs   = logs.length ? Math.round(logs.reduce((s,l)=>s+l.durationMs,0)/logs.length) : 0;

  return (
    <div className="page">
      <div className="section-header">
        <h2>로그 및 성능 관리</h2>
        <div className="table-actions">
          <select className="select-filter" value={filterL} onChange={e=>setFilterL(e.target.value)}>
            <option value="">전체 레벨</option>
            {LEVELS.filter(Boolean).map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <select className="select-filter" value={filterI} onChange={e=>setFilterI(e.target.value)}>
            <option value="">전체 인터페이스</option>
            {ifaces.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <select className="select-filter" value={filterMsg} onChange={e=>setFilterMsg(e.target.value)}>
            <option value="">전체 유형</option>
            <option value="재처리">재처리만</option>
            <option value="수동 실행">수동 실행만</option>
          </select>
        </div>
      </div>

      <div className="stats-grid" style={{marginBottom:16}}>
        {[
          {cls:'total',  label:'총 처리건', value:total.toLocaleString(), desc:'오늘 00:00 ~ 현재'},
          {cls:'normal', label:'성공',       value:success.toLocaleString(), desc:`성공률 ${total?Math.round(success/total*100):0}%`},
          {cls:'error',  label:'실패',       value:fail.toLocaleString(),   desc:`오류율 ${total?Math.round(fail/total*100):0}%`},
          {cls:'pending',label:'평균 응답시간', value:`${avgMs}ms`,          desc:'목표: 200ms 이하'},
        ].map(c=>(
          <div key={c.cls} className={`stat-card ${c.cls}`} style={{padding:14}}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{fontSize:28}}>{c.value}</div>
            <div className="stat-desc">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="log-wrap">
        <div className="log-header-row">
          <span>타임스탬프</span><span>레벨</span><span>인터페이스</span><span>메시지</span><span style={{textAlign:'right'}}>응답시간</span>
        </div>
        <div>
          {filtered.length===0
            ? <div className="empty-state">로그가 없습니다</div>
            : filtered.map(log=>(
              <div key={log.id} className="log-entry"
                  style={{cursor:'pointer'}}
                  onClick={() => {
                    const iface = interfaces.find(i => i.id === log.interfaceId);
                    if (iface) onSelectIface(iface);
                  }}
              >
                <span className="log-time">{new Date(log.executedAt).toLocaleString('ko-KR')}</span>
                <span className={`log-level-${log.level}`}>{log.level}</span>
                <span className="log-iface">{log.ifaceName}</span>
                <span className="log-msg">{log.message}</span>
                <span className="log-dur" style={{textAlign:'right'}}>{log.durationMs}ms</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}