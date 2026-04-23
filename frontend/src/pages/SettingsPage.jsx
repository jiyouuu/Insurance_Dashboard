import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    email: true, sms: true, slack: false, autoRetry: true,
    threshold: 300, retryCount: 3
  });
  const toggle = k => setSettings(p=>({...p,[k]:!p[k]}));

  const Toggle = ({k}) => (
    <label className="toggle-wrap">
      <input type="checkbox" checked={settings[k]} onChange={()=>toggle(k)} />
      <span className="toggle-slider" />
    </label>
  );

  return (
    <div className="page">
      <div className="section-header"><h2>시스템 설정</h2></div>
      <div className="settings-section">
        <h3>알림 설정</h3>
        {[
          {k:'email',     name:'이메일 알림',   desc:'오류 발생 시 담당자 이메일 발송'},
          {k:'sms',       name:'SMS 알림',       desc:'Critical 오류 시 SMS 발송'},
          {k:'slack',     name:'Slack 연동',     desc:'#ops-alert 채널에 알림 전송'},
          {k:'autoRetry', name:'자동 재처리',    desc:'오류 발생 시 3회 자동 재시도'},
        ].map(r=>(
          <div key={r.k} className="setting-row">
            <div className="setting-info">
              <div className="setting-name">{r.name}</div>
              <div className="setting-desc">{r.desc}</div>
            </div>
            <Toggle k={r.k} />
          </div>
        ))}
      </div>
      <div className="settings-section">
        <h3>성능 임계값</h3>
        {[
          {label:'응답시간 경고 임계값 (ms)', value:settings.threshold, onChange:v=>setSettings(p=>({...p,threshold:v}))},
          {label:'자동 재처리 횟수',          value:settings.retryCount,onChange:v=>setSettings(p=>({...p,retryCount:v}))},
        ].map(r=>(
          <div key={r.label} className="setting-row">
            <div className="setting-info"><div className="setting-name">{r.label}</div></div>
            <input type="number" value={r.value} onChange={e=>r.onChange(Number(e.target.value))}
              style={{background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)',padding:'6px 12px',borderRadius:'var(--radius)',width:80,fontFamily:'var(--font-mono)',outline:'none',textAlign:'right'}} />
          </div>
        ))}
      </div>
    </div>
  );
}