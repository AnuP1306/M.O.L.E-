import { useState, type FormEvent, type ReactNode } from 'react';
import { FileText, Minus, Plus, Radar, Save, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HindiPhoneticInput } from '../components/HindiPhoneticInput';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import type { MineSetup, RoverEntry, TeamMember } from '../types';

const WORKING_METHODS = [
  'Bord and Pillar',
  'Longwall',
  'Continuous miner',
  'Mixed methods',
];
const GASSINESS = ['Degree I', 'Degree II', 'Degree III'];
const DESIGNATIONS = [
  'Mine Manager',
  'Assistant Manager',
  'Safety Officer',
  'Rescue In-charge',
  'Ventilation Officer',
  'Control Room In-charge',
];
const PAYLOADS = [
  'Thermal camera',
  'Normal camera',
  'LiDAR',
  'Gas sensor array',
  'Front drill',
];
const MAX_ROVERS = 10;

interface FormState {
  workingMethod: string;
  gassiness: string;
  levels: string;
  maxDepth: string;
  workforce: string;
  shifts: string;
  team: TeamMember[];
  rovers: RoverEntry[];
  mapMethod: '' | 'UPLOAD' | 'SLAM';
  mapFileName: string;
}

type Errors = Record<string, string>;

const blankMember = (): TeamMember => ({
  name: '',
  designation: '',
  mobile: '',
  email: '',
});

const roverName = (index: number) =>
  `MOLE-${String(index + 1).padStart(2, '0')}`;

const blankRover = (index: number): RoverEntry => ({
  roverId: roverName(index),
  serial: '',
  payloads: ['Thermal camera', 'LiDAR', 'Gas sensor array'],
});

