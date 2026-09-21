import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = ['Checking officer service ID', 'Confirming mine details', 'Assigning role access'];
export const VERIFY_STEP_MS = 800;

/** Full-screen modal shown while an access request is being processed. */
export function VerificationModal({ phase }: { phase: 'verifying' | 'verified' }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (phase !== 'verifying') return;
    const timers = STEPS.map((_, i) => window.setTimeout(() => setDone(i + 1), (i + 1) * VERIFY_STEP_MS - 300));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase]);

  return (
    <div className="verify-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className={`verify-modal ${phase}`}>
        {phase === 'verifying' ? (
          <>
            <Loader2 size={40} className="verify-spin" />
            <p className="verify-title">VERIFYING OFFICIAL DETAILS...</p>
            <ul className="verify-steps">
              {STEPS.map((step, i) => (
                <li key={step} className={i < done ? 'done' : i === done ? 'active' : ''}>
                  <span className="verify-dot" />{step}
                </li>
              ))}
            </ul>
            <div className="verify-bar"><i style={{ width: `${Math.max(8, (done / STEPS.length) * 100)}%` }} /></div>
          </>
        ) : (
          <>
            <CheckCircle2 size={44} className="verify-check" />
            <p className="verify-title ok">OFFICIAL DETAILS VERIFIED</p>
            <p className="verify-sub">ACCESS CREATED SUCCESSFULLY</p>
          </>
        )}
      </div>
    </div>
  );
}
