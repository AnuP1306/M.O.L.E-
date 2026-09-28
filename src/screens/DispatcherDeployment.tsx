import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Plus, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HindiPhoneticInput } from '../components/HindiPhoneticInput';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useSession } from '../state/SessionContext';
import type { WorkerAssignment } from '../types';

const SHIFTS = [
  'Shift A · 06:00–14:00',
  'Shift B · 14:00–22:00',
  'Shift C · 22:00–06:00',
];

const TRADES = [
  'Miner / Loader',
  'Driller',
  'Electrician',
  'Mechanic',
  'Overman',
  'Sirdar',
  'Timberman',
  'Surveyor',
  'Other',
];

const blankWorker = (): WorkerAssignment => ({
  name: '',
  workerId: '',
  trade: TRADES[0],
  area: '',
});

const today = () => new Date().toLocaleDateString('en-CA');
type Errors = Record<string, string>;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <i> *</i>}
      </span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function DispatcherDeployment() {
  const { t, i18n } = useTranslation();
  const { selectedMine, deployments, saveDeployment } = useSession();

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState(SHIFTS[0]);
  const [incharge, setIncharge] = useState('');
  const [workers, setWorkers] = useState<WorkerAssignment[]>([
    blankWorker(),
    blankWorker(),
    blankWorker(),
  ]);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState('');

  if (!selectedMine) return null;

  const shiftLabel = (value: string) => {
    const index = SHIFTS.indexOf(value);
    return index < 0
      ? value
      : t(`dispatcher.shifts.${index}`, { defaultValue: value });
  };

  const tradeLabel = (value: string) => {
    const index = TRADES.indexOf(value);
    return index < 0
      ? value
      : t(`dispatcher.trades.${index}`, { defaultValue: value });
  };

  const recent = deployments
    .filter((deployment) => deployment.mineId === selectedMine.id)
    .slice(0, 6);

  const clear = (key: string) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateWorker = (
    index: number,
    patch: Partial<WorkerAssignment>,
    key: string
  ) => {
    setWorkers((current) =>
      current.map((worker, currentIndex) =>
        currentIndex === index ? { ...worker, ...patch } : worker
      )
    );
    clear(key);
    setNotice('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = {};

    if (!date) found.date = t('dispatcher.errors.date');
    if (!incharge.trim()) {
      found.incharge = t('dispatcher.errors.incharge');
    }

    const filled = workers
      .map((worker, index) => ({ worker, index }))
      .filter(
        ({ worker }) =>
          worker.name.trim() ||
          worker.workerId.trim() ||
          worker.area.trim()
      );

    if (!filled.length) {
      found.workers = t('dispatcher.errors.workers');
    }

    filled.forEach(({ worker, index }) => {
      if (!worker.name.trim()) {
        found[`w.${index}.name`] = t('dispatcher.errors.required');
      }
      if (!worker.workerId.trim()) {
        found[`w.${index}.id`] = t('dispatcher.errors.required');
      }
      if (!worker.area.trim()) {
        found[`w.${index}.area`] = t('dispatcher.errors.required');
      }
    });

    setErrors(found);
    if (Object.keys(found).length) {
      document
        .querySelector('.has-error, .form-error')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const result = saveDeployment({
      date,
      shift,
      shiftIncharge: incharge.trim(),
      remarks: remarks.trim(),
      workers: filled.map(({ worker }) => ({
        name: worker.name.trim(),
        workerId: worker.workerId.trim(),
        trade: worker.trade,
        area: worker.area.trim(),
      })),
    });

    if (!result) return;

    setNotice(
      t(
        result.updated
          ? 'dispatcher.updated'
          : 'dispatcher.recorded',
        {
          count: result.deployment.workers.length,
          shift: shiftLabel(shift),
        }
      )
    );
    setWorkers([blankWorker(), blankWorker(), blankWorker()]);
    setRemarks('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app shell">
      <WorkspaceHeader />

      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t('landing.roles.DISPATCHER.label')} ·{' '}
              {selectedMine.name.toUpperCase()}
            </div>
            <h1>{t('dispatcher.title')}</h1>
          </div>
        </div>

        {notice && (
          <div className="form-success" role="status">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <form className="access-form" onSubmit={submit} noValidate>
          <section className="panel">
            <div className="panel-title">
              <span>01</span>
              <b>{t('dispatcher.shiftDetails')}</b>
              <i />
            </div>
            <div className="form-grid">
              <Field
                label={t('dispatcher.date')}
                required
                error={errors.date}
              >
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    clear('date');
                    setNotice('');
                  }}
                />
              </Field>

              <Field label={t('dispatcher.shift')} required>
                <select
                  value={shift}
                  onChange={(event) => {
                    setShift(event.target.value);
                    setNotice('');
                  }}
                >
                  {SHIFTS.map((value) => (
                    <option key={value} value={value}>
                      {shiftLabel(value)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={t('dispatcher.incharge')}
                required
                error={errors.incharge}
              >
                <HindiPhoneticInput
                  value={incharge}
                  onChange={(value) => {
                    setIncharge(value);
                    clear('incharge');
                  }}
                />
              </Field>

              <Field label={t('dispatcher.mine')}>
                <input value={selectedMine.name} readOnly />
              </Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>02</span>
              <b>
                {t('dispatcher.personnel')} ·{' '}
                {workers.filter((worker) => worker.name.trim()).length}
              </b>
              <i />
            </div>

            {errors.workers && (
              <div className="form-error">{errors.workers}</div>
            )}

            <div className="roster">
              <div className="roster-head">
                <span>{t('dispatcher.workerName')}</span>
                <span>{t('dispatcher.workerId')}</span>
                <span>{t('dispatcher.trade')}</span>
                <span>{t('dispatcher.area')}</span>
                <span />
              </div>

              {workers.map((worker, index) => (
                <div className="roster-row" key={index}>
                  <label
                    className={
                      errors[`w.${index}.name`] ? 'has-error' : ''
                    }
                  >
                    <HindiPhoneticInput
                      aria-label={t('dispatcher.workerName')}
                      placeholder={t('dispatcher.namePlaceholder')}
                      value={worker.name}
                      onChange={(value) =>
                        updateWorker(
                          index,
                          { name: value },
                          `w.${index}.name`
                        )
                      }
                    />
                  </label>

                  <label
                    className={
                      errors[`w.${index}.id`] ? 'has-error' : ''
                    }
                  >
                    <input
                      aria-label={t('dispatcher.workerId')}
                      placeholder={t('dispatcher.idPlaceholder')}
                      value={worker.workerId}
                      onChange={(event) =>
                        updateWorker(
                          index,
                          { workerId: event.target.value },
                          `w.${index}.id`
                        )
                      }
                    />
                  </label>

                  <label>
                    <select
                      aria-label={t('dispatcher.trade')}
                      value={worker.trade}
                      onChange={(event) =>
                        updateWorker(
                          index,
                          { trade: event.target.value },
                          `w.${index}.trade`
                        )
                      }
                    >
                      {TRADES.map((trade) => (
                        <option key={trade} value={trade}>
                          {tradeLabel(trade)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label
                    className={
                      errors[`w.${index}.area`] ? 'has-error' : ''
                    }
                  >
                    <HindiPhoneticInput
                      aria-label={t('dispatcher.area')}
                      placeholder={t('dispatcher.areaPlaceholder')}
                      value={worker.area}
                      onChange={(value) =>
                        updateWorker(
                          index,
                          { area: value },
                          `w.${index}.area`
                        )
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="row-remove"
                    onClick={() =>
                      setWorkers((current) =>
                        current.length > 1
                          ? current.filter(
                              (_, currentIndex) => currentIndex !== index
                            )
                          : current
                      )
                    }
                    aria-label={t('dispatcher.removeWorker')}
                    disabled={workers.length <= 1}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn small"
              onClick={() =>
                setWorkers((current) => [...current, blankWorker()])
              }
            >
              <Plus size={13} /> {t('dispatcher.addWorker')}
            </button>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>03</span>
              <b>{t('dispatcher.remarks')}</b>
              <i />
            </div>
            <label className="field">
              <textarea
                rows={3}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder={t('dispatcher.remarksPlaceholder')}
              />
            </label>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn primary big">
              <Send size={15} /> {t('dispatcher.confirm')}
            </button>
          </div>
        </form>

        {recent.length > 0 && (
          <section className="panel recent-panel">
            <div className="panel-title">
              <span>{t('dispatcher.log')}</span>
              <b>{t('dispatcher.recent')}</b>
              <i />
            </div>

            {recent.map((deployment) => (
              <div className="kv" key={deployment.id}>
                <span>
                  {new Date(
                    `${deployment.date}T00:00:00`
                  ).toLocaleDateString(
                    i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }
                  )}{' '}
                  · {shiftLabel(deployment.shift)}
                </span>
                <b>
                  {t('dispatcher.workerCount', {
                    count: deployment.workers.length,
                  })}
                  <small className="kv-sub">
                    {t('dispatcher.inchargeName', {
                      name: deployment.shiftIncharge,
                    })}
                  </small>
                </b>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}