import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import {
  CheckCircle2,
  FileImage,
  LayoutGrid,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { HindiPhoneticInput } from '../components/HindiPhoneticInput';
import { WorkspaceHeader } from '../components/WorkspaceHeader';

import {
  DEPLOYMENT_REMARK_SAMPLES,
  pick,
  randomInt,
  randomName,
} from '../data/autofill';

import { useSession } from '../state/SessionContext';

import type {
  Deployment,
  LocationAllocation,
  LocationType,
  MineSetup,
} from '../types';

const SHIFTS = [
  'Shift A · 06:00–14:00',
  'Shift B · 14:00–22:00',
  'Shift C · 22:00–06:00',
];

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  PANEL: 'PANEL',
  GALLERY: 'GALLERY',
  WORKING_AREA: 'WORKING AREA',
};

const LOCATION_TYPES: LocationType[] = [
  'PANEL',
  'GALLERY',
  'WORKING_AREA',
];

const today = () => new Date().toLocaleDateString('en-CA');

let idSeed = 0;

const newLocationId = () =>
  `loc-${Date.now().toString(36)}-${(idSeed++).toString(36)}`;

/**
 * Seed the roster with the panels / galleries / working areas
 * declared by the Site Manager during mine setup.
 */
function buildDefaultLocations(
  setup?: MineSetup
): LocationAllocation[] {
  if (!setup) return [];

  const rows: LocationAllocation[] = [];

  for (let i = 1; i <= setup.panels; i += 1) {
    rows.push({
      id: newLocationId(),
      name: `Panel ${i}`,
      type: 'PANEL',
      workers: 0,
    });
  }

  for (let i = 1; i <= setup.galleries; i += 1) {
    rows.push({
      id: newLocationId(),
      name: `Gallery ${i}`,
      type: 'GALLERY',
      workers: 0,
    });
  }

  for (let i = 1; i <= setup.workingAreas; i += 1) {
    rows.push({
      id: newLocationId(),
      name: `Working Area ${i}`,
      type: 'WORKING_AREA',
      workers: 0,
    });
  }

  return rows;
}

