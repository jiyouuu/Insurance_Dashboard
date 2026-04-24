import { useState } from 'react';

const ANALYSIS_TYPES = [
  { key: 'overall',     icon: '🔍', label: '전체 분석',    desc: '시스템 전반 건강 상태' },
  { key: 'rca',         icon: '🧠', label: 'RCA 원인분석', desc: '장애 근본 원인 추론' },
  { key: 'prediction',  icon: '🔮', label: '장애 예측',    desc: '선제적 장애 예측' },
  { key: 'optimize',    icon: '⚡', label: '최적화 제안',  desc: '비효율 인터페이스 식별' },
  { key: 'security',    icon: '🔒', label: '보안 분석',    desc: '이상 호출 및 보안 점검' },
  { key: 'smart_alert', icon: '🔔', label: 'Smart Alert',  desc: '핵심 알람만 선별 요약' },
];

function CircleGauge({ score }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#3fb950' : score >= 40 ? '#d29922' : '#f85149';
  const label = score >= 70 ? '양호' : score >= 40 ? '주의' : '위험';
  return (
    <svg width={110} height={110}>
      <circle cx={55} cy={55} r={r} fill="none" stroke="var(--bg3)" strokeWidth={8}/>
      <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transform:'rotate(-90deg)',transformOrigin:'55px 55px',transition:'stroke-dashoffset 1s'}}/>
      <text x={55} y={50} textAnchor="middle" fill={color} fontSize={22} fontWeight={700} fontFamily="IBM Plex Mono">{score}</text>
      <text x={55} y={68} textAnchor="middle" fill="var(--text2)" fontSize={11}>{label}</text>
    </svg>
  );
}

