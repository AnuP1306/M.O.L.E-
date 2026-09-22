import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, FileText, Sparkles, Send, Upload, UserCog, X } from 'lucide-react';
import { PublicTopbar } from '../components/PublicTopbar';
import { VerificationModal, VERIFY_STEP_MS } from '../components/VerificationModal';
import { emailFor, randomEmployeeId, randomMobile, randomName, ROLE_DESIGNATIONS, SAMPLE_MINES, pick } from '../data/autofill';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_OPTIONS } from '../data/prototype';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import type { Role } from '../types';

interface FormState {
  fullName: string; designation: string; employeeId: string; email: string; mobile: string;
  organization: string; mineName: string; mineCode: string; district: string; state: string;
  requestedRole: Role | '';
}

const initial: FormState = {
  fullName: '', designation: '', employeeId: '', email: '', mobile: '',
  organization: '', mineName: '', mineCode: '', district: '', state: 'Jharkhand',
  requestedRole: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  const required: [keyof FormState, string][] = [
    ['fullName', 'Full name is required'], ['designation', 'Designation is required'],
    ['employeeId', 'Employee / service ID is required'], ['email', 'Official email is required'],
    ['mobile', 'Official mobile number is required'], ['organization', 'Organization / mine operator is required'],
    ['mineName', 'Mine name is required'], ['mineCode', 'Official mine code is required'],
    ['district', 'District is required'], ['requestedRole', 'Select the role you are requesting'],
  ];
  required.forEach(([key, message]) => { if (!String(f[key]).trim()) e[key] = message; });
  if (!e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!e.mobile && !/^(\+91)?[6-9]\d{9}$/.test(f.mobile.replace(/[\s-]/g, ''))) e.mobile = 'Enter a valid 10-digit Indian mobile number';
  return e;
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}{required && <i> *</i>}</span>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function RequestAccess() {
  const { createAccount, isLoginIdTaken } = useSession();
  const [phase, setPhase] = useState<'idle' | 'verifying' | 'verified'>('idle');
  const [step, setStep] = useState<'role' | 'details'>('role');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [documentName, setDocumentName] = useState<string>('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const bind = (key: Exclude<keyof FormState, 'requestedRole'>) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
  });

  const pickRole = (role: Role) => { set('requestedRole', role); setStep('details'); };

  const autoFill = () => {
    const role = (form.requestedRole || pick(ROLE_OPTIONS)) as Role;
    const name = randomName();
    const sample = pick(SAMPLE_MINES);
    setForm({
      fullName: name,
      designation: pick(ROLE_DESIGNATIONS[role]),
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    const found = validate(form);
    if (!found.employeeId && isLoginIdTaken(form.employeeId)) found.employeeId = 'An account already exists for this ID';
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector('.has-error, .role-pick.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    const input = {
      fullName: form.fullName.trim(), designation: form.designation.trim(), employeeId: form.employeeId.trim(),
      email: form.email.trim(), mobile: form.mobile.trim(), organization: form.organization.trim(),
      mineName: form.mineName.trim(), mineCode: form.mineCode.trim(), district: form.district.trim(),
      state: form.state.trim(), requestedRole: form.requestedRole as Role,
      documentName: documentName || undefined,
    };

    // 1) verifying modal  2) account created + "verified" modal  3) credentials screen
    setPhase('verifying');
    const verifyMs = VERIFY_STEP_MS * 3;
    timers.current.push(window.setTimeout(() => {
      const result = createAccount(input);
      if (!result.ok) {
        setPhase('idle');
        setErrors({ employeeId: result.error });
        return;
      }
      setPhase('verified');
      timers.current.push(window.setTimeout(() => navigate('/access-created'), 1600));
    }, verifyMs));
  };

  if (step === 'role') {
    return (
      <div className="app shell">
        <PublicTopbar right={<button className="btn small" onClick={() => navigate('/')}><ArrowLeft size={13} /> HOME</button>} />
        <main className="shell-main form-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">OFFICIAL ACCESS</div>
              <h1>REQUEST OFFICIAL ACCESS</h1>
            </div>
          </div>

          <section className="panel">
            <div className="panel-title"><span>01</span><b>Select the role you are requesting</b><i /></div>
            <div className="role-picks" role="radiogroup" aria-label="Requested role">
              {ROLE_OPTIONS.map((role) => (
                <button type="button" key={role} role="radio" aria-checked={form.requestedRole === role}
                  className={`role-pick ${form.requestedRole === role ? 'selected' : ''}`} onClick={() => pickRole(role)}>
                  <b>{ROLE_LABELS[role]}</b>
                  <span>{ROLE_DESCRIPTIONS[role]}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="form-actions">
            <button type="button" className="btn ghost big" onClick={() => navigate('/login')}><ArrowLeft size={15} /> BACK TO LOGIN</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app shell">
      <PublicTopbar right={<button className="btn small" onClick={() => navigate('/')}><ArrowLeft size={13} /> HOME</button>} />

      {phase !== 'idle' && <VerificationModal phase={phase} />}
      <main className="shell-main form-page">
        <div className="page-heading">
          <div>
            <div className="eyebrow">OFFICIAL ACCESS · {ROLE_LABELS[form.requestedRole as Role]}</div>
            <h1>REQUEST OFFICIAL ACCESS</h1>
          </div>
          <div className="page-heading-actions">
            <button type="button" className="btn small" onClick={() => setStep('role')} disabled={phase !== 'idle'}><UserCog size={13} /> CHANGE ROLE</button>
            <button type="button" className="btn small" onClick={autoFill} disabled={phase !== 'idle'}><Sparkles size={13} /> AUTO-FILL</button>
          </div>
        </div>

        <form className="access-form" onSubmit={submit} noValidate>
          <section className="panel">
            <div className="panel-title"><span>01</span><b>Applicant</b><i /></div>
            <div className="form-grid">
              <Field label="FULL NAME" required error={errors.fullName}><input {...bind('fullName')} autoComplete="name" /></Field>
              <Field label="DESIGNATION" required error={errors.designation}><input {...bind('designation')} /></Field>
              <Field label="EMPLOYEE / SERVICE ID" required error={errors.employeeId}><input {...bind('employeeId')} /></Field>
              <Field label="OFFICIAL EMAIL" required error={errors.email}><input type="email" {...bind('email')} autoComplete="email" /></Field>
              <Field label="OFFICIAL MOBILE NUMBER" required error={errors.mobile} hint="10-digit number, optionally with +91"><input type="tel" {...bind('mobile')} autoComplete="tel" /></Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title"><span>02</span><b>Organization & mine</b><i /></div>
            <div className="form-grid">
              <Field label="ORGANIZATION / MINE OPERATOR" required error={errors.organization}><input {...bind('organization')} /></Field>
              <Field label="MINE NAME" required error={errors.mineName}><input {...bind('mineName')} /></Field>
              <Field label="OFFICIAL MINE CODE" required error={errors.mineCode} hint="As issued to your mine by the competent authority"><input {...bind('mineCode')} /></Field>
              <Field label="DISTRICT" required error={errors.district}><input {...bind('district')} /></Field>
              <Field label="STATE"><input {...bind('state')} /></Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title"><span>03</span><b>Requested role</b><i /></div>
            <div className={`role-picks ${errors.requestedRole ? 'has-error' : ''}`} role="radiogroup" aria-label="Requested role">
              {ROLE_OPTIONS.map((role) => (
                <button type="button" key={role} role="radio" aria-checked={form.requestedRole === role}
                  className={`role-pick ${form.requestedRole === role ? 'selected' : ''}`} onClick={() => set('requestedRole', role)}>
                  <b>{ROLE_LABELS[role]}</b>
                  <span>{ROLE_DESCRIPTIONS[role]}</span>
                </button>
              ))}
            </div>
            {errors.requestedRole && <small className="field-error">{errors.requestedRole}</small>}
          </section>

          <section className="panel">
            <div className="panel-title"><span>04</span><b>Authorization / appointment document (optional)</b><i /></div>
            <label className="dropzone">
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocumentName(e.target.files?.[0]?.name ?? '')} />
              {documentName
                ? <span className="dropzone-file"><FileText size={16} /> {documentName}</span>
                : <span><Upload size={16} /> CHOOSE FILE (PDF, PNG or JPG)</span>}
            </label>
            {documentName && <button type="button" className="link-btn" onClick={() => setDocumentName('')}><X size={12} /> REMOVE FILE</button>}
          </section>

          <div className="form-note">Do not enter Aadhaar, PAN or any other personal identity numbers. Only official service details are needed.</div>

          <div className="form-actions">
            <button type="button" className="btn ghost big" onClick={() => navigate('/login')} disabled={phase !== 'idle'}>BACK TO LOGIN</button>
            <button type="submit" className="btn primary big" disabled={phase !== 'idle'}><Send size={15} /> SUBMIT ACCESS REQUEST</button>
          </div>
        </form>
      </main>
    </div>
  );
}