const blankLocation = (
  type: LocationType,
  index: number
): LocationAllocation => ({
  id: newLocationId(),
  name: `${LOCATION_TYPE_LABELS[type]} ${index}`,
  type,
  workers: 0,
});

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

      {error && (
        <small className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

export function DispatcherDeployment() {
  const { t, i18n } = useTranslation();

  const {
    selectedMine,
    mineSetups,
    deployments,
    saveDeployment,
  } = useSession();

  const setup = selectedMine
    ? mineSetups[selectedMine.id]
    : undefined;

  const [phase, setPhase] = useState<'form' | 'confirm'>(
    'form'
  );

  const [viewing, setViewing] =
    useState<Deployment | null>(null);

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState(SHIFTS[0]);
  const [incharge, setIncharge] = useState('');
  const [remarks, setRemarks] = useState('');

  const [locations, setLocations] = useState<
    LocationAllocation[]
  >(() => buildDefaultLocations(setup));

  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState('');

  const [attendanceProcessing, setAttendanceProcessing] =
    useState(false);

  const attendanceImportRef = useRef(false);

  const attendanceFileRef =
    useRef<HTMLInputElement | null>(null);

  /*
   * If today's deployment already exists, open the Shift Summary
   * directly when the dispatcher enters this page.
   */
  useEffect(() => {
    if (!selectedMine) return;

    const existingToday = deployments.find(
      (deployment) =>
        deployment.mineId === selectedMine.id &&
        deployment.date === today()
    );

    if (!existingToday) return;

    setDate(existingToday.date);
    setShift(existingToday.shift);
    setIncharge(existingToday.shiftIncharge);
    setRemarks(existingToday.remarks);
    setLocations(existingToday.allocations);
    setViewing(existingToday);
    setPhase('confirm');
  }, [selectedMine?.id]);

  /*
   * When the selected date + shift already has a deployment,
   * load it so the dispatcher edits the existing deployment.
   */
  useEffect(() => {
    if (!selectedMine) return;

    /*
     * Attendance upload intentionally changes date/shift.
     * Prevent this effect from immediately overwriting the
     * imported values.
     */
    if (attendanceImportRef.current) {
      attendanceImportRef.current = false;
      return;
    }

    const existing = deployments.find(
      (deployment) =>
        deployment.mineId === selectedMine.id &&
        deployment.date === date &&
        deployment.shift === shift
    );

    if (existing) {
      setIncharge(existing.shiftIncharge);
      setRemarks(existing.remarks);
      setLocations(existing.allocations);
    } else {
      setIncharge('');
      setRemarks('');
      setLocations(buildDefaultLocations(setup));
    }

    setErrors({});
    setNotice('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMine?.id, date, shift]);

  if (!selectedMine) return null;

  const recent = deployments
    .filter(
      (deployment) =>
        deployment.mineId === selectedMine.id
    )
    .slice(0, 6);

  const shiftLabel = (value: string) => {
    const index = SHIFTS.indexOf(value);

    if (index < 0) return value;

    return t(`dispatcher.shifts.${index}`, {
      defaultValue: value,
    });
  };

  const clear = (key: string) => {
    setErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];

      return next;
    });
  };

  const addLocation = (type: LocationType) => {
    const countOfType = locations.filter(
      (location) => location.type === type
    ).length;

    setLocations((list) => [
      ...list,
      blankLocation(type, countOfType + 1),
    ]);

    setNotice('');
  };

  const updateLocation = (
    id: string,
    patch: Partial<LocationAllocation>,
    key: string
  ) => {
    setLocations((list) =>
      list.map((location) =>
        location.id === id
          ? { ...location, ...patch }
          : location
      )
    );

    clear(key);
    setNotice('');
  };

  const removeLocation = (id: string) => {
    setLocations((list) =>
      list.filter((location) => location.id !== id)
    );

    setNotice('');
  };

  const autoFill = () => {
    setIncharge((value) =>
      value || randomName()
    );

    setRemarks((value) =>
      value || pick(DEPLOYMENT_REMARK_SAMPLES)
    );

    setLocations((list) => {
      const base = list.length
        ? list
        : buildDefaultLocations(setup);

      return base.map((location) => ({
        ...location,
        workers:
          location.workers ||
          randomInt(3, 18),
      }));
    });

    setErrors({});
    setNotice('');
  };

  /*
   * Prototype attendance-log import.
   *
   * The current post-disaster implementation simulates OCR
   * extraction rather than actually reading text from the image.
   */
  const handleAttendanceUpload = (file?: File) => {
    if (!file || attendanceProcessing) return;

    setAttendanceProcessing(true);
    setNotice('');
    setErrors({});

    window.setTimeout(() => {
      const base = buildDefaultLocations(setup);

      const fallback = [
        blankLocation('PANEL', 1),
        blankLocation('GALLERY', 1),
        blankLocation('WORKING_AREA', 1),
      ];

      const source = base.length
        ? base
        : fallback;

      attendanceImportRef.current = true;

      setDate(today());
      setShift(SHIFTS[0]);
      setIncharge(randomName());

      setRemarks(
        t('dispatcher.attendanceImported', {
          defaultValue:
            'Attendance log imported for the selected shift.',
        })
      );

      setLocations(
        source.map((location) => ({
          ...location,
          workers: randomInt(5, 20),
        }))
      );

      setAttendanceProcessing(false);
    }, 1800);
  };

  const totalWorkers = (
    list: LocationAllocation[]
  ) =>
    list.reduce(
      (sum, location) =>
        sum + (Number(location.workers) || 0),
      0
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const found: Errors = {};

    if (!date) {
      found.date = t('dispatcher.errors.date', {
        defaultValue: 'Select the deployment date',
      });
    }

    if (!incharge.trim()) {
      found.incharge = t(
        'dispatcher.errors.incharge',
        {
          defaultValue:
            'Shift in-charge is required',
        }
      );
    }

    if (!locations.length) {
      found.locations = t(
        'dispatcher.errors.locations',
        {
          defaultValue:
            'Add at least one location',
        }
      );
    }

    locations.forEach((location) => {
      if (!location.name.trim()) {
        found[`loc.${location.id}.name`] =
          t('dispatcher.errors.required', {
            defaultValue: 'Required',
          });
      }

      if (
        !Number.isInteger(
          Number(location.workers)
        ) ||
        Number(location.workers) < 0
      ) {
        found[`loc.${location.id}.workers`] =
          t('dispatcher.errors.workerCount', {
            defaultValue:
              'Enter 0 or more',
          });
      }
    });

    if (
      !found.locations &&
      totalWorkers(locations) <= 0
    ) {
      found.locations = t(
        'dispatcher.errors.workerAllocation',
        {
          defaultValue:
            'Allocate at least one worker to a location',
        }
      );
    }

    setErrors(found);

    if (Object.keys(found).length) {
      document
        .querySelector(
          '.has-error, .form-error'
        )
        ?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });

      return;
    }

    const result = saveDeployment({
      date,
      shift,
      shiftIncharge: incharge.trim(),
      remarks: remarks.trim(),

      allocations: locations.map((location) => ({
        ...location,
        name: location.name.trim(),
        workers:
          Number(location.workers) || 0,
      })),
    });

    if (!result) return;

    const workerCount = totalWorkers(
      result.deployment.allocations
    );

    setNotice(
      t(
        result.updated
          ? 'dispatcher.updated'
          : 'dispatcher.recorded',
        {
          count: workerCount,
          shift: shiftLabel(shift),
          defaultValue: `${
            result.updated
              ? 'DEPLOYMENT UPDATED'
              : 'DEPLOYMENT RECORDED'
          } · ${workerCount} WORKERS`,
        }
      )
    );

    setViewing(result.deployment);
    setPhase('confirm');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const editAgain = () => {
    if (viewing) {
      setDate(viewing.date);
      setShift(viewing.shift);
      setIncharge(viewing.shiftIncharge);
      setRemarks(viewing.remarks);
      setLocations(viewing.allocations);
    }

    setPhase('form');
    setNotice('');
    setErrors({});
  };

  const viewRecent = (deployment: Deployment) => {
    setViewing(deployment);
    setPhase('confirm');
    setNotice('');
  };

  /*
   * ----------------------------------------------------------
   * SHIFT SUMMARY / CONFIRMATION VIEW
   * ----------------------------------------------------------
   */

  if (phase === 'confirm' && viewing) {
    const formattedDate =
      new Date(
        `${viewing.date}T00:00:00`
      ).toLocaleDateString(
        i18n.resolvedLanguage === 'hi'
          ? 'hi-IN'
          : 'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      );

    return (
      <div className="app shell">
        <WorkspaceHeader />

        <main className="shell-main form-page wide">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {t(
                  'landing.roles.DISPATCHER.label',
                  {
                    defaultValue:
                      'SHIFT OPERATOR',
                  }
                )}{' '}
                ·{' '}
                {selectedMine.name.toUpperCase()}
              </div>

              <h1>
                {t(
                  'dispatcher.shiftSummary',
                  {
                    defaultValue:
                      'SHIFT SUMMARY',
                  }
                )}
              </h1>
            </div>
          </div>

          {notice && (
            <div
              className="form-success"
              role="status"
            >
              <CheckCircle2 size={16} />
              {notice}
            </div>
          )}

          <section className="panel">
            <div className="panel-title">
              <span>01</span>

              <b>
                {t(
                  'dispatcher.shiftDetails',
                  {
                    defaultValue:
                      'Shift details',
                  }
                )}
              </b>

              <i />
            </div>

            <div className="kv">
              <span>
                {t('dispatcher.date', {
                  defaultValue: 'DATE',
                }).toUpperCase()}
              </span>

              <b>
                {formattedDate.toUpperCase()}
              </b>
            </div>

            <div className="kv">
              <span>
                {t('dispatcher.shift', {
                  defaultValue: 'SHIFT',
                }).toUpperCase()}
              </span>

              <b>
                {shiftLabel(viewing.shift)}
              </b>
            </div>

            <div className="kv">
              <span>
                {t('dispatcher.incharge', {
                  defaultValue:
                    'SHIFT IN-CHARGE',
                }).toUpperCase()}
              </span>

              <b>{viewing.shiftIncharge}</b>
            </div>

            <div className="kv">
              <span>
                {t('dispatcher.mine', {
                  defaultValue: 'MINE',
                }).toUpperCase()}
              </span>

              <b>{selectedMine.name}</b>
            </div>

            <div className="kv">
              <span>
                {t(
                  'dispatcher.totalWorkers',
                  {
                    defaultValue:
                      'TOTAL WORKERS DEPLOYED',
                  }
                ).toUpperCase()}
              </span>

              <b>
                {totalWorkers(
                  viewing.allocations
                )}
              </b>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <span>
                <LayoutGrid size={13} />
              </span>

              <b>
                {t(
                  'dispatcher.allocation',
                  {
                    defaultValue:
                      'Allocation',
                  }
                )}{' '}
                · {viewing.allocations.length}{' '}
                {t(
                  'dispatcher.locations',
                  {
                    defaultValue:
                      'locations',
                  }
                )}
              </b>

              <i />
            </div>

            {viewing.allocations.map(
              (location) => (
                <div
                  className="kv"
                  key={location.id}
                >
                  <span>
                    {LOCATION_TYPE_LABELS[
                      location.type
                    ]}
                  </span>

                  <b>
                    {location.name}

                    <small className="kv-sub">
                      {location.workers}{' '}
                      {t(
                        'dispatcher.workers',
                        {
                          defaultValue:
                            'workers',
                        }
                      )}
                    </small>
                  </b>
                </div>
              )
            )}
          </section>

          {viewing.remarks && (
            <section className="panel">
              <div className="panel-title">
                <span>02</span>

                <b>
                  {t(
                    'dispatcher.remarks',
                    {
                      defaultValue:
                        'Remarks',
                    }
                  )}
                </b>

                <i />
              </div>

              <p
                className="form-note"
                style={{ margin: 0 }}
              >
                {viewing.remarks}
              </p>
            </section>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn ghost big"
              onClick={() =>
                setPhase('form')
              }
            >
              {t(
                'dispatcher.backToShift',
                {
                  defaultValue:
                    'BACK TO SHIFT DETAILS',
                }
              )}
            </button>

            <button
              type="button"
              className="btn primary big"
              onClick={editAgain}
            >
              <Pencil size={15} />

              {t(
                'dispatcher.editUpdate',
                {
                  defaultValue:
                    'EDIT / UPDATE SHIFT',
                }
              )}
            </button>
          </div>

          {recent.length > 0 && (
            <section className="panel recent-panel">
              <div className="panel-title">
                <span>LOG</span>

                <b>
                  {t(
                    'dispatcher.recent',
                    {
                      defaultValue:
                        'Recent deployments',
                    }
                  )}
                </b>

                <i />
              </div>

              {recent.map((deployment) => {
                const recentDate =
                  new Date(
                    `${deployment.date}T00:00:00`
                  ).toLocaleDateString(
                    i18n.resolvedLanguage ===
                      'hi'
                      ? 'hi-IN'
                      : 'en-IN',
                    {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }
                  );

                return (
                  <button
                    type="button"
                    className="kv kv-clickable"
                    key={deployment.id}
                    onClick={() =>
                      viewRecent(
                        deployment
                      )
                    }
                  >
                    <span>
                      {recentDate.toUpperCase()}{' '}
                      ·{' '}
                      {shiftLabel(
                        deployment.shift
                      )}
                    </span>

                    <b>
                      {totalWorkers(
                        deployment.allocations
                      )}{' '}
                      {t(
                        'dispatcher.workers',
                        {
                          defaultValue:
                            'workers',
                        }
                      )}

                      <small className="kv-sub">
                        {t(
                          'dispatcher.inchargeName',
                          {
                            name:
                              deployment.shiftIncharge,
                            defaultValue:
                              `In-charge: ${deployment.shiftIncharge}`,
                          }
                        )}
                      </small>
                    </b>
                  </button>
                );
              })}
            </section>
          )}
        </main>
      </div>
    );
  }

  /*
   * ----------------------------------------------------------
   * DAILY DEPLOYMENT FORM
   * ----------------------------------------------------------
   */

  return (
    <div className="app shell">
      <WorkspaceHeader />

      {attendanceProcessing && (
        <div className="mapping-confirm-overlay">
          <div className="mapping-confirm-modal">
            <div className="mapping-confirm-icon">
              <FileImage size={28} />
            </div>

            <span className="eyebrow">
              {t(
                'dispatcher.attendanceProcessing',
                {
                  defaultValue:
                    'ATTENDANCE LOG PROCESSING',
                }
              )}
            </span>

            <h2>
              {t(
                'dispatcher.extractingText',
                {
                  defaultValue:
                    'EXTRACTING TEXT FROM IMAGE',
                }
              )}
            </h2>

            <p>
              {t(
                'dispatcher.readingAttendance',
                {
                  defaultValue:
                    'Reading the uploaded attendance log and preparing the shift details...',
                }
              )}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 18,
                color: 'var(--green)',
              }}
            >
              <LoaderCircle size={22} />
            </div>
          </div>
        </div>
      )}

      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t(
                'landing.roles.DISPATCHER.label',
                {
                  defaultValue:
                    'SHIFT OPERATOR',
                }
              )}{' '}
              ·{' '}
              {selectedMine.name.toUpperCase()}
            </div>

            <h1>
              {t(
                'dispatcher.title',
                {
                  defaultValue:
                    'DAILY UNDERGROUND WORKER DEPLOYMENT',
                }
              )}
            </h1>
          </div>

          <div className="page-heading-actions">
            <button
              type="button"
              className="btn small"
              onClick={autoFill}
            >
              <Sparkles size={13} />

              {t(
                'dispatcher.autoFill',
                {
                  defaultValue:
                    'AUTO-FILL',
                }
              )}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className="form-success"
            role="status"
          >
            <CheckCircle2 size={16} />
            {notice}
          </div>
        )}

        <form
          className="access-form"
          onSubmit={submit}
          noValidate
        >
          {/* ------------------------------------------------ */}
          {/* SHIFT DETAILS */}
          {/* ------------------------------------------------ */}

          <section className="panel">
            <div className="panel-title">
              <span>01</span>

              <b>
                {t(
                  'dispatcher.shiftDetails',
                  {
                    defaultValue:
                      'Shift details',
                  }
                )}
              </b>

              <i />
            </div>

            <div className="form-grid">
              <Field
                label={t(
                  'dispatcher.date',
                  {
                    defaultValue:
                      'DEPLOYMENT DATE',
                  }
                )}
                required
                error={errors.date}
              >
                <input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(
                      event.target.value
                    );
                    clear('date');
                    setNotice('');
                  }}
                />
              </Field>

              <Field
                label={t(
                  'dispatcher.shift',
                  {
                    defaultValue: 'SHIFT',
                  }
                )}
                required
              >
                <select
                  value={shift}
                  onChange={(event) => {
                    setShift(
                      event.target.value
                    );
                    setNotice('');
                  }}
                >
                  {SHIFTS.map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {shiftLabel(value)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={t(
                  'dispatcher.incharge',
                  {
                    defaultValue:
                      'SHIFT IN-CHARGE',
                  }
                )}
                required
                error={errors.incharge}
              >
                <HindiPhoneticInput
                  value={incharge}
                  onChange={(value) => {
                    setIncharge(value);
                    clear('incharge');
                    setNotice('');
                  }}
                />
              </Field>

              <Field
                label={t(
                  'dispatcher.mine',
                  {
                    defaultValue: 'MINE',
                  }
                )}
              >
                <input
                  value={selectedMine.name}
                  readOnly
                />
              </Field>
            </div>
          </section>

          {/* ------------------------------------------------ */}
          {/* ATTENDANCE LOG */}
          {/* ------------------------------------------------ */}

          <section className="panel">
            <div className="panel-title">
              <span>02</span>

              <b>
                {t(
                  'dispatcher.attendanceLog',
                  {
                    defaultValue:
                      'Attendance log',
                  }
                )}
              </b>

              <i />
            </div>

            <div className="form-note">
              {t(
                'dispatcher.attendanceDescription',
                {
                  defaultValue:
                    'Upload the attendance log maintained for the shift to prefill deployment details. Text extraction is simulated in this prototype.',
                }
              )}
            </div>

            <input
              ref={attendanceFileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                handleAttendanceUpload(file);

                event.currentTarget.value =
                  '';
              }}
            />

            <button
              type="button"
              className="btn small"
              onClick={() =>
                attendanceFileRef.current?.click()
              }
              disabled={
                attendanceProcessing
              }
            >
              <Upload size={13} />

              {t(
                'dispatcher.uploadAttendance',
                {
                  defaultValue:
                    'UPLOAD ATTENDANCE LOG IMAGE',
                }
              )}
            </button>
          </section>

          {/* ------------------------------------------------ */}
          {/* LOCATION ALLOCATION */}
          {/* ------------------------------------------------ */}

          <section className="panel">
            <div className="panel-title">
              <span>03</span>

              <b>
                {t(
                  'dispatcher.locationAllocation',
                  {
                    defaultValue:
                      'Location allocation',
                  }
                )}{' '}
                · {locations.length}
              </b>

              <i />
            </div>

            {!setup && (
              <div className="form-note">
                {t(
                  'dispatcher.noMineSetup',
                  {
                    defaultValue:
                      'The Site Manager has not saved a mine setup yet, so no default panels / galleries are listed. Add locations manually below.',
                  }
                )}
              </div>
            )}

            {errors.locations && (
              <div className="form-error">
                {errors.locations}
              </div>
            )}

            <div className="roster">
              <div className="roster-head location-head">
                <span>
                  {t(
                    'dispatcher.locationName',
                    {
                      defaultValue:
                        'LOCATION NAME',
                    }
                  )}
                </span>

                <span>
                  {t(
                    'dispatcher.locationType',
                    {
                      defaultValue:
                        'TYPE',
                    }
                  )}
                </span>

                <span>
                  {t(
                    'dispatcher.workers',
                    {
                      defaultValue:
                        'WORKERS',
                    }
                  )}
                </span>

                <span />
              </div>

              {locations.map((location) => (
                <div
                  className="roster-row location-row"
                  key={location.id}
                >
                  <label
                    className={
                      errors[
                        `loc.${location.id}.name`
                      ]
                        ? 'has-error'
                        : ''
                    }
                  >
                    <input
                      aria-label={t(
                        'dispatcher.locationName',
                        {
                          defaultValue:
                            'Location name',
                        }
                      )}
                      placeholder={t(
                        'dispatcher.namePlaceholder',
                        {
                          defaultValue:
                            'Name',
                        }
                      )}
                      value={location.name}
                      onChange={(event) =>
                        updateLocation(
                          location.id,
                          {
                            name:
                              event.target.value,
                          },
                          `loc.${location.id}.name`
                        )
                      }
                    />
                  </label>

                  <label>
                    <select
                      aria-label={t(
                        'dispatcher.locationType',
                        {
                          defaultValue:
                            'Location type',
                        }
                      )}
                      value={location.type}
                      onChange={(event) =>
                        updateLocation(
                          location.id,
                          {
                            type: event.target
                              .value as LocationType,
                          },
                          `loc.${location.id}.type`
                        )
                      }
                    >
                      {LOCATION_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {
                              LOCATION_TYPE_LABELS[
                                type
                              ]
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label
                    className={
                      errors[
                        `loc.${location.id}.workers`
                      ]
                        ? 'has-error'
                        : ''
                    }
                  >
                    <input
                      aria-label={t(
                        'dispatcher.workerCount',
                        {
                          defaultValue:
                            'Number of workers',
                        }
                      )}
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        location.workers
                      }
                      onChange={(event) => {
                        const value =
                          Number(
                            event.target.value.replace(
                              /\D/g,
                              ''
                            )
                          ) || 0;

                        updateLocation(
                          location.id,
                          {
                            workers: value,
                          },
                          `loc.${location.id}.workers`
                        );
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="row-remove"
                    onClick={() =>
                      removeLocation(
                        location.id
                      )
                    }
                    aria-label={t(
                      'dispatcher.removeLocation',
                      {
                        defaultValue:
                          'Remove location',
                      }
                    )}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="page-heading-actions">
              <button
                type="button"
                className="btn small"
                onClick={() =>
                  addLocation('PANEL')
                }
              >
                <Plus size={13} />

                {t(
                  'dispatcher.addPanel',
                  {
                    defaultValue:
                      'ADD PANEL',
                  }
                )}
              </button>

              <button
                type="button"
                className="btn small"
                onClick={() =>
                  addLocation('GALLERY')
                }
              >
                <Plus size={13} />

                {t(
                  'dispatcher.addGallery',
                  {
                    defaultValue:
                      'ADD GALLERY',
                  }
                )}
              </button>

              <button
                type="button"
                className="btn small"
                onClick={() =>
                  addLocation(
                    'WORKING_AREA'
                  )
                }
              >
                <MapPin size={13} />

                {t(
                  'dispatcher.addWorkingArea',
                  {
                    defaultValue:
                      'ADD WORKING AREA',
                  }
                )}
              </button>
            </div>
          </section>

          {/* ------------------------------------------------ */}
          {/* REMARKS */}
          {/* ------------------------------------------------ */}

          <section className="panel">
            <div className="panel-title">
              <span>04</span>

              <b>
                {t(
                  'dispatcher.remarksOptional',
                  {
                    defaultValue:
                      'Remarks (optional)',
                  }
                )}
              </b>

              <i />
            </div>

            <label className="field">
              <textarea
                rows={3}
                value={remarks}
                onChange={(event) =>
                  setRemarks(
                    event.target.value
                  )
                }
                placeholder={t(
                  'dispatcher.remarksPlaceholder',
                  {
                    defaultValue:
                      'Special instructions, restricted areas, equipment issued…',
                  }
                )}
              />
            </label>
          </section>

          {/* ------------------------------------------------ */}
          {/* SUBMIT */}
          {/* ------------------------------------------------ */}

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary big"
            >
              <Send size={15} />

              {t(
                'dispatcher.confirm',
                {
                  defaultValue:
                    'CONFIRM SHIFT DETAILS',
                }
              )}
            </button>
          </div>
        </form>

        {/* -------------------------------------------------- */}
        {/* RECENT DEPLOYMENTS */}
        {/* -------------------------------------------------- */}

        {recent.length > 0 && (
          <section className="panel recent-panel">
            <div className="panel-title">
              <span>LOG</span>

              <b>
                {t(
                  'dispatcher.recent',
                  {
                    defaultValue:
                      'Recent deployments',
                  }
                )}
              </b>

              <i />
            </div>

            {recent.map((deployment) => {
              const recentDate =
                new Date(
                  `${deployment.date}T00:00:00`
                ).toLocaleDateString(
                  i18n.resolvedLanguage ===
                    'hi'
                    ? 'hi-IN'
                    : 'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }
                );

              return (
                <button
                  type="button"
                  className="kv kv-clickable"
                  key={deployment.id}
                  onClick={() =>
                    viewRecent(
                      deployment
                    )
                  }
                >
                  <span>
                    {recentDate.toUpperCase()}{' '}
                    ·{' '}
                    {shiftLabel(
                      deployment.shift
                    )}
                  </span>

                  <b>
                    {totalWorkers(
                      deployment.allocations
                    )}{' '}
                    {t(
                      'dispatcher.workers',
                      {
                        defaultValue:
                          'workers',
                      }
                    )}

                    <small className="kv-sub">
                      {t(
                        'dispatcher.inchargeName',
                        {
                          name:
                            deployment.shiftIncharge,
                          defaultValue:
                            `In-charge: ${deployment.shiftIncharge}`,
                        }
                      )}
                    </small>
                  </b>
                </button>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}