export default function AiPage({ interfaces, onSelectIface, showToast }) {
  const [analysisType, setAnalysisType]     = useState('overall');
  const [results, setResults]               = useState({});
  const [analysisTimes, setAnalysisTimes]   = useState({});
  const [loading, setLoading]               = useState(false);
  const [loadingType, setLoadingType]       = useState('');
  const [checkedActions, setCheckedActions] = useState({});
  const [showAllErrors, setShowAllErrors]   = useState(false);

  const total     = interfaces.length;
  const errors    = interfaces.filter(i => i.status === 'ERROR');
  const running   = interfaces.filter(i => i.status === 'RUNNING');
  const pending   = interfaces.filter(i => i.status === 'PENDING');
  const errorRate = total ? Math.round(errors.length / total * 100) : 0;
  const protoErrors = errors.reduce((acc, i) => {
    acc[i.protocol] = (acc[i.protocol]||0)+1; return acc;
  }, {});

  const handleExportPDF = async () => {
    const { default: jsPDF }       = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById('ai-result-content');
    if (!el) return;
    showToast('PDF 저장 중...', '');
    const canvas  = await html2canvas(el, { backgroundColor: '#0d1117', scale: 1.5 });
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF('p', 'mm', 'a4');
    const width   = pdf.internal.pageSize.getWidth();
    const height  = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`AI분석_${ANALYSIS_TYPES.find(t=>t.key===analysisType)?.label}_${new Date().toLocaleDateString('ko-KR')}.pdf`);
    showToast('PDF 저장 완료 ✓', 'success');
  };

  const buildPrompt = (type) => {
    const base = `
당신은 보험사 금융 IT 운영 전문가입니다.
[시스템 현황]
- 전체: ${total}개 / 정상: ${interfaces.filter(i=>i.status==='NORMAL').length}개 / 오류: ${errors.length}개(${errorRate}%) / 실행중: ${running.length}개 / 대기: ${pending.length}개
[오류 인터페이스 상위 10개]
${errors.slice(0,10).map(i=>`- ${i.name}(${i.institution}) ${i.protocol} ${i.scheduleCron}`).join('\n')}
[프로토콜별 오류]
${Object.entries(protoErrors).map(([p,c])=>`${p}:${c}건`).join(', ')}`;

    const jsonInstructions = {
      overall: `${base}
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "healthScore": 숫자(0-100),
  "summary": "한줄 요약(30자 이내)",
  "problems": [
    {"level":"CRITICAL", "title":"제목", "desc":"설명(2-3문장)", "impact":"비즈니스영향"},
    {"level":"HIGH",     "title":"...",  "desc":"...",           "impact":"..."},
    {"level":"MEDIUM",   "title":"...",  "desc":"...",           "impact":"..."}
  ],
  "actions": [
    {"priority":1,"title":"즉시 조치 항목","detail":"구체적 방법","iface":"관련 인터페이스명"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"...","detail":"...","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["단기 개선 1","단기 개선 2","단기 개선 3"],
  "longTerm":  ["장기 개선 1","장기 개선 2","장기 개선 3"]
}`,
      rca: `${base}
반드시 JSON만 출력:
{
  "healthScore": 숫자,
  "summary": "RCA 한줄 요약",
  "problems": [
    {"level":"CRITICAL","title":"근본원인","desc":"원인 체인 설명","impact":"영향"},
    {"level":"HIGH","title":"...","desc":"...","impact":"..."},
    {"level":"MEDIUM","title":"...","desc":"...","impact":"..."}
  ],
  "actions": [
    {"priority":1,"title":"조치항목","detail":"방법","iface":"인터페이스"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"...","detail":"...","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["재발방지1","재발방지2","재발방지3"],
  "longTerm":  ["구조개선1","구조개선2","구조개선3"]
}`,
      prediction: `${base}
반드시 JSON만 출력:
{
  "healthScore": 숫자,
  "summary": "예측 한줄 요약",
  "problems": [
    {"level":"CRITICAL","title":"24h내 장애위험","desc":"예측 근거","impact":"예상 영향"},
    {"level":"HIGH","title":"오류 확산 시나리오","desc":"연쇄 장애 경로","impact":"영향"},
    {"level":"MEDIUM","title":"리소스 고갈 예측","desc":"고갈 예상 시점","impact":"영향"}
  ],
  "actions": [
    {"priority":1,"title":"선제 조치","detail":"방법","iface":"인터페이스"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"...","detail":"...","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["모니터링강화1","모니터링강화2","모니터링강화3"],
  "longTerm":  ["예방체계1","예방체계2","예방체계3"]
}`,
      optimize: `${base}
반드시 JSON만 출력:
{
  "healthScore": 숫자,
  "summary": "최적화 한줄 요약",
  "problems": [
    {"level":"HIGH","title":"비효율 인터페이스","desc":"문제 설명","impact":"낭비되는 자원"},
    {"level":"MEDIUM","title":"프로토콜 비효율","desc":"설명","impact":"영향"},
    {"level":"MEDIUM","title":"스케줄 최적화 필요","desc":"설명","impact":"영향"}
  ],
  "actions": [
    {"priority":1,"title":"즉시 최적화","detail":"방법","iface":"인터페이스"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"...","detail":"...","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["단기최적화1","단기최적화2","단기최적화3"],
  "longTerm":  ["장기최적화1","장기최적화2","장기최적화3"]
}`,
      security: `${base}
반드시 JSON만 출력:
{
  "healthScore": 숫자,
  "summary": "보안 한줄 요약",
  "problems": [
    {"level":"CRITICAL","title":"보안 위험","desc":"설명","impact":"영향"},
    {"level":"HIGH","title":"인증 오류 패턴","desc":"설명","impact":"영향"},
    {"level":"MEDIUM","title":"개인정보 위험","desc":"설명","impact":"영향"}
  ],
  "actions": [
    {"priority":1,"title":"보안 조치","detail":"방법","iface":"인터페이스"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"...","detail":"...","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["단기보안1","단기보안2","단기보안3"],
  "longTerm":  ["장기보안1","장기보안2","장기보안3"]
}`,
      smart_alert: `${base}
반드시 JSON만 출력:
{
  "healthScore": 숫자,
  "summary": "Smart Alert 한줄 요약",
  "problems": [
    {"level":"CRITICAL","title":"즉시대응 알람 TOP1","desc":"설명","impact":"비즈니스영향"},
    {"level":"HIGH","title":"즉시대응 알람 TOP2","desc":"설명","impact":"영향"},
    {"level":"HIGH","title":"즉시대응 알람 TOP3","desc":"설명","impact":"영향"}
  ],
  "actions": [
    {"priority":1,"title":"지금 당장 할 것","detail":"구체적 행동","iface":"인터페이스"},
    {"priority":2,"title":"...","detail":"...","iface":"..."},
    {"priority":3,"title":"...","detail":"...","iface":"..."},
    {"priority":4,"title":"무시해도 되는 오류","detail":"이유","iface":"..."},
    {"priority":5,"title":"...","detail":"...","iface":"..."}
  ],
  "shortTerm": ["단기조치1","단기조치2","단기조치3"],
  "longTerm":  ["장기조치1","장기조치2","장기조치3"]
}`,
    };
    return jsonInstructions[type] || jsonInstructions.overall;
  };

  const handleAnalyze = async (type) => {
    setLoading(true);
    setLoadingType(type);
    setResults(prev => ({ ...prev, [type]: null })); 
    try {
      const response = await fetch('http://localhost:8080/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(type) })
      });
      const text    = await response.text();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed  = JSON.parse(cleaned);
      setResults(prev => ({ ...prev, [type]: parsed }));
      setAnalysisTimes(prev => ({ ...prev, [type]: new Date().toLocaleString('ko-KR') }));
    } catch (e) {
      setResults(prev => ({ ...prev, [type]: { error: '분석 중 오류가 발생했습니다. 다시 시도해주세요.' } }));
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const toggleAction = (type, idx) => {
    const key = `${type}-${idx}`;
    setCheckedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentResult    = results[analysisType];
  const isCurrentLoading = loading && loadingType === analysisType;
  const analysisTime     = analysisTimes[analysisType];

  const levelColor = { CRITICAL:'var(--red)', HIGH:'var(--orange)', MEDIUM:'var(--yellow)' };
  const levelBg    = { CRITICAL:'var(--red-dim)', HIGH:'var(--orange-dim)', MEDIUM:'rgba(210,153,34,.1)' };

  return (
    <div className="page">

      {/* 헤더 */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div>
          <h2 style={{fontSize:18, fontWeight:500, marginBottom:4}}>🤖 AI 장애 분석</h2>
          <p style={{fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)'}}>
            실제 시스템 데이터 기반 · AI 자동 진단
          </p>
        </div>
        {Object.keys(results).length > 0 && (
          <span style={{fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)'}}>
            💾 {Object.keys(results).length}개 캐시됨
          </span>
        )}
      </div>

      {/* 현황 카드 + 분석 유형 */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          {[
            {label:'전체', value:total,                                              color:'var(--text)'},
            {label:'정상', value:interfaces.filter(i=>i.status==='NORMAL').length,  color:'var(--green)'},
            {label:'오류', value:errors.length,                                      color:'var(--red)'},
            {label:'대기', value:pending.length+running.length,                     color:'var(--orange)'},
          ].map(c => (
            <div key={c.label} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'12px 14px'}}>
              <div style={{fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)', letterSpacing:1, textTransform:'uppercase', marginBottom:4}}>{c.label}</div>
              <div style={{fontSize:26, fontWeight:700, fontFamily:'var(--font-mono)', color:c.color}}>{c.value}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
          {ANALYSIS_TYPES.map(t => (
            <div key={t.key} onClick={() => setAnalysisType(t.key)}
              style={{
                background: analysisType===t.key ? 'rgba(31,111,235,0.15)' : 'var(--bg2)',
                border: `1px solid ${analysisType===t.key ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius:'var(--radius)', padding:'10px 12px',
                cursor:'pointer', transition:'all .2s', position:'relative'
              }}
            >
              <div style={{fontSize:12, fontWeight:600, color:analysisType===t.key?'var(--blue)':'var(--text)', marginBottom:2}}>{t.icon} {t.label}</div>
              <div style={{fontSize:10, color:'var(--text3)'}}>{t.desc}</div>
              {results[t.key] && !results[t.key].error && (
                <span style={{position:'absolute', top:8, right:8, width:5, height:5, borderRadius:'50%', background:'var(--green)'}}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 분석 버튼 */}
      <div style={{display:'flex', justifyContent:'center', gap:10, marginBottom:24}}>
        <button className="btn-primary"
          style={{padding:'10px 32px', fontSize:13, opacity: isCurrentLoading ? .6 : 1}}
          disabled={loading}
          onClick={() => handleAnalyze(analysisType)}
        >
          {isCurrentLoading ? '⏳ AI 분석 중...' : currentResult ? '🔄 재분석' : '🔍 AI 분석 시작'}
        </button>
        {currentResult && !currentResult.error && (
          <button className="btn-ghost" style={{padding:'10px 20px', fontSize:13}} onClick={handleExportPDF}>
            📄 PDF 저장
          </button>
        )}
      </div>

      {/* 로딩 */}
      {isCurrentLoading && (
        <div style={{textAlign:'center', padding:'60px 0'}}>
          <div style={{fontSize:32, marginBottom:12}}>🤖</div>
          <div style={{fontSize:14, color:'var(--text2)'}}>AI가 {errors.length}개 오류를 분석하고 있습니다...</div>
          <div style={{fontSize:11, color:'var(--text3)', marginTop:6, fontFamily:'var(--font-mono)'}}>보통 10~20초 소요됩니다</div>
        </div>
      )}

      {/* 결과 - 에러 */}
      {currentResult?.error && (
        <div style={{background:'var(--red-dim)', border:'1px solid var(--red-border)', borderRadius:'var(--radius-lg)', padding:20, textAlign:'center', color:'var(--red)'}}>
          ⚠️ {currentResult.error}
        </div>
      )}

      {/* 결과 - 성공 */}
      {currentResult && !currentResult.error && !isCurrentLoading && (
        <div id="ai-result-content">

          {/* 메인 그리드 */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:16}}>

            {/* 좌측 */}
            <div style={{display:'flex', flexDirection:'column', gap:14}}>

              {/* 건강도 카드 */}
              <div style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px 24px', display:'flex', alignItems:'center', gap:24}}>
                <CircleGauge score={currentResult.healthScore || 0} />
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                    <div style={{fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', letterSpacing:1}}>
                      SYSTEM HEALTH · AI 진단
                    </div>
                    {analysisTime && (
                      <div style={{fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)'}}>
                        🕐 {analysisTime}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.5, marginBottom:8}}>
                    {currentResult.summary}
                  </div>
                  <div style={{display:'flex', gap:12, fontSize:11, fontFamily:'var(--font-mono)'}}>
                    <span style={{color:'var(--red)'}}>⚠ 오류 {errors.length}건</span>
                    <span style={{color:'var(--orange)'}}>⏳ 대기 {pending.length}건</span>
                    <span style={{color:'var(--green)'}}>✓ 정상 {interfaces.filter(i=>i.status==='NORMAL').length}건</span>
                  </div>
                </div>
              </div>

              {/* 핵심 문제 카드 */}
              <div>
                <div style={{fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)', letterSpacing:1, marginBottom:10}}>핵심 문제 분석</div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {(currentResult.problems||[]).map((p, i) => (
                    <div key={i} style={{
                      background:'var(--bg2)',
                      border:`1px solid ${levelColor[p.level]||'var(--border)'}`,
                      borderRadius:'var(--radius-lg)', padding:'16px 20px',
                      borderLeft:`4px solid ${levelColor[p.level]||'var(--border)'}`
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{
                            background:levelBg[p.level], color:levelColor[p.level],
                            fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:4,
                            fontFamily:'var(--font-mono)', letterSpacing:0.5
                          }}>{p.level}</span>
                          <span style={{fontSize:13, fontWeight:700, color:'var(--text)'}}>{p.title}</span>
                        </div>
                        <span style={{fontSize:10, color:'var(--text3)'}}>#{i+1}</span>
                      </div>
                      <div style={{fontSize:12, color:'var(--text2)', lineHeight:1.7, marginBottom:8}}>{p.desc}</div>
                      <div style={{fontSize:11, color:levelColor[p.level], background:levelBg[p.level], padding:'6px 10px', borderRadius:6}}>
                        📊 비즈니스 영향: {p.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 단기/장기 개선 */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                {[
                  {title:'📅 단기 개선 (1~3개월)', items:currentResult.shortTerm||[], color:'var(--blue)'},
                  {title:'🗓 장기 개선 (3개월+)',  items:currentResult.longTerm||[],  color:'var(--purple)'},
                ].map(section => (
                  <div key={section.title} style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 18px'}}>
                    <div style={{fontSize:11, fontWeight:700, color:section.color, marginBottom:10}}>{section.title}</div>
                    {section.items.map((item, i) => (
                      <div key={i} style={{display:'flex', gap:8, marginBottom:8, fontSize:12, color:'var(--text2)'}}>
                        <span style={{color:section.color, flexShrink:0}}>{i+1}.</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 우측 즉시 조치 큐 */}
            <div style={{position:'sticky', top:20, alignSelf:'start'}}>
              <div style={{background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden'}}>
                <div style={{background:'rgba(248,81,73,.1)', borderBottom:'1px solid var(--red-border)', padding:'12px 16px'}}>
                  <div style={{fontSize:11, fontWeight:700, color:'var(--red)', fontFamily:'var(--font-mono)', letterSpacing:1}}>⚡ 즉시 조치 큐</div>
                  <div style={{fontSize:10, color:'var(--text3)', marginTop:2}}>
                    {(currentResult.actions||[]).filter((_,i)=>checkedActions[`${analysisType}-${i}`]).length}
                    /{(currentResult.actions||[]).length} 완료
                  </div>
                </div>
                <div style={{padding:'8px 0'}}>
                  {(currentResult.actions||[]).map((action, i) => {
                    const key     = `${analysisType}-${i}`;
                    const checked = checkedActions[key];
                    return (
                      <div key={i} onClick={() => toggleAction(analysisType, i)}
                        style={{
                          display:'flex', gap:10, padding:'12px 16px',
                          borderBottom:'1px solid var(--border)', cursor:'pointer',
                          background: checked ? 'rgba(63,185,80,.05)' : 'transparent',
                          opacity: checked ? .6 : 1, transition:'background .15s'
                        }}
                      >
                        <div style={{
                          width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
                          border:`1.5px solid ${checked?'var(--green)':'var(--border2)'}`,
                          background: checked?'var(--green)':'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s'
                        }}>
                          {checked && <span style={{color:'#fff', fontSize:10, fontWeight:700}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{
                            fontSize:12, fontWeight:600, marginBottom:3,
                            color: checked?'var(--text3)':'var(--text)',
                            textDecoration: checked?'line-through':'none'
                          }}>
                            <span style={{color:'var(--orange)', fontSize:10, marginRight:4}}>P{action.priority}</span>
                            {action.title}
                          </div>
                          <div style={{fontSize:11, color:'var(--text3)', lineHeight:1.5}}>{action.detail}</div>
                          {action.iface && action.iface !== '...' && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                const iface = interfaces.find(f => f.name === action.iface);
                                if (iface) onSelectIface(iface);
                              }}
                              style={{fontSize:10, color:'var(--blue)', marginTop:4, fontFamily:'var(--font-mono)', cursor:'pointer', textDecoration:'underline'}}
                            >
                              → {action.iface} ↗
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(currentResult.actions||[]).length > 0 &&
                 (currentResult.actions||[]).every((_,i) => checkedActions[`${analysisType}-${i}`]) && (
                  <div style={{padding:'14px 16px', textAlign:'center', background:'rgba(63,185,80,.08)'}}>
                    <div style={{fontSize:13, color:'var(--green)', fontWeight:700}}>✅ 모든 조치 완료!</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오류 인터페이스 목록 - 분석 후 하단에 표시 */}
            {errors.length > 0 && (
            <div style={{background:'var(--bg2)', border:'1px solid var(--red-border)', borderRadius:'var(--radius-lg)', padding:'20px 24px', marginTop:16}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                <div>
                    <div style={{fontSize:13, fontWeight:700, color:'var(--red)', marginBottom:2}}>
                    🔴 오류 인터페이스 — 즉시 조치 대상
                    </div>
                    <div style={{fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)'}}>
                    총 {errors.length}건 · 클릭하여 즉시 재처리
                    </div>
                </div>
                <button className="btn-ghost btn-sm" onClick={() => setShowAllErrors(p => !p)}>
                    {showAllErrors ? '접기 ↑' : `전체 보기 (${errors.length}건) ↓`}
                </button>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                {(showAllErrors ? errors : errors.slice(0,6)).map(iface => (
                    <div key={iface.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    background:'var(--bg3)', borderRadius:'var(--radius)', padding:'12px 16px',
                    border:'1px solid rgba(248,81,73,.2)',
                    transition:'border-color .15s, background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(248,81,73,.5)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(248,81,73,.2)'}
                    >
                    <div style={{display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0}}>
                        <div style={{
                        width:32, height:32, borderRadius:8, flexShrink:0,
                        background:'var(--red-dim)', border:'1px solid var(--red-border)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:700, color:'var(--red)', fontFamily:'var(--font-mono)'
                        }}>
                        {iface.protocol.slice(0,3)}
                        </div>
                        <div style={{minWidth:0}}>
                        <div style={{fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                            {iface.name}
                        </div>
                        <div style={{fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)'}}>
                            {iface.institution} · {iface.scheduleCron}
                        </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onSelectIface(iface)}
                        style={{
                        flexShrink:0, marginLeft:10,
                        background:'rgba(248,81,73,.15)', border:'1px solid var(--red-border)',
                        color:'var(--red)', borderRadius:'var(--radius)', padding:'6px 14px',
                        fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                        transition:'background .15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(248,81,73,.3)'}
                        onMouseLeave={e => e.currentTarget.style.background='rgba(248,81,73,.15)'}
                    >
                        ↺ 재처리
                    </button>
                    </div>
                ))}
                </div>

                {!showAllErrors && errors.length > 6 && (
                <div style={{textAlign:'center', marginTop:12}}>
                    <button className="btn-ghost btn-sm" onClick={() => setShowAllErrors(true)}>
                    +{errors.length - 6}개 더 보기 ↓
                    </button>
                </div>
                )}
            </div>
            )}
        </div>
      )}
    </div>
  );
}