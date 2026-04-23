import { useEffect, useState } from 'react';
import { getLogs, retryInterface, executeInterface } from '../api/interfaceApi';

export default function DetailModal({ iface, onClose, onRefresh, showToast }) {
  const [logs, setLogs] = useState([]);
  const [tab, setTab]   = useState('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => { getLogs(iface.id).then(r => setLogs(r.data)); }, [iface.id]);

  const handleAction = async (action) => {
    setLoading(true);
    try {
        let result;
        if (action === 'retry')   result = await retryInterface(iface.id);
        if (action === 'execute') result = await executeInterface(iface.id);

        const newStatus = result.data.status;

        showToast(
        newStatus === 'ERROR'
            ? `'${iface.name}' ${action === 'retry' ? '재처리' : '실행'} 실패 ✕`
            : `'${iface.name}' ${action === 'retry' ? '재처리' : '실행'} 완료 ✓`,
        newStatus === 'ERROR' ? 'error' : 'success'
        );

        onRefresh();
        onClose();
    } catch (e) {
        showToast('오류가 발생했습니다.', 'error');
    } finally {
        setLoading(false);
    }
    };

  const successCount = logs.filter(l=>l.result==='SUCCESS').length;
  const successRate  = logs.length ? Math.round(successCount/logs.length*100) : 0;
  const avgMs = logs.length ? Math.round(logs.reduce((s,l)=>s+l.durationMs,0)/logs.length) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{iface.name}</h2>
            <p>{iface.institution} · {iface.protocol}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-tabs">
            {[['info','기본정보'],['logs','실행로그'],['perf','성능분석']].map(([k,l])=>(
              <button key={k} className={`modal-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>

          {tab==='info' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                ['프로토콜', <span className={`badge badge-${iface.protocol}`}>{iface.protocol}</span>],
                ['상태', <span className={`status-badge s-${iface.status}`}><span className="status-dot"/>  {iface.status}</span>],
                ['실행 주기', iface.scheduleCron],
                ['마지막 실행', iface.lastExecutedAt ? new Date(iface.lastExecutedAt).toLocaleString('ko-KR') : '-'],
                ['URL', iface.url],
                ['등록일시', iface.createdAt ? new Date(iface.createdAt).toLocaleString('ko-KR') : '-'],
              ].map(([label, value])=>(
                <div key={label} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px', gridColumn: label==='URL'?'1/-1':'auto'}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:4}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:500,wordBreak:'break-all'}}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {tab==='logs' && (
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:320,overflowY:'auto'}}>
              {logs.length===0
                ? <div className="empty-state">실행 이력이 없습니다</div>
                : logs.map(log=>(
                  <div key={log.id} style={{display:'flex',gap:12,padding:'10px 12px',borderRadius:'var(--radius)',background:log.result==='SUCCESS'?'rgba(63,185,80,.08)':'rgba(248,81,73,.08)',border:`1px solid ${log.result==='SUCCESS'?'rgba(63,185,80,.2)':'rgba(248,81,73,.2)'}`,fontSize:12,fontFamily:'var(--font-mono)',alignItems:'center'}}>
                    <span style={{color:log.result==='SUCCESS'?'var(--green)':'var(--red)',fontWeight:700}}>{log.result}</span>
                    <span style={{flex:1,color:'var(--text2)'}}>{log.message}</span>
                    <span style={{color:'var(--text3)'}}>{new Date(log.executedAt).toLocaleString('ko-KR')}</span>
                    <span style={{color:'var(--text3)',minWidth:50,textAlign:'right'}}>{log.durationMs}ms</span>
                  </div>
                ))
              }
            </div>
          )}

          {tab==='perf' && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {[
                ['총 실행 횟수', `${logs.length}회`, 'var(--text)'],
                ['성공률', `${successRate}%`, successRate>=80?'var(--green)':'var(--red)'],
                ['평균 응답시간', `${avgMs}ms`, avgMs<300?'var(--green)':'var(--orange)'],
              ].map(([label,value,color])=>(
                <div key={label} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:16,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:8}}>{label}</div>
                  <div style={{fontSize:28,fontWeight:600,fontFamily:'var(--font-mono)',color}}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>닫기</button>
          {iface.status==='ERROR' &&
            <button className="btn-reprocess" disabled={loading} onClick={()=>handleAction('retry')}>
              {loading?'처리중...':'↺ 재처리'}
            </button>
          }
          <button className="btn-primary" disabled={loading} onClick={()=>handleAction('execute')}>
            {loading?'실행중...':'▶ 수동 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}