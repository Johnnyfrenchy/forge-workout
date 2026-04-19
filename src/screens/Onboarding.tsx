import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { Logo } from '../components/Logo'
import type { Settings } from '../data/constants'

export function Onboarding() {
  const { completeOnboarding } = useApp()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ weeklyTarget: 4, adaptiveDeload: true, strictRest: true })

  const finish = () => completeOnboarding({
    ...data,
    createdAt: new Date().toISOString(),
  } as Settings)

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full">
        <div className="anim-fade-up">
          <Logo />
          <div className="mt-1 font-mono text-[10px] text-[var(--ink-dim)] tracking-widest">WORKOUT PROTOCOL / v1</div>
        </div>

        <div className="mt-10 anim-fade-up">
          {step === 0 && (
            <>
              <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest mb-3">STEP 01 / 03</div>
              <h1 className="font-display text-4xl leading-tight">Protocole<br/>d'entraînement<br/>automatique.</h1>
              <p className="mt-6 text-[var(--ink-dim)] text-sm leading-relaxed">
                Détection de fréquence, progression automatique, tracking par série.<br/>
                Zéro padding. Mathématiquement cohérent.
              </p>
              <div className="mt-10">
                <button onClick={() => setStep(1)} className="btn btn-primary w-full">→ COMMENCER</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest mb-3">STEP 02 / 03</div>
              <h1 className="font-display text-3xl leading-tight">Ton objectif<br/>hebdomadaire.</h1>
              <p className="mt-3 text-[var(--ink-dim)] text-sm">Combien de séances vises-tu par semaine ? (sert de seed pendant les 14 premiers jours)</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setData(d => ({ ...d, weeklyTarget: n }))}
                    className={`p-5 border ${data.weeklyTarget === n ? 'border-[var(--accent)] bg-[var(--bg-2)]' : 'border-[var(--line)] bg-[var(--bg-2)]'}`}
                  >
                    <div className="font-display text-3xl">{n}</div>
                    <div className="font-mono text-[10px] text-[var(--ink-dim)] mt-1 tracking-widest">
                      {n === 2 ? 'FULL BODY' : n === 3 ? 'PPL' : 'UPPER/LOWER'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-2">
                <button onClick={() => setStep(0)} className="btn btn-ghost flex-1">← RETOUR</button>
                <button onClick={() => setStep(2)} className="btn btn-primary flex-1">SUIVANT →</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="font-mono text-[10px] text-[var(--accent)] tracking-widest mb-3">STEP 03 / 03</div>
              <h1 className="font-display text-3xl leading-tight">Règles<br/>du protocole.</h1>
              <div className="mt-6 space-y-3">
                <label className="flex items-start gap-3 p-4 card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.adaptiveDeload}
                    onChange={e => setData(d => ({ ...d, adaptiveDeload: e.target.checked }))}
                    className="mt-1 accent-[var(--accent)] w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-display">Deload adaptative</div>
                    <div className="font-mono text-[11px] text-[var(--ink-dim)] mt-1">
                      Propose un deload après 3 semaines consécutives à RPE élevé.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-4 card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.strictRest}
                    onChange={e => setData(d => ({ ...d, strictRest: e.target.checked }))}
                    className="mt-1 accent-[var(--accent)] w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-display">Repos 48h strict</div>
                    <div className="font-mono text-[11px] text-[var(--ink-dim)] mt-1">
                      Refuse de proposer un groupe musculaire trop récent (&lt; 48h).
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-8 flex gap-2">
                <button onClick={() => setStep(1)} className="btn btn-ghost flex-1">← RETOUR</button>
                <button onClick={finish} className="btn btn-primary flex-1">→ FORGE</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
