import { useState } from 'react';
import { createInterface } from '../api/interfaceApi';

const PROTOCOLS = ['REST','SOAP','MQ','BATCH','SFTP','FTP'];
const CYCLES    = ['실시간','매일 09:00','매일 18:00','매일 00:00','매시 30분','매주 월요일'];

export default function RegisterModal({ onClose, onCreated, showToast }) {
  const [form, setForm] = useState({ name:'', institution:'', protocol:'REST', url:'', scheduleCron:'실시간', description:'' });
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSubmit = async () => {
    if (!form.name || !form.institution) { showToast('인터페이스명과 기관명을 입력하세요.','error'); return; }
    await createInterface(form);
    showToast(`'${form.name}' 인터페이스가 등록되었습니다.`, 'success');
    onCreated();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div><h2>인터페이스 등록</h2></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">인터페이스명 *</label>
              <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="예) 금감원 보고 API" />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">기관명 *</label>
              <input className="form-input" value={form.institution} onChange={e=>set('institution',e.target.value)} placeholder="예) 금융감독원" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">프로토콜</label>
              <select className="form-select" value={form.protocol} onChange={e=>set('protocol',e.target.value)}>
                {PROTOCOLS.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">실행 주기</label>
              <select className="form-select" value={form.scheduleCron} onChange={e=>set('scheduleCron',e.target.value)}>
                {CYCLES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">URL / 엔드포인트</label>
            <input className="form-input" value={form.url} onChange={e=>set('url',e.target.value)} placeholder="https://api.example.com/..." />
          </div>
          <div className="form-group">
            <label className="form-label">설명</label>
            <textarea className="form-textarea" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="인터페이스 설명을 입력하세요" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={handleSubmit}>등록</button>
        </div>
      </div>
    </div>
  );
}