import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type ChangeEvent,
} from 'react';

import {
  ArrowLeft,
  FileText,
  Send,
  Sparkles,
  Upload,
  UserCog,
  X,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { HindiPhoneticInput } from '../components/HindiPhoneticInput';
import { PublicTopbar } from '../components/PublicTopbar';
import {
  VerificationModal,
  VERIFY_STEP_MS,
} from '../components/VerificationModal';

import {
  emailFor,
  randomEmployeeId,
  randomMobile,
  randomName,
  ROLE_DESIGNATIONS,
  SAMPLE_MINES,
  pick,
} from '../data/autofill';

import { ROLE_OPTIONS } from '../data/prototype';

import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import type { Role } from '../types';

interface FormState {
  fullName: string;
  designation: string;
  employeeId: string;
  email: string;
  mobile: string;
  organization: string;
  mineName: string;
  mineCode: string;
  district: string;
  state: string;
  requestedRole: Role | '';
}

const initial: FormState = {
  fullName: '',
  designation: '',
  employeeId: '',
  email: '',
  mobile: '',
  organization: '',
  mineName: '',
  mineCode: '',
  district: '',
  state: 'Jharkhand',
  requestedRole: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function validate(
  form: FormState,
  translate: (key: string) => string
): Errors {
  const errors: Errors = {};

  const required: [keyof FormState, string][] = [
    ['fullName', 'fullName'],
    ['designation', 'designation'],
    ['employeeId', 'employeeId'],
    ['email', 'email'],
    ['mobile', 'mobile'],
    ['organization', 'organization'],
    ['mineName', 'mineName'],
    ['mineCode', 'mineCode'],
    ['district', 'district'],
    ['requestedRole', 'requestedRole'],
  ];

  required.forEach(([key, messageKey]) => {
    if (!String(form[key]).trim()) {
      errors[key] = translate(
        `requestAccess.errors.${messageKey}`
      );
    }
  });

  if (
    !errors.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim()
    )
  ) {
    errors.email = translate(
      'requestAccess.errors.invalidEmail'
    );
  }

  if (
    !errors.mobile &&
    !/^(\+91)?[6-9]\d{9}$/.test(
      form.mobile.replace(/[\s-]/g, '')
    )
  ) {
    errors.mobile = translate(
      'requestAccess.errors.invalidMobile'
    );
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Reusable field                                                             */
/* -------------------------------------------------------------------------- */

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
    <label
      className={`field ${error ? 'has-error' : ''}`}
    >
      <span className="field-label">
        {label}
        {required && <i> *</i>}
      </span>

      {children}

      {hint && !error && (
        <small className="field-hint">
          {hint}
        </small>
      )}

      {error && (
        <small className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Request Access                                                             */
/* -------------------------------------------------------------------------- */

export function RequestAccess() {
  const { t } = useTranslation();

  const {
    createAccount,
    isLoginIdTaken,
  } = useSession();

  /*
   * IMPORTANT:
   * This role -> details flow comes from the POST-DISASTER dashboard.
   * Do not remove this state if you want the same website flow.
   */
  const [step, setStep] = useState<
    'role' | 'details'
  >('role');

  const [phase, setPhase] = useState<
    'idle' | 'verifying' | 'verified'
  >('idle');

  const timers = useRef<number[]>([]);

  const [form, setForm] =
    useState<FormState>(initial);

  const [errors, setErrors] =
    useState<Errors>({});

  const [documentName, setDocumentName] =
    useState('');

  /* ---------------------------------------------------------------------- */
  /* Cleanup timers                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
  const timersAtMount = timers.current;

  return () => {
    timersAtMount.forEach((timer) =>
      window.clearTimeout(timer)
    );
  };
}, []);

  /* ---------------------------------------------------------------------- */
  /* Generic form setter                                                    */
  /* ---------------------------------------------------------------------- */

  const set = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((previous) => ({
        ...previous,
        [key]: undefined,
      }));
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Input binding for non-Hindi fields                                     */
  /* ---------------------------------------------------------------------- */

  const bind = (
    key:
      | 'employeeId'
      | 'email'
      | 'mobile'
      | 'mineCode'
  ) => ({
    value: form[key],

    onChange: (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      set(key, event.target.value);
    },
  });

  /* ---------------------------------------------------------------------- */
  /* Role selection                                                         */
  /* ---------------------------------------------------------------------- */

  const pickRole = (role: Role) => {
    set('requestedRole', role);

    /*
     * POST-DISASTER FLOW:
     * Role selection -> details form
     */
    setStep('details');
  };

  /* ---------------------------------------------------------------------- */
  /* Auto-fill                                                              */
  /* ---------------------------------------------------------------------- */

  const autoFill = () => {
    const role = (
      form.requestedRole || pick(ROLE_OPTIONS)
    ) as Role;

    const name = randomName();

    const sample = pick(SAMPLE_MINES);

    setForm({
      fullName: name,
      designation: pick(
        ROLE_DESIGNATIONS[role]
      ),
      employeeId: randomEmployeeId(role),
      email: emailFor(name),
      mobile: randomMobile(),
      organization: sample.organization,
      mineName: sample.mineName,
      mineCode: sample.mineCode,
      district: sample.district,
      state: sample.state,
      requestedRole: role,
    });

    setErrors({});
    setDocumentName('');
  };

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                 */
  /* ---------------------------------------------------------------------- */

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (phase !== 'idle') return;

    const found = validate(form, t);

    /*
     * Post-disaster account validation.
     */
    if (
      !found.employeeId &&
      isLoginIdTaken(form.employeeId)
    ) {
      found.employeeId = t(
        'requestAccess.errors.duplicateId'
      );
    }

    setErrors(found);

    if (Object.keys(found).length) {
      document
        .querySelector(
          '.has-error, .role-pick.has-error'
        )
        ?.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        });

      return;
    }

    const input = {
      fullName: form.fullName.trim(),
      designation: form.designation.trim(),
      employeeId: form.employeeId.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      organization: form.organization.trim(),
      mineName: form.mineName.trim(),
      mineCode: form.mineCode.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      requestedRole:
        form.requestedRole as Role,
      documentName:
        documentName || undefined,
    };

    /*
     * POST-DISASTER VERIFICATION FLOW:
     *
     * 1. Show verifying modal
     * 2. Create account
     * 3. Show verified modal
     * 4. Navigate to access-created
     */
    setPhase('verifying');

    const verifyMs =
      VERIFY_STEP_MS * 3;

    timers.current.push(
      window.setTimeout(() => {
        const result =
          createAccount(input);

        if (!result.ok) {
          setPhase('idle');

          setErrors({
            employeeId: result.error,
          });

          return;
        }

        setPhase('verified');

        timers.current.push(
          window.setTimeout(
            () =>
              navigate(
                '/access-created'
              ),
            1600
          )
        );
      }, verifyMs)
    );
  };

  /* ====================================================================== */
  /* STEP 1 — ROLE SELECTION                                                */
  /* ====================================================================== */

  if (step === 'role') {
    return (
      <div className="app shell">
        <PublicTopbar
          right={
            <button
              className="btn small"
              onClick={() =>
                navigate('/')
              }
            >
              <ArrowLeft size={13} />
              {t(
                'requestAccess.home'
              )}
            </button>
          }
        />

        <main className="shell-main form-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {t(
                  'requestAccess.officialAccess'
                )}
              </div>

              <h1>
                {t(
                  'requestAccess.title'
                )}
              </h1>
            </div>
          </div>

          <section className="panel">
            <div className="panel-title">
              <span>01</span>

              <b>
                {t(
                  'requestAccess.requestedRole'
                )}
              </b>

              <i />
            </div>

            <div
              className={`role-picks ${
                errors.requestedRole
                  ? 'has-error'
                  : ''
              }`}
              role="radiogroup"
              aria-label={t(
                'requestAccess.requestedRole'
              )}
            >
              {ROLE_OPTIONS.map(
                (role) => (
                  <button
                    type="button"
                    key={role}
                    role="radio"
                    aria-checked={
                      form.requestedRole ===
                      role
                    }
                    className={`role-pick ${
                      form.requestedRole ===
                      role
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      pickRole(role)
                    }
                  >
                    <b>
                      {t(
                        `landing.roles.${role}.label`
                      )}
                    </b>

                    <span>
                      {t(
                        `landing.roles.${role}.description`
                      )}
                    </span>
                  </button>
                )
              )}
            </div>

            {errors.requestedRole && (
              <small className="field-error">
                {errors.requestedRole}
              </small>
            )}
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn ghost big"
              onClick={() =>
                navigate('/login')
              }
            >
              <ArrowLeft size={15} />

              {t(
                'requestAccess.backToLogin'
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ====================================================================== */
  /* STEP 2 — DETAILS                                                       */
  /* ====================================================================== */

  return (
    <div className="app shell">
      <PublicTopbar
        right={
          <button
            className="btn small"
            onClick={() =>
              navigate('/')
            }
          >
            <ArrowLeft size={13} />

            {t(
              'requestAccess.home'
            )}
          </button>
        }
      />

      {phase !== 'idle' && (
        <VerificationModal
          phase={phase}
        />
      )}

      <main className="shell-main form-page">
        {/* ---------------------------------------------------------------- */}
        {/* Page heading                                                      */}
        {/* ---------------------------------------------------------------- */}

        <div className="page-heading">
          <div>
            <div className="eyebrow">
              {t(
                'requestAccess.officialAccess'
              )}{' '}
              ·{' '}
              {form.requestedRole
                ? t(
                    `landing.roles.${form.requestedRole}.label`
                  )
                : ''}
            </div>

            <h1>
              {t(
                'requestAccess.title'
              )}
            </h1>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* POST-DISASTER CONTROLS: CHANGE ROLE + AUTO-FILL                */}
          {/* -------------------------------------------------------------- */}

          <div className="page-heading-actions">
            <button
              type="button"
              className="btn small"
              onClick={() =>
                setStep('role')
              }
              disabled={
                phase !== 'idle'
              }
            >
              <UserCog size={13} />

              {t(
                'requestAccess.changeRole',
                {
                  defaultValue:
                    'CHANGE ROLE',
                }
              )}
            </button>

            <button
              type="button"
              className="btn small"
              onClick={autoFill}
              disabled={
                phase !== 'idle'
              }
            >
              <Sparkles size={13} />

              {t(
                'requestAccess.autoFill',
                {
                  defaultValue:
                    'AUTO-FILL',
                }
              )}
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Main form                                                         */}
        {/* ---------------------------------------------------------------- */}

        <form
          className="access-form"
          onSubmit={submit}
          noValidate
        >
          {/* ============================================================ */}
          {/* 01 — APPLICANT                                               */}
          {/* ============================================================ */}

          <section className="panel">
            <div className="panel-title">
              <span>01</span>

              <b>
                {t(
                  'requestAccess.applicant'
                )}
              </b>

              <i />
            </div>

            <div className="form-grid">
              {/* Full name — Hindi input */}
              <Field
                label={t(
                  'requestAccess.fullName'
                )}
                required
                error={errors.fullName}
              >
                <HindiPhoneticInput
                  value={form.fullName}
                  onChange={(value) =>
                    set(
                      'fullName',
                      value
                    )
                  }
                  autoComplete="name"
                />
              </Field>

              {/* Designation — Hindi input */}
              <Field
                label={t(
                  'requestAccess.designation'
                )}
                required
                error={
                  errors.designation
                }
              >
                <HindiPhoneticInput
                  value={
                    form.designation
                  }
                  onChange={(value) =>
                    set(
                      'designation',
                      value
                    )
                  }
                />
              </Field>

              {/* Employee ID */}
              <Field
                label={t(
                  'requestAccess.employeeId'
                )}
                required
                error={
                  errors.employeeId
                }
              >
                <input
                  {...bind(
                    'employeeId'
                  )}
                />
              </Field>

              {/* Email */}
              <Field
                label={t(
                  'requestAccess.email'
                )}
                required
                error={errors.email}
              >
                <input
                  type="email"
                  {...bind('email')}
                  autoComplete="email"
                />
              </Field>

              {/* Mobile */}
              <Field
                label={t(
                  'requestAccess.mobile'
                )}
                required
                error={
                  errors.mobile
                }
                hint={t(
                  'requestAccess.mobileHint'
                )}
              >
                <input
                  type="tel"
                  {...bind('mobile')}
                  autoComplete="tel"
                />
              </Field>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 02 — ORGANIZATION & MINE                                     */}
          {/* ============================================================ */}

          <section className="panel">
            <div className="panel-title">
              <span>02</span>

              <b>
                {t(
                  'requestAccess.organizationMine'
                )}
              </b>

              <i />
            </div>

            <div className="form-grid">
              {/* Organization — Hindi input */}
              <Field
                label={t(
                  'requestAccess.organization'
                )}
                required
                error={
                  errors.organization
                }
              >
                <HindiPhoneticInput
                  value={
                    form.organization
                  }
                  onChange={(value) =>
                    set(
                      'organization',
                      value
                    )
                  }
                />
              </Field>

              {/* Mine name — Hindi input */}
              <Field
                label={t(
                  'requestAccess.mineName'
                )}
                required
                error={
                  errors.mineName
                }
              >
                <HindiPhoneticInput
                  value={
                    form.mineName
                  }
                  onChange={(value) =>
                    set(
                      'mineName',
                      value
                    )
                  }
                />
              </Field>

              {/* Mine code */}
              <Field
                label={t(
                  'requestAccess.mineCode'
                )}
                required
                error={
                  errors.mineCode
                }
                hint={t(
                  'requestAccess.mineCodeHint'
                )}
              >
                <input
                  {...bind(
                    'mineCode'
                  )}
                />
              </Field>

              {/* District — Hindi input */}
              <Field
                label={t(
                  'requestAccess.district'
                )}
                required
                error={
                  errors.district
                }
              >
                <HindiPhoneticInput
                  value={
                    form.district
                  }
                  onChange={(value) =>
                    set(
                      'district',
                      value
                    )
                  }
                />
              </Field>

              {/* State — Hindi input */}
              <Field
                label={t(
                  'requestAccess.state'
                )}
              >
                <HindiPhoneticInput
                  value={form.state}
                  onChange={(value) =>
                    set(
                      'state',
                      value
                    )
                  }
                />
              </Field>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 03 — REQUESTED ROLE                                          */}
          {/* ============================================================ */}

          <section className="panel">
            <div className="panel-title">
              <span>03</span>

              <b>
                {t(
                  'requestAccess.requestedRole'
                )}
              </b>

              <i />
            </div>

            <div
              className={`role-picks ${
                errors.requestedRole
                  ? 'has-error'
                  : ''
              }`}
              role="radiogroup"
              aria-label={t(
                'requestAccess.requestedRole'
              )}
            >
              {ROLE_OPTIONS.map(
                (role) => (
                  <button
                    type="button"
                    key={role}
                    role="radio"
                    aria-checked={
                      form.requestedRole ===
                      role
                    }
                    className={`role-pick ${
                      form.requestedRole ===
                      role
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      set(
                        'requestedRole',
                        role
                      )
                    }
                  >
                    <b>
                      {t(
                        `landing.roles.${role}.label`
                      )}
                    </b>

                    <span>
                      {t(
                        `landing.roles.${role}.description`
                      )}
                    </span>
                  </button>
                )
              )}
            </div>

            {errors.requestedRole && (
              <small className="field-error">
                {errors.requestedRole}
              </small>
            )}
          </section>

          {/* ============================================================ */}
          {/* 04 — DOCUMENT                                                */}
          {/* ============================================================ */}

          <section className="panel">
            <div className="panel-title">
              <span>04</span>

              <b>
                {t(
                  'requestAccess.document'
                )}
              </b>

              <i />
            </div>

            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(
                  event
                ) =>
                  setDocumentName(
                    event.target
                      .files?.[0]
                      ?.name ?? ''
                  )
                }
              />

              {documentName ? (
                <span className="dropzone-file">
                  <FileText size={16} />

                  {documentName}
                </span>
              ) : (
                <span>
                  <Upload size={16} />

                  {t(
                    'requestAccess.chooseFile'
                  )}
                </span>
              )}
            </label>

            {documentName && (
              <button
                type="button"
                className="link-btn"
                onClick={() =>
                  setDocumentName('')
                }
              >
                <X size={12} />

                {t(
                  'requestAccess.removeFile'
                )}
              </button>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Privacy note                                                      */}
          {/* ---------------------------------------------------------------- */}

          <div className="form-note">
            {t(
              'requestAccess.privacyNote'
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Form actions                                                      */}
          {/* ---------------------------------------------------------------- */}

          <div className="form-actions">
            <button
              type="button"
              className="btn ghost big"
              onClick={() =>
                navigate('/login')
              }
              disabled={
                phase !== 'idle'
              }
            >
              {t(
                'requestAccess.backToLogin'
              )}
            </button>

            <button
              type="submit"
              className="btn primary big"
              disabled={
                phase !== 'idle'
              }
            >
              <Send size={15} />

              {t(
                'requestAccess.submit'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}