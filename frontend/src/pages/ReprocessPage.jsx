import { useState } from 'react';

export default function ReprocessPage({ interfaces, onRefresh, showToast }) {
  const [skipped, setSkipped] = useState([]);

  const errors = interfaces
    .filter(i => i.status === 'ERROR')
    .filter(i => !skipped.includes(i.id));

  const handleSkip = (iface) => {
    setSkipped(prev => [...prev, iface.id]);
    showToast(`'${iface.name}' 건너뜀`, '');
  };

  const handleReprocess = async (iface) => {
    const { retryInterface } = await import('../api/interfaceApi');
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
        <h2>재처리 관리</h2>
        <div className="badge-live" style={{fontSize:13, color:'var(--red)'}}>
          ⚠ 오류 건수: {errors.length}건
        </div>
      </div>

      {errors.length === 0
        ? (
          <div className="empty-state" style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)'}}>
            <div style={{fontSize:32, marginBottom:8}}>✓</div>
            <p>재처리 대상 인터페이스가 없습니다</p>
          </div>
        )
        : (
          <div className="reprocess-list">
            {errors.map(i => (
              <div key={i.id} className="reprocess-item">
                <div>
                  <div className="rp-name">
                    {i.name} <span className="chip">{i.protocol}</span>
                  </div>
                  <div className="rp-meta">
                    {i.institution} | 마지막 실행: {i.lastExecutedAt ? new Date(i.lastExecutedAt).toLocaleString('ko-KR') : '-'} | 주기: {i.scheduleCron}
                  </div>
                  <div className="rp-error">⚠ 연결 오류 발생</div>
                </div>
                <div className="rp-actions">
                  <button className="btn-skip" onClick={() => handleSkip(i)}>건너뛰기</button>
                  <button className="btn-reprocess" onClick={() => handleReprocess(i)}>↺ 재처리</button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}