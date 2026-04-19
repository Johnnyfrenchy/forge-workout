import { useApp } from '../hooks/useApp'
import { computeFrequency } from '../algo/frequency'
import { groupFrequencyMap } from '../algo/sessionPicker'
import { groupSessionsByWeek, weekVolume } from '../algo/deload'
import { KpiCard } from '../components/KpiCard'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

export function StatsScreen() {
  const { sessions } = useApp()
  const completed = sessions.filter(s => s.completed)

  if (completed.length < 2) {
    return (
      <div className="p-6 text-center">
        <div className="font-display text-xl">Pas assez de données</div>
        <div className="font-mono text-xs text-[var(--ink-dim)] mt-2">Complète au moins 2 séances pour voir tes stats.</div>
      </div>
    )
  }

  const byWeek = groupSessionsByWeek(sessions)
  const weekEntries = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))

  // Fill all weeks in the 12-week range (including weeks with 0 sessions)
  const fillWeeks = (() => {
    const now = new Date()
    const result: { key: string; sessions: number; volume: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const year = d.getFullYear()
      // ISO week number
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = tmp.getUTCDay() || 7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
      const wk = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
      const key = `${tmp.getUTCFullYear()}-W${wk}`
      const wSessions = byWeek[key] || []
      result.push({ key, sessions: wSessions.length, volume: weekVolume(wSessions) })
    }
    return result
  })()

  const weekData = fillWeeks
  const freqData = fillWeeks.map(w => ({ key: w.key, freq: w.sessions }))

  const GROUP_ABBR: Record<string, string> = {
    Chest: 'Chest', Back: 'Back', Shoulders: 'Delt', Triceps: 'Tric',
    Biceps: 'Bic', Quads: 'Quad', Hamstrings: 'Ham', Glutes: 'Glut',
    Calves: 'Calv', Core: 'Core',
  }
  const groupFreq = groupFrequencyMap(sessions, 30)
  const groupData = Object.entries(groupFreq)
    .filter(([name, v]) => v > 0 && name !== 'Core')
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: GROUP_ABBR[name] ?? name.slice(0, 5), value }))

  const fmtVol = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(Math.round(v))
  const tooltipStyle = { background: '#141414', border: '1px solid #3a3a3a', fontFamily: 'JetBrains Mono', fontSize: 11 }

  return (
    <div className="p-4 max-w-screen-md mx-auto pb-safe">
      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-4">ANALYTICS</div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <KpiCard label="TOT SESS" value={completed.length} />
        <KpiCard label="VOL 7J" value={fmtVol(weekData.slice(-1)[0]?.volume || 0)} unit="KG·R" />
        <KpiCard label="FREQ" value={computeFrequency(sessions, 14).toFixed(1)} unit="/WK" />
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">VOLUME / 12 WEEKS</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={weekData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="key" tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} tickFormatter={v => v.split('-W')[1]} />
              <YAxis tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} width={40} tickFormatter={fmtVol} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e8e8e8' }} formatter={(v: number) => [fmtVol(v), 'Volume']} />
              <Bar dataKey="volume" fill="#c6f042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">FREQUENCY TREND — SÉANCES / SEMAINE</div>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <LineChart data={freqData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="key"
                tick={{ fontSize: 8, fill: '#8a8a8a' }}
                axisLine={{ stroke: '#3a3a3a' }}
                tickLine={false}
                tickFormatter={v => `W${v.split('-W')[1]}`}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#8a8a8a' }}
                axisLine={{ stroke: '#3a3a3a' }}
                tickLine={false}
                width={20}
                domain={[0, 7]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} séance${v > 1 ? 's' : ''}`, 'Semaine']}
                labelFormatter={v => `Semaine ${v.split('-W')[1]}`}
              />
              <Line
                type="monotone"
                dataKey="freq"
                stroke="#c6f042"
                strokeWidth={2}
                dot={{ fill: '#c6f042', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#c6f042' }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-3">GROUPS / LAST 30 DAYS</div>
        <div style={{ width: '100%', height: Math.max(180, groupData.length * 26) }}>
          <ResponsiveContainer>
            <BarChart data={groupData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2a2a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#8a8a8a' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8a8a8a', fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#3a3a3a' }} tickLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#c6f042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="font-mono text-[10px] text-[var(--ink-dim)] tracking-widest mb-2">RECENT DISTRIBUTION</div>
      <div className="flex gap-1 h-10 mb-8">
        {completed.slice(0, 30).reverse().map((s, i) => {
          const color = s.style === 'heavy' ? 'var(--accent)' : 'var(--info)'
          return (
            <div
              key={i}
              className="flex-1"
              style={{ background: color, opacity: 0.3 + Math.min(1, (s.plannedVolume || 10) / 30) * 0.7 }}
              title={s.type}
            />
          )
        })}
      </div>
    </div>
  )
}
