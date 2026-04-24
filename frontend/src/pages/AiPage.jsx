import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ANALYSIS_TYPES = [
  { key: 'overall',     icon: '🔍', label: '전체 분석',    desc: '시스템 전반 건강 상태' },
  { key: 'rca',         icon: '🧠', label: 'RCA 원인분석', desc: '장애 근본 원인 추론' },
  { key: 'prediction',  icon: '🔮', label: '장애 예측',    desc: '선제적 장애 예측' },
  { key: 'optimize',    icon: '⚡', label: '최적화 제안',  desc: '비효율 인터페이스 식별' },
  { key: 'security',    icon: '🔒', label: '보안 분석',    desc: '이상 호출 및 보안 점검' },
  { key: 'smart_alert', icon: '🔔', label: 'Smart Alert',  desc: '핵심 알람만 선별 요약' },
];

export default function AiPage({ interfaces }) {
  const [analysisType, setAnalysisType] = useState('overall');
  const [results, setResults] = useState({});  // 탭별 캐싱
  const [loading, setLoading]  = useState(false);
  const [loadingType, setLoadingType] = useState('');

  const total   = interfaces.length;
  const errors  = interfaces.filter(i => i.status === 'ERROR');
  const running = interfaces.filter(i => i.status === 'RUNNING');
  const pending = interfaces.filter(i => i.status === 'PENDING');
  const errorRate = total ? Math.round(errors.length / total * 100) : 0;

  const protoErrors = errors.reduce((acc, i) => {
    acc[i.protocol] = (acc[i.protocol] || 0) + 1;
    return acc;
  }, {});

  const buildPrompt = (type) => {
  const baseContext = `
당신은 보험사 금융 IT 시스템의 수석 운영 전문가입니다.
아래는 보험사 IT 인터페이스 통합관리시스템(IFMS)의 실시간 데이터입니다.

[시스템 현황]
- 전체 인터페이스: ${total}개
- 정상(NORMAL): ${interfaces.filter(i=>i.status==='NORMAL').length}개
- 오류(ERROR): ${errors.length}개 (오류율 ${errorRate}%)
- 실행중(RUNNING): ${running.length}개
- 대기(PENDING): ${pending.length}개

[오류 발생 인터페이스 목록 (상위 10개)]
${errors.slice(0,10).map(i=>`- ${i.name} (${i.institution}) / 프로토콜: ${i.protocol} / 주기: ${i.scheduleCron}`).join('\n')}

[프로토콜별 오류 현황]
${Object.entries(protoErrors).map(([p,c])=>`- ${p}: ${c}건`).join('\n')}

[대기 중인 주요 인터페이스]
${pending.slice(0,5).map(i=>`- ${i.name} (${i.institution}) / 프로토콜: ${i.protocol}`).join('\n')}
`;

  const prompts = {
    overall: `${baseContext}
다음을 분석해주세요:
1. **시스템 건강 상태 평가** - 현재 상태를 100점 기준으로 점수화하고 이유 설명
2. **가장 심각한 문제 3가지** - 원인과 비즈니스 영향도
3. **즉시 조치 필요 항목** - 우선순위 순으로
4. **단기/장기 개선 방향**
운영자가 바로 행동할 수 있도록 구체적으로 설명해주세요.`,

    rca: `${baseContext}
RCA(Root Cause Analysis) 관점에서 분석해주세요:
1. **장애 근본 원인 추론** - 각 오류의 실제 원인 체인 분석 (예: A 시스템 DB 타임아웃 → B 인터페이스 대기 → C 배치 실패)
2. **연쇄 장애 가능성** - 현재 오류가 다른 인터페이스에 미칠 영향
3. **채널-MCI-EAI-계정계 구간별 문제 분석** - 어느 구간에서 병목이 발생하는지
4. **과거 유사 사례 기반 해결책 추천** - 이런 패턴에서 효과적인 조치 방법
5. **재발 방지를 위한 구조적 개선 방안**
금융 IT 아키텍처 관점에서 구체적으로 분석해주세요.`,

    prediction: `${baseContext}
예측 분석을 수행해주세요:
1. **향후 24시간 내 장애 위험 인터페이스** - 현재 PENDING/RUNNING 상태 기반
2. **오류 확산 시나리오** - 현재 ERROR가 연쇄적으로 확산될 경우 시나리오
3. **이상 징후 탐지** - 평소와 다른 비정상적인 패턴 (프로토콜별 오류 집중 등)
4. **리소스 고갈 예측** - 현재 추세로 시스템 부하가 임계점에 도달할 시점
5. **선제적 조치 권고** - 장애 발생 전 취해야 할 조치
구체적인 인터페이스 이름을 언급하며 분석해주세요.`,

    optimize: `${baseContext}
최적화 및 거버넌스 관점에서 분석해주세요:
1. **비효율 인터페이스 식별** - PENDING 상태가 많거나 중복 가능성 있는 인터페이스
2. **프로토콜 최적화 제안** - REST/SOAP/MQ/BATCH 프로토콜 선택이 적절한지
3. **실행 주기 최적화** - 불필요하게 잦은 호출이나 비효율적인 스케줄 식별
4. **성능 병목 구간** - 특정 기관/프로토콜에서 과도한 부하 발생 구간
5. **인터페이스 통폐합 후보** - 유사한 기능을 하는 인터페이스 중복 제거 제안
비용 절감과 성능 향상 관점에서 구체적으로 제안해주세요.`,

    security: `${baseContext}
보안 및 컴플라이언스 관점에서 분석해주세요:
1. **비정상 호출 패턴 탐지** - 특이한 기관/프로토콜 조합이나 비정상적인 실행 패턴
2. **외부망 연계 위험도 평가** - 병원, 카드사, 공공기관 등 대외 기관 연계 보안 위험
3. **인증/권한 관련 오류 분석** - ERROR 인터페이스 중 인증 관련 문제 가능성
4. **개인정보 보호 관점 점검** - SFTP/FTP를 통한 파일 전송 인터페이스 보안 취약점
5. **금융보안원 기준 준수 여부** - 현재 구성이 금융 IT 보안 기준에 부합하는지
금융 IT 보안 전문가 관점에서 분석해주세요.`,

    smart_alert: `${baseContext}
Smart Alert 관점에서 분석해주세요:
1. **진짜 중요한 알람 TOP 5** - 수많은 오류 중 즉시 대응이 필요한 것만 선별 (Alert Fatigue 방지)
2. **각 알람의 비즈니스 임팩트** - 이 오류가 실제 보험 업무에 미치는 영향
3. **알람 우선순위 매트릭스** - 긴급도/중요도 기준으로 2x2 매트릭스 분류
4. **무시해도 되는 오류** - 현재 ERROR 중 실제로 크리티컬하지 않은 것들
5. **운영자 즉시 행동 가이드** - 지금 당장 해야 할 것 3가지
"그래서 지금 내가 뭘 해야 하는가?"에 대한 명확한 답을 주세요.`,
  };

  return prompts[type] || prompts.overall;
};

  const handleAnalyze = async (type) => {
    setLoading(true);
    setLoadingType(type);
    try {
      const response = await fetch('http://localhost:8080/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt(type) })
      });
      const text = await response.text();
      setResults(prev => ({ ...prev, [type]: text }));
    } catch (e) {
      setResults(prev => ({ ...prev, [type]: '분석 중 오류가 발생했습니다.' }));
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById('ai-result-content');
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#0d1117' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width  = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`AI분석_${ANALYSIS_TYPES.find(t=>t.key===analysisType)?.label}_${new Date().toLocaleDateString('ko-KR')}.pdf`);
  };

  const currentResult = results[analysisType];
  const isCurrentLoading = loading && loadingType === analysisType;

  return (
    <div className="page">
      {/* 헤더 */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:18,fontWeight:500,marginBottom:4}}>🤖 AI 장애 분석</h2>
        <p style={{fontSize:12,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>
          실제 시스템 로그를 기반으로 AI가 장애 원인을 분석합니다
        </p>
      </div>

      {/* 현황 카드 */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20}}>
        {[
            {label:'전체',   value:total,                                              color:'var(--text)'},
            {label:'정상',   value:interfaces.filter(i=>i.status==='NORMAL').length,  color:'var(--green)'},
            {label:'오류',   value:errors.length,                                      color:'var(--red)'},
            {label:'대기/실행중', value:pending.length + running.length,              color:'var(--orange)'},
        ].map(c=>(
          <div key={c.label} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'16px 20px'}}>
            <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>{c.label}</div>
            <div style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-mono)',color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 분석 유형 탭 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {ANALYSIS_TYPES.map(t=>(
          <div key={t.key}
            onClick={()=>setAnalysisType(t.key)}
            style={{
              background: analysisType===t.key ? 'rgba(31,111,235,0.15)' : 'var(--bg2)',
              border:`1px solid ${analysisType===t.key ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius:'var(--radius-lg)', padding:'14px 16px',
              cursor:'pointer', transition:'all .2s', position:'relative'
            }}
          >
            <div style={{fontSize:13,fontWeight:600,marginBottom:4,color:analysisType===t.key?'var(--blue)':'var(--text)'}}>
              {t.icon} {t.label}
            </div>
            <div style={{fontSize:11,color:'var(--text3)'}}>{t.desc}</div>
            {/* 캐시됐으면 초록 점 표시 */}
            {results[t.key] && (
              <span style={{position:'absolute',top:10,right:10,width:6,height:6,borderRadius:'50%',background:'var(--green)'}} />
            )}
          </div>
        ))}
      </div>

      {/* 오류 인터페이스 태그 */}
      {errors.length > 0 && (
        <div style={{background:'var(--bg2)',border:'1px solid var(--red-border)',borderRadius:'var(--radius-lg)',padding:'16px 20px',marginBottom:20}}>
          <div style={{fontSize:11,color:'var(--red)',fontFamily:'var(--font-mono)',letterSpacing:1,marginBottom:10}}>
            CURRENT ERRORS — AI 분석 대상
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {errors.slice(0,12).map(i=>(
              <span key={i.id} style={{background:'var(--red-dim)',border:'1px solid var(--red-border)',borderRadius:4,padding:'3px 10px',fontSize:11,color:'var(--red)',fontFamily:'var(--font-mono)'}}>
                {i.name} ({i.protocol})
              </span>
            ))}
            {errors.length > 12 && (
              <span style={{fontSize:11,color:'var(--text3)',padding:'3px 6px'}}>+{errors.length-12}개 더</span>
            )}
          </div>
        </div>
      )}

      {/* 분석 버튼 */}
      <div style={{display:'flex',justifyContent:'center',gap:12,marginBottom:24}}>
        <button className="btn-primary"
          style={{padding:'11px 36px',fontSize:14,opacity:isCurrentLoading ? .6 : 1}}
          disabled={loading}
          onClick={()=>handleAnalyze(analysisType)}
        >
          {isCurrentLoading ? '⏳ 분석 중...' : currentResult ? '🔄 재분석' : '🔍 AI 분석 시작'}
        </button>
        {currentResult && (
          <button className="btn-ghost"
            style={{padding:'11px 24px',fontSize:13}}
            onClick={handleExportPDF}
          >
            📄 PDF 저장
          </button>
        )}
      </div>

      {/* 분석 결과 */}
      {(currentResult || isCurrentLoading) && (
        <div id="ai-result-content" style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'28px'}}>
          {/* 결과 헤더 */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontSize:20,color:'var(--blue)',fontFamily:'var(--font-mono)',letterSpacing:1,marginBottom:4}}>
                ✨ AI 분석 결과
              </div>
              <div style={{fontSize:13,color:'var(--text2)'}}>
                {ANALYSIS_TYPES.find(t=>t.key===analysisType)?.icon} {ANALYSIS_TYPES.find(t=>t.key===analysisType)?.label}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              {isCurrentLoading
                ? <span style={{fontSize:11,color:'var(--orange)',fontFamily:'var(--font-mono)'}}>● 분석 중...</span>
                : <span style={{fontSize:11,color:'var(--green)',fontFamily:'var(--font-mono)'}}>● 분석 완료</span>
              }
              <div style={{fontSize:10,color:'var(--text3)',marginTop:2,fontFamily:'var(--font-mono)'}}>
                {new Date().toLocaleString('ko-KR')}
              </div>
            </div>
          </div>

          {/* 마크다운 결과 */}
          <div style={{
            fontSize:13, lineHeight:1.9, color:'var(--text)',
          }}>
            <style>{`
              .ai-md h3 { font-size:15px; font-weight:700; color:#e6edf3; margin:20px 0 10px; padding-bottom:6px; border-bottom:1px solid var(--border); }
              .ai-md h4 { font-size:13px; font-weight:700; color:#58a6ff; margin:14px 0 8px; }
              .ai-md p  { margin-bottom:10px; color:#c9d1d9; line-height:1.8; }
              .ai-md ul { padding-left:20px; margin-bottom:10px; }
              .ai-md li { margin-bottom:6px; color:#c9d1d9; line-height:1.7; }
              .ai-md strong { color:#e6edf3; font-weight:600; }
              .ai-md hr { border:none; border-top:1px solid var(--border); margin:16px 0; }
              .ai-md code { background:rgba(88,166,255,0.1); border:1px solid rgba(88,166,255,0.2); border-radius:4px; padding:1px 6px; font-size:12px; color:#58a6ff; }
            `}</style>
            <div className="ai-md">
              <ReactMarkdown>{currentResult || '분석 중...'}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* 캐시된 다른 탭 결과 안내 */}
      {Object.keys(results).length > 1 && (
        <div style={{marginTop:16,fontSize:11,color:'var(--text3)',textAlign:'center',fontFamily:'var(--font-mono)'}}>
          💾 {Object.keys(results).length}개 분석 결과 캐시됨 — 탭 전환해도 결과 유지
        </div>
      )}
    </div>
  );
}