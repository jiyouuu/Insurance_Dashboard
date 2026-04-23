import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const hours = Array.from({length:24},(_,i)=>`${String(i).padStart(2,'0')}:00`);
const tpData = hours.map((h,i) => ({h, v:[120,85,64,45,38,42,510,1240,1820,1650,1430,1280,1100,1320,1450,1380,1210,1050,980,870,620,480,310,240][i]}));

const DONUT_COLORS = ['#3fb950','#f85149','#58a6ff','#d29922'];

export default function DashboardPage({ summary, interfaces, onTabChange, onSelectIface }) {
  const donutData = [
    {name:'정상',  value:summary.normal},
    {name:'오류',  value:summary.error},
    {name:'실행중',value:summary.running},
    {name:'대기',  value:summary.pending},
  ].filter(d=>d.value>0);

  const recent = interfaces.slice(0,5);

  return (
    <div className="page">
      <div className="stats-grid">
        {[
          {cls:'total',  label:'Total Interfaces', value:summary.total,   desc:'전체 등록 인터페이스', icon:'⛓'},
          {cls:'normal', label:'Normal',            value:summary.normal,  desc:'정상 운영 중',         icon:'✓'},
          {cls:'error',  label:'Error',             value:summary.error,   desc:'즉시 조치 필요',       icon:'!'},
          {cls:'pending',label:'Pending / Running', value:summary.pending+summary.running, desc:'대기 및 실행중', icon:'↺'},
        ].map(c=>(
          <div key={c.cls} className={`stat-card ${c.cls}`}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-desc">{c.desc}</div>
            <div className="stat-icon">{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="dash-row">
        {/* 도넛 차트 */}
        <div className="chart-card" style={{marginBottom:0}}>
          <div className="card-title">상태 분포</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {donutData.map((_,i)=><Cell key={i} fill={DONUT_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-legend">
            {donutData.map((d,i)=>(
              <div key={d.name} className="legend-item">
                <div className="legend-label">
                  <span className="legend-dot" style={{background:DONUT_COLORS[i]}} />
                  {d.name}
                </div>
                <div className="legend-val">
                  {d.value} <span style={{color:'var(--text3)',fontSize:11}}>({Math.round(d.value/summary.total*100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 인터페이스 테이블 */}
        <div className="table-card" style={{marginBottom:0}}>
          <div className="table-header">
            <div className="table-title">최근 실행 인터페이스</div>
            <button className="btn-ghost btn-sm" onClick={()=>onTabChange('interfaces')}>전체 보기 →</button>
          </div>
          <table>
            <thead>
              <tr><th>인터페이스명</th><th>기관</th><th>프로토콜</th><th>상태</th><th>마지막 실행</th></tr>
            </thead>
            <tbody>
              {recent.map(i=>(
                <tr key={i.id} className="clickable" onClick={()=>onSelectIface(i)}>
                  <td className="iface-name">{i.name}</td>
                  <td className="iface-org">{i.institution}</td>
                  <td><span className={`badge badge-${i.protocol}`}>{i.protocol}</span></td>
                  <td><span className={`status-badge s-${i.status}`}><span className="status-dot"/>{i.status}</span></td>
                  <td className="last-run">{i.lastExecutedAt?new Date(i.lastExecutedAt).toLocaleString('ko-KR'):'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 24h 처리량 */}
      <div className="chart-card">
        <div className="card-title">24시간 처리량 (건)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={tpData} margin={{top:0,right:0,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,.6)" />
            <XAxis dataKey="h" tick={{fill:'#6e7681',fontSize:10}} interval={2} />
            <YAxis tick={{fill:'#6e7681',fontSize:10}} />
            <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}} formatter={v=>[`${v}건`,'처리량']} />
            <Bar dataKey="v" fill="rgba(31,111,235,.7)" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}