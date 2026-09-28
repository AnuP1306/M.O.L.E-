import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STEPS = ['officerId', 'mineDetails', 'roleAccess'] as const;
export const VERIFY_STEP_MS = 800;

export function VerificationModal({
  phase,
}: {
  phase: 'verifying' | 'verified';
}) {
  const { t } = useTranslation();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (phase !== 'verifying') return;

    const timers = STEPS.map((_, index) =>
      window.setTimeout(
        () => setDone(index + 1),
        (index + 1) * VERIFY_STEP_MS - 300
      )
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase]);

  return (
    <div
      className="verify-overlay"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className={`verify-modal ${phase}`}>
        {phase === 'verifying' ? (
          <>
            <Loader2 size={40} className="verify-spin" />
            <p className="verify-title">{t('verification.verifying')}</p>

            <ul className="verify-steps">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className={
                    index < done ? 'done' : index === done ? 'active' : ''
                  }
                >
                  <span className="verify-dot" />
                  {t(`verification.steps.${step}`)}
                </li>
              ))}
            </ul>

            <div className="verify-bar">
              <i
                style={{
                  width: `${Math.max(8, (done / STEPS.length) * 100)}%`,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={44} className="verify-check" />
            <p className="verify-title ok">{t('verification.verified')}</p>
            <p className="verify-sub">{t('verification.created')}</p>
          </>
        )}
      </div>
    </div>
  );
}