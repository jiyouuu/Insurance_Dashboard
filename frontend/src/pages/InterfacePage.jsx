import { useState } from 'react';
import DetailModal from './LogPage';
import { executeInterface, retryInterface } from '../api/interfaceApi';
const STATUSES  = ['','NORMAL','ERROR','RUNNING','PENDING'];
const PROTOCOLS = ['','REST','SOAP','MQ','BATCH','SFTP','FTP'];

export default function InterfacePage({ interfaces, onRefresh, onRegister, showToast }) {
  const [search, setSearch]     = useState('');
  const [filterS, setFilterS]   = useState('');
  const [filterP, setFilterP]   = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = interfaces.filter(i => {
    if (filterS && i.status   !== filterS) return false;
    if (filterP && i.protocol !== filterP) return false;
    if (search && !i.name.includes(search) && !i.institution.includes(search)) return false;
    return true;
  });

  const handleQuickExecute = async (e, iface) => {
  e.stopPropagation();
  showToast(`'${iface.name}' 실행 중...`, '');
  await executeInterface(iface.id);
  onRefresh();
  setTimeout(async () => {
    await onRefresh();
    showToast(`'${iface.name}' 실행 완료 ✓`, 'success');
  }, 2500);
  };

  const handleQuickRetry = async (e, iface) => {
    e.stopPropagation();
    showToast(`'${iface.name}' 재처리 중...`, '');
    await retryInterface(iface.id);
    onRefresh();
    setTimeout(async () => {
      await onRefresh();
      showToast(`'${iface.name}' 재처리 완료 ✓`, 'success');
    }, 2500);
  };

  return (
    <div className="page">
      <div className="section-header">
        <h2>인터페이스 목록</h2>
        <button className="btn-primary" onClick={onRegister}>+ 인터페이스 등록</button>
      </div>
      <div className="table-card">
        <div className="table-header">
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span className="table-title">전체</span>
            <span className="chip">{filtered.length}건</span>
          </div>
          <div className="table-actions">
            <input className="search-input" placeholder="인터페이스 검색..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="select-filter" value={filterS} onChange={e=>setFilterS(e.target.value)}>
              <option value="">전체 상태</option>
              {STATUSES.filter(Boolean).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select-filter" value={filterP} onChange={e=>setFilterP(e.target.value)}>
              <option value="">전체 프로토콜</option>
              {PROTOCOLS.filter(Boolean).map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>인터페이스명</th><th>기관</th><th>프로토콜</th><th>상태</th><th>실행주기</th><th>마지막 실행</th><th>액션</th></tr>
          </thead>
          <tbody>
            {filtered.length===0
              ? <tr><td colSpan={7} className="empty-state">검색 결과가 없습니다</td></tr>
              : filtered.map(i=>(
                <tr key={i.id} className="clickable" onClick={()=>setSelected(i)}>
                  <td className="iface-name">{i.name}</td>
                  <td className="iface-org">{i.institution}</td>
                  <td><span className={`badge badge-${i.protocol}`}>{i.protocol}</span></td>
                  <td><span className={`status-badge s-${i.status}`}><span className="status-dot"/>{i.status}</span></td>
                  <td className="cycle-text">{i.scheduleCron}</td>
                  <td className="last-run">{i.lastExecutedAt?new Date(i.lastExecutedAt).toLocaleString('ko-KR'):'-'}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={(e)=>handleQuickExecute(e, i)}>▶ 실행</button>
                      {i.status==='ERROR' &&
                        <button className="icon-btn" style={{color:'var(--red)'}} onClick={(e)=>handleQuickRetry(e, i)}>↺ 재처리</button>
                      }
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      {selected && <DetailModal iface={selected} onClose={()=>setSelected(null)} onRefresh={onRefresh} showToast={showToast} />}
    </div>
  );
}