const positiveInt = (value: string) =>
  /^\d+$/.test(value.trim()) && Number(value) > 0;

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <i> *</i>}
      </span>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function SiteManagerSetup() {
  const { t, i18n } = useTranslation();
  const { user, selectedMine, mineSetups, saveMineSetup } = useSession();
  const saved = selectedMine ? mineSetups[selectedMine.id] : undefined;

  const [form, setForm] = useState<FormState>(() =>
    saved
      ? {
          workingMethod: saved.workingMethod,
          gassiness: saved.gassiness,
          levels: String(saved.levels),
          maxDepth: String(saved.maxDepth),
          workforce: String(saved.workforcePerShift),
          shifts: String(saved.shiftsPerDay),
          team: saved.team,
          rovers: saved.rovers,
          mapMethod: saved.mapMethod,
          mapFileName: saved.mapFileName ?? '',
        }
      : {
          workingMethod: '',
          gassiness: '',
          levels: '',
          maxDepth: '',
          workforce: '',
          shifts: '3',
          team: [
            {
              name: user?.name ?? '',
              designation: user?.designation ?? '',
              mobile: user?.mobile ?? '',
              email: user?.email ?? '',
            },
          ],
          rovers: [blankRover(0)],
          mapMethod: '',
          mapFileName: '',
        }
  );
  const [errors, setErrors] = useState<Errors>({});

  if (!user || !selectedMine) return null;

  const optionLabel = (value: string) =>
    t(`setupOptions.${value}`, { defaultValue: value });

  const clearError = (key: string) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const setField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearError(
      key === 'mapMethod' || key === 'mapFileName' ? 'map' : String(key)
    );
  };

  const updateMember = (
    index: number,
    patch: Partial<TeamMember>,
    errorKey: string
  ) => {
    setForm((current) => ({
      ...current,
      team: current.team.map((member, currentIndex) =>
        currentIndex === index ? { ...member, ...patch } : member
      ),
    }));
    clearError(errorKey);
  };

  const updateRover = (
    index: number,
    patch: Partial<RoverEntry>,
    errorKey: string
  ) => {
    setForm((current) => ({
      ...current,
      rovers: current.rovers.map((rover, currentIndex) =>
        currentIndex === index ? { ...rover, ...patch } : rover
      ),
    }));
    clearError(errorKey);
  };

  const setRoverCount = (count: number) => {
    const nextCount = Math.min(MAX_ROVERS, Math.max(1, count));
    setForm((current) => ({
      ...current,
      rovers: Array.from(
        { length: nextCount },
        (_, index) => current.rovers[index] ?? blankRover(index)
      ),
    }));
  };

  const togglePayload = (index: number, payload: string) => {
    const currentPayloads = form.rovers[index].payloads;
    const nextPayloads = currentPayloads.includes(payload)
      ? currentPayloads.filter((item) => item !== payload)
      : [...currentPayloads, payload];

    updateRover(
      index,
      { payloads: nextPayloads },
      `rover.${index}.payloads`
    );
  };

  const validate = (): Errors => {
    const next: Errors = {};

    if (!form.workingMethod) {
      next.workingMethod = t('siteSetup.errors.workingMethod');
    }
    if (!form.gassiness) {
      next.gassiness = t('siteSetup.errors.gassiness');
    }
    if (!positiveInt(form.levels)) {
      next.levels = t('siteSetup.errors.wholeNumber');
    }
    if (!positiveInt(form.maxDepth)) {
      next.maxDepth = t('siteSetup.errors.depth');
    }
    if (!positiveInt(form.workforce)) {
      next.workforce = t('siteSetup.errors.wholeNumber');
    }
    if (!positiveInt(form.shifts) || Number(form.shifts) > 4) {
      next.shifts = t('siteSetup.errors.shifts');
    }

    form.team.forEach((member, index) => {
      if (!member.name.trim()) {
        next[`team.${index}.name`] = t('siteSetup.errors.name');
      }
      if (!member.designation.trim()) {
        next[`team.${index}.designation`] = t('siteSetup.errors.designation');
      }
      if (
        !/^(\+91)?[6-9]\d{9}$/.test(
          member.mobile.replace(/[\s-]/g, '')
        )
      ) {
        next[`team.${index}.mobile`] = t('siteSetup.errors.mobile');
      }
      if (
        member.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())
      ) {
        next[`team.${index}.email`] = t('siteSetup.errors.email');
      }
    });

    const seen = new Set<string>();
    form.rovers.forEach((rover, index) => {
      const id = rover.roverId.trim().toLowerCase();

      if (!id) {
        next[`rover.${index}.id`] = t('siteSetup.errors.roverId');
      } else if (seen.has(id)) {
        next[`rover.${index}.id`] = t('siteSetup.errors.uniqueRoverId');
      }
      seen.add(id);

      if (!rover.serial.trim()) {
        next[`rover.${index}.serial`] = t('siteSetup.errors.serial');
      }
      if (!rover.payloads.length) {
        next[`rover.${index}.payloads`] = t('siteSetup.errors.payload');
      }
    });

    if (!form.mapMethod) {
      next.map = t('siteSetup.errors.mapMethod');
    } else if (form.mapMethod === 'UPLOAD' && !form.mapFileName) {
      next.map = t('siteSetup.errors.mapFile');
    }

    return next;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const found = validate();
    setErrors(found);

    if (Object.keys(found).length) {
      document
        .querySelector('.has-error')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const setup: MineSetup = {
      mineId: selectedMine.id,
      completedAt: new Date().toISOString(),
      workingMethod: form.workingMethod,
      gassiness: form.gassiness,
      levels: Number(form.levels),
      maxDepth: Number(form.maxDepth),
      workforcePerShift: Number(form.workforce),
      shiftsPerDay: Number(form.shifts),
      team: form.team.map((member) => ({
        name: member.name.trim(),
        designation: member.designation.trim(),
        mobile: member.mobile.trim(),
        email: member.email.trim(),
      })),
      rovers: form.rovers.map((rover) => ({
        ...rover,
        roverId: rover.roverId.trim(),
        serial: rover.serial.trim(),
      })),
      mapMethod: form.mapMethod as 'UPLOAD' | 'SLAM',
      mapFileName:
        form.mapMethod === 'UPLOAD' ? form.mapFileName : undefined,
    };

    saveMineSetup(setup);
    navigate('/site-manager');
  };

  return (
    <div className="app shell">
      <WorkspaceHeader />

      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t('landing.roles.SITE_MANAGER.label')} ·{' '}
              {selectedMine.name.toUpperCase()}
            </div>
            <h1>{t('siteSetup.title')}</h1>
          </div>
          {saved && (
            <button
              className="btn small"
              type="button"
              onClick={() => navigate('/site-manager')}
            >
              <X size={13} /> {t('actions.cancel').toUpperCase()}
            </button>
          )}
        </div>

        <form className="access-form" onSubmit={submit} noValidate>
          <section className="panel">
            <div className="panel-title">
              <span>01</span>
              <b>{t('siteSetup.operationalDetails')}</b>
              <i />
            </div>
            <div className="form-grid">
              <Field label={t('siteSetup.mineName')}>
                <input value={selectedMine.name} readOnly />
              </Field>
              <Field label={t('siteSetup.mineCode')}>
                <input value={selectedMine.officialMineCode} readOnly />
              </Field>
              <Field
                label={t('siteSetup.workingMethod')}
                required
                error={errors.workingMethod}
              >
                <select
                  value={form.workingMethod}
                  onChange={(event) =>
                    setField('workingMethod', event.target.value)
                  }
                >
                  <option value="">{t('siteSetup.select')}</option>
                  {WORKING_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {optionLabel(method)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={t('siteSetup.gassiness')}
                required
                error={errors.gassiness}
              >
                <select
                  value={form.gassiness}
                  onChange={(event) =>
                    setField('gassiness', event.target.value)
                  }
                >
                  <option value="">{t('siteSetup.select')}</option>
                  {GASSINESS.map((degree) => (
                    <option key={degree} value={degree}>
                      {optionLabel(degree)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={t('siteSetup.levels')}
                required
                error={errors.levels}
              >
                <input
                  inputMode="numeric"
                  value={form.levels}
                  onChange={(event) =>
                    setField('levels', event.target.value)
                  }
                />
              </Field>
              <Field
                label={t('siteSetup.maxDepth')}
                required
                error={errors.maxDepth}
              >
                <input
                  inputMode="numeric"
                  value={form.maxDepth}
                  onChange={(event) =>
                    setField('maxDepth', event.target.value)
                  }
                />
              </Field>
              <Field
                label={t('siteSetup.workersPerShift')}
                required
                error={errors.workforce}
              >
                <input
                  inputMode="numeric"
                  value={form.workforce}
                  onChange={(event) =>
                    setField('workforce', event.target.value)
                  }
                />
              </Field>
              <Field
                label={t('siteSetup.shiftsPerDay')}
                required
                error={errors.shifts}
              >
                <input
                  inputMode="numeric"
                  value={form.shifts}
                  onChange={(event) =>
                    setField('shifts', event.target.value)
                  }
                />
              </Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>02</span>
              <b>{t('siteSetup.team')}</b>
              <i />
            </div>

            {i18n.resolvedLanguage !== 'hi' && (
              <datalist id="designations">
                {DESIGNATIONS.map((designation) => (
                  <option key={designation} value={designation} />
                ))}
              </datalist>
            )}

            {form.team.map((member, index) => (
              <div className="repeat-row" key={index}>
                <div className="repeat-head">
                  <b>
                    {t('siteSetup.person')} {' '}
                    {String(index + 1).padStart(2, '0')}
                  </b>
                  {form.team.length > 1 && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          team: current.team.filter(
                            (_, currentIndex) => currentIndex !== index
                          ),
                        }))
                      }
                    >
                      <X size={12} /> {t('siteSetup.remove')}
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <Field
                    label={t('siteSetup.fullName')}
                    required
                    error={errors[`team.${index}.name`]}
                  >
                    <HindiPhoneticInput
                      value={member.name}
                      onChange={(value) =>
                        updateMember(
                          index,
                          { name: value },
                          `team.${index}.name`
                        )
                      }
                    />
                  </Field>
                  <Field
                    label={t('siteSetup.designation')}
                    required
                    error={errors[`team.${index}.designation`]}
                  >
                    <HindiPhoneticInput
                      list={
                        i18n.resolvedLanguage === 'hi'
                          ? undefined
                          : 'designations'
                      }
                      value={member.designation}
                      onChange={(value) =>
                        updateMember(
                          index,
                          { designation: value },
                          `team.${index}.designation`
                        )
                      }
                    />
                  </Field>
                  <Field
                    label={t('siteSetup.mobile')}
                    required
                    error={errors[`team.${index}.mobile`]}
                  >
                    <input
                      type="tel"
                      value={member.mobile}
                      onChange={(event) =>
                        updateMember(
                          index,
                          { mobile: event.target.value },
                          `team.${index}.mobile`
                        )
                      }
                    />
                  </Field>
                  <Field
                    label={t('siteSetup.email')}
                    error={errors[`team.${index}.email`]}
                  >
                    <input
                      type="email"
                      value={member.email}
                      onChange={(event) =>
                        updateMember(
                          index,
                          { email: event.target.value },
                          `team.${index}.email`
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn small"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  team: [...current.team, blankMember()],
                }))
              }
            >
              <Plus size={13} /> {t('siteSetup.addPerson')}
            </button>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>03</span>
              <b>{t('siteSetup.rovers')}</b>
              <i />
            </div>
            <div className="stepper-row">
              <span className="field-label">
                {t('siteSetup.roverCount')}
              </span>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setRoverCount(form.rovers.length - 1)}
                  disabled={form.rovers.length <= 1}
                  aria-label={t('siteSetup.fewerRovers')}
                >
                  <Minus size={14} />
                </button>
                <b>{form.rovers.length}</b>
                <button
                  type="button"
                  onClick={() => setRoverCount(form.rovers.length + 1)}
                  disabled={form.rovers.length >= MAX_ROVERS}
                  aria-label={t('siteSetup.moreRovers')}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {form.rovers.map((rover, index) => (
              <div className="repeat-row" key={index}>
                <div className="repeat-head">
                  <b>
                    {t('siteSetup.rover')} {' '}
                    {String(index + 1).padStart(2, '0')}
                  </b>
                </div>
                <div className="form-grid">
                  <Field
                    label={t('siteSetup.roverId')}
                    required
                    error={errors[`rover.${index}.id`]}
                  >
                    <input
                      value={rover.roverId}
                      onChange={(event) =>
                        updateRover(
                          index,
                          { roverId: event.target.value },
                          `rover.${index}.id`
                        )
                      }
                    />
                  </Field>
                  <Field
                    label={t('siteSetup.serial')}
                    required
                    error={errors[`rover.${index}.serial`]}
                  >
                    <input
                      value={rover.serial}
                      onChange={(event) =>
                        updateRover(
                          index,
                          { serial: event.target.value },
                          `rover.${index}.serial`
                        )
                      }
                    />
                  </Field>
                </div>
                <div
                  className={`chip-group ${
                    errors[`rover.${index}.payloads`] ? 'has-error' : ''
                  }`}
                >
                  <span className="field-label">
                    {t('siteSetup.payloads')}
                  </span>
                  <div>
                    {PAYLOADS.map((payload) => (
                      <button
                        type="button"
                        key={payload}
                        className={`chip ${
                          rover.payloads.includes(payload) ? 'on' : ''
                        }`}
                        onClick={() => togglePayload(index, payload)}
                        aria-pressed={rover.payloads.includes(payload)}
                      >
                        {optionLabel(payload)}
                      </button>
                    ))}
                  </div>
                  {errors[`rover.${index}.payloads`] && (
                    <small className="field-error">
                      {errors[`rover.${index}.payloads`]}
                    </small>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>04</span>
              <b>{t('siteSetup.mineMap')}</b>
              <i />
            </div>
            <div
              className={`role-picks two ${
                errors.map ? 'has-error' : ''
              }`}
              role="radiogroup"
              aria-label={t('siteSetup.mapSource')}
            >
              <button
                type="button"
                role="radio"
                aria-checked={form.mapMethod === 'UPLOAD'}
                className={`role-pick ${
                  form.mapMethod === 'UPLOAD' ? 'selected' : ''
                }`}
                onClick={() => setField('mapMethod', 'UPLOAD')}
              >
                <b>
                  <Upload size={13} /> {t('siteSetup.uploadMap')}
                </b>
                <span>{t('siteSetup.uploadDescription')}</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={form.mapMethod === 'SLAM'}
                className={`role-pick ${
                  form.mapMethod === 'SLAM' ? 'selected' : ''
                }`}
                onClick={() => setField('mapMethod', 'SLAM')}
              >
                <b>
                  <Radar size={13} /> {t('siteSetup.startSlam')}
                </b>
                <span>{t('siteSetup.slamDescription')}</span>
              </button>
            </div>

            {form.mapMethod === 'UPLOAD' && (
              <div className="map-upload">
                <label className="dropzone">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
                    onChange={(event) =>
                      setField(
                        'mapFileName',
                        event.target.files?.[0]?.name ?? ''
                      )
                    }
                  />
                  {form.mapFileName ? (
                    <span className="dropzone-file">
                      <FileText size={16} /> {form.mapFileName}
                    </span>
                  ) : (
                    <span>
                      <Upload size={16} /> {t('siteSetup.chooseMapFile')}
                    </span>
                  )}
                </label>
              </div>
            )}
            {errors.map && (
              <small className="field-error">{errors.map}</small>
            )}
          </section>

          <div className="form-actions">
            <button type="submit" className="btn primary big">
              <Save size={15} />{' '}
              {t(saved ? 'siteSetup.saveSetup' : 'siteSetup.completeSetup')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}