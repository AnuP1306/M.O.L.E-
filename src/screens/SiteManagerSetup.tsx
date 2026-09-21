import { useState, type FormEvent, type ReactNode } from 'react';
import { Minus, Plus, Save, Upload, X, FileText, Radar } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import type { MineSetup, RoverEntry, TeamMember } from '../types';

const WORKING_METHODS = ['Bord and Pillar', 'Longwall', 'Continuous miner', 'Mixed methods'];
const GASSINESS = ['Degree I', 'Degree II', 'Degree III'];
const DESIGNATIONS = ['Mine Manager', 'Assistant Manager', 'Safety Officer', 'Rescue In-charge', 'Ventilation Officer', 'Control Room In-charge'];
const PAYLOADS = ['Thermal camera', 'Normal camera', 'LiDAR', 'Gas sensor array', 'Front drill'];
const MAX_ROVERS = 10;

interface FormState {
  workingMethod: string; gassiness: string; levels: string; maxDepth: string; workforce: string; shifts: string;
  team: TeamMember[];
  rovers: RoverEntry[];
  mapMethod: '' | 'UPLOAD' | 'SLAM';
  mapFileName: string;
}

const blankMember = (): TeamMember => ({ name: '', designation: '', mobile: '', email: '' });
const roverName = (i: number) => `MOLE-${String(i + 1).padStart(2, '0')}`;
const blankRover = (i: number): RoverEntry => ({ roverId: roverName(i), serial: '', payloads: ['Thermal camera', 'LiDAR', 'Gas sensor array'] });

type Errors = Record<string, string>;

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

const positiveInt = (v: string) => /^\d+$/.test(v.trim()) && Number(v) > 0;

export function SiteManagerSetup() {
  const { user, selectedMine, mineSetups, saveMineSetup } = useSession();
  const saved = selectedMine ? mineSetups[selectedMine.id] : undefined;

  const [form, setForm] = useState<FormState>(() => saved ? {
    workingMethod: saved.workingMethod, gassiness: saved.gassiness, levels: String(saved.levels), maxDepth: String(saved.maxDepth),
    workforce: String(saved.workforcePerShift), shifts: String(saved.shiftsPerDay),
    team: saved.team, rovers: saved.rovers, mapMethod: saved.mapMethod, mapFileName: saved.mapFileName ?? '',
  } : {
    workingMethod: '', gassiness: '', levels: '', maxDepth: '', workforce: '', shifts: '3',
    team: [{ name: user?.name ?? '', designation: user?.designation ?? '', mobile: user?.mobile ?? '', email: user?.email ?? '' }],
    rovers: [blankRover(0)], mapMethod: '', mapFileName: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  if (!user || !selectedMine) return null;

  const clearError = (key: string) => setErrors((e) => { if (!e[key]) return e; const next = { ...e }; delete next[key]; return next; });
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key === 'mapMethod' || key === 'mapFileName' ? 'map' : String(key)); // the map error is stored under "map"
  };

  const updateMember = (i: number, patch: Partial<TeamMember>, key: string) => {
    setForm((f) => ({ ...f, team: f.team.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) })); clearError(key);
  };
  const updateRover = (i: number, patch: Partial<RoverEntry>, key: string) => {
    setForm((f) => ({ ...f, rovers: f.rovers.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) })); clearError(key);
  };
  const setRoverCount = (count: number) => {
    const n = Math.min(MAX_ROVERS, Math.max(1, count));
    setForm((f) => ({ ...f, rovers: Array.from({ length: n }, (_, i) => f.rovers[i] ?? blankRover(i)) }));
  };
  const togglePayload = (i: number, payload: string) => {
    const has = form.rovers[i].payloads.includes(payload);
    updateRover(i, { payloads: has ? form.rovers[i].payloads.filter((p) => p !== payload) : [...form.rovers[i].payloads, payload] }, `rover.${i}.payloads`);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.workingMethod) e.workingMethod = 'Select the working method';
    if (!form.gassiness) e.gassiness = 'Select the degree of gassiness';
    if (!positiveInt(form.levels)) e.levels = 'Enter a whole number';
    if (!positiveInt(form.maxDepth)) e.maxDepth = 'Enter the depth in metres';
    if (!positiveInt(form.workforce)) e.workforce = 'Enter a whole number';
    if (!positiveInt(form.shifts) || Number(form.shifts) > 4) e.shifts = 'Enter 1 to 4';
    form.team.forEach((m, i) => {
      if (!m.name.trim()) e[`team.${i}.name`] = 'Name is required';
      if (!m.designation.trim()) e[`team.${i}.designation`] = 'Designation is required';
      if (!/^(\+91)?[6-9]\d{9}$/.test(m.mobile.replace(/[\s-]/g, ''))) e[`team.${i}.mobile`] = 'Valid 10-digit mobile required';
      if (m.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) e[`team.${i}.email`] = 'Enter a valid email';
    });
    const seen = new Set<string>();
    form.rovers.forEach((r, i) => {
      if (!r.roverId.trim()) e[`rover.${i}.id`] = 'Rover ID is required';
      else if (seen.has(r.roverId.trim().toLowerCase())) e[`rover.${i}.id`] = 'Rover IDs must be unique';
      seen.add(r.roverId.trim().toLowerCase());
      if (!r.serial.trim()) e[`rover.${i}.serial`] = 'Serial / registration number is required';
      if (!r.payloads.length) e[`rover.${i}.payloads`] = 'Select at least one payload';
    });
    if (!form.mapMethod) e.map = 'Choose how the mine map will be provided';
    else if (form.mapMethod === 'UPLOAD' && !form.mapFileName) e.map = 'Upload the existing mine map';
    return e;
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      document.querySelector('.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const setup: MineSetup = {
      mineId: selectedMine.id,
      completedAt: new Date().toISOString(),
      workingMethod: form.workingMethod, gassiness: form.gassiness,
      levels: Number(form.levels), maxDepth: Number(form.maxDepth),
      workforcePerShift: Number(form.workforce), shiftsPerDay: Number(form.shifts),
      team: form.team.map((m) => ({ name: m.name.trim(), designation: m.designation.trim(), mobile: m.mobile.trim(), email: m.email.trim() })),
      rovers: form.rovers.map((r) => ({ ...r, roverId: r.roverId.trim(), serial: r.serial.trim() })),
      mapMethod: form.mapMethod as 'UPLOAD' | 'SLAM',
      mapFileName: form.mapMethod === 'UPLOAD' ? form.mapFileName : undefined,
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
            <div className="eyebrow">SITE MANAGER · {selectedMine.name.toUpperCase()}</div>
            <h1>MINE SETUP</h1>
          </div>
          {saved && <button className="btn small" type="button" onClick={() => navigate('/site-manager')}><X size={13} /> CANCEL</button>}
        </div>

        <form className="access-form" onSubmit={submit} noValidate>
          {/* 01 OPERATIONAL DETAILS */}
          <section className="panel">
            <div className="panel-title"><span>01</span><b>Mine operational details</b><i /></div>
            <div className="form-grid">
              <Field label="MINE NAME"><input value={selectedMine.name} readOnly /></Field>
              <Field label="OFFICIAL MINE CODE"><input value={selectedMine.officialMineCode} readOnly /></Field>
              <Field label="WORKING METHOD" required error={errors.workingMethod}>
                <select value={form.workingMethod} onChange={(e) => setField('workingMethod', e.target.value)}>
                  <option value="">Select…</option>{WORKING_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="DEGREE OF GASSINESS" required error={errors.gassiness}>
                <select value={form.gassiness} onChange={(e) => setField('gassiness', e.target.value)}>
                  <option value="">Select…</option>{GASSINESS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="WORKING LEVELS / SEAMS" required error={errors.levels}><input inputMode="numeric" value={form.levels} onChange={(e) => setField('levels', e.target.value)} /></Field>
              <Field label="MAXIMUM WORKING DEPTH (M)" required error={errors.maxDepth}><input inputMode="numeric" value={form.maxDepth} onChange={(e) => setField('maxDepth', e.target.value)} /></Field>
              <Field label="WORKERS PER SHIFT (APPROX.)" required error={errors.workforce}><input inputMode="numeric" value={form.workforce} onChange={(e) => setField('workforce', e.target.value)} /></Field>
              <Field label="SHIFTS PER DAY" required error={errors.shifts}><input inputMode="numeric" value={form.shifts} onChange={(e) => setField('shifts', e.target.value)} /></Field>
            </div>
          </section>

          {/* 02 TEAM */}
          <section className="panel">
            <div className="panel-title"><span>02</span><b>Team / responsible personnel</b><i /></div>
            <datalist id="designations">{DESIGNATIONS.map((d) => <option key={d} value={d} />)}</datalist>
            {form.team.map((m, i) => (
              <div className="repeat-row" key={i}>
                <div className="repeat-head">
                  <b>PERSON {String(i + 1).padStart(2, '0')}</b>
                  {form.team.length > 1 && <button type="button" className="link-btn" onClick={() => setForm((f) => ({ ...f, team: f.team.filter((_, idx) => idx !== i) }))}><X size={12} /> REMOVE</button>}
                </div>
                <div className="form-grid">
                  <Field label="FULL NAME" required error={errors[`team.${i}.name`]}><input value={m.name} onChange={(e) => updateMember(i, { name: e.target.value }, `team.${i}.name`)} /></Field>
                  <Field label="DESIGNATION" required error={errors[`team.${i}.designation`]}><input list="designations" value={m.designation} onChange={(e) => updateMember(i, { designation: e.target.value }, `team.${i}.designation`)} /></Field>
                  <Field label="MOBILE NUMBER" required error={errors[`team.${i}.mobile`]}><input type="tel" value={m.mobile} onChange={(e) => updateMember(i, { mobile: e.target.value }, `team.${i}.mobile`)} /></Field>
                  <Field label="EMAIL" error={errors[`team.${i}.email`]}><input type="email" value={m.email} onChange={(e) => updateMember(i, { email: e.target.value }, `team.${i}.email`)} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn small" onClick={() => setForm((f) => ({ ...f, team: [...f.team, blankMember()] }))}><Plus size={13} /> ADD PERSON</button>
          </section>

          {/* 03 ROVERS */}
          <section className="panel">
            <div className="panel-title"><span>03</span><b>Rovers</b><i /></div>
            <div className="stepper-row">
              <span className="field-label">NUMBER OF ROVERS REQUIRED</span>
              <div className="stepper">
                <button type="button" onClick={() => setRoverCount(form.rovers.length - 1)} disabled={form.rovers.length <= 1} aria-label="Fewer rovers"><Minus size={14} /></button>
                <b>{form.rovers.length}</b>
                <button type="button" onClick={() => setRoverCount(form.rovers.length + 1)} disabled={form.rovers.length >= MAX_ROVERS} aria-label="More rovers"><Plus size={14} /></button>
              </div>
            </div>
            {form.rovers.map((r, i) => (
              <div className="repeat-row" key={i}>
                <div className="repeat-head"><b>ROVER {String(i + 1).padStart(2, '0')}</b></div>
                <div className="form-grid">
                  <Field label="ROVER ID" required error={errors[`rover.${i}.id`]}><input value={r.roverId} onChange={(e) => updateRover(i, { roverId: e.target.value }, `rover.${i}.id`)} /></Field>
                  <Field label="SERIAL / REGISTRATION NO." required error={errors[`rover.${i}.serial`]}><input value={r.serial} onChange={(e) => updateRover(i, { serial: e.target.value }, `rover.${i}.serial`)} /></Field>
                </div>
                <div className={`chip-group ${errors[`rover.${i}.payloads`] ? 'has-error' : ''}`}>
                  <span className="field-label">PAYLOADS FITTED</span>
                  <div>
                    {PAYLOADS.map((p) => (
                      <button type="button" key={p} className={`chip ${r.payloads.includes(p) ? 'on' : ''}`} onClick={() => togglePayload(i, p)} aria-pressed={r.payloads.includes(p)}>{p}</button>
                    ))}
                  </div>
                  {errors[`rover.${i}.payloads`] && <small className="field-error">{errors[`rover.${i}.payloads`]}</small>}
                </div>
              </div>
            ))}
          </section>

          {/* 04 MAP */}
          <section className="panel">
            <div className="panel-title"><span>04</span><b>Mine map</b><i /></div>
            <div className={`role-picks two ${errors.map ? 'has-error' : ''}`} role="radiogroup" aria-label="Mine map source">
              <button type="button" role="radio" aria-checked={form.mapMethod === 'UPLOAD'} className={`role-pick ${form.mapMethod === 'UPLOAD' ? 'selected' : ''}`} onClick={() => setField('mapMethod', 'UPLOAD')}>
                <b><Upload size={13} /> UPLOAD EXISTING MINE MAP</b>
                <span>Use the current survey plan or layout drawing of the mine.</span>
              </button>
              <button type="button" role="radio" aria-checked={form.mapMethod === 'SLAM'} className={`role-pick ${form.mapMethod === 'SLAM' ? 'selected' : ''}`} onClick={() => setField('mapMethod', 'SLAM')}>
                <b><Radar size={13} /> START SLAM MAPPING</b>
                <span>Map the mine with the registered rovers instead of uploading a drawing.</span>
              </button>
            </div>
            {form.mapMethod === 'UPLOAD' && (
              <div className="map-upload">
                <label className="dropzone">
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf" onChange={(e) => setField('mapFileName', e.target.files?.[0]?.name ?? '')} />
                  {form.mapFileName ? <span className="dropzone-file"><FileText size={16} /> {form.mapFileName}</span> : <span><Upload size={16} /> CHOOSE MAP FILE (PDF, PNG, JPG, DWG, DXF)</span>}
                </label>
              </div>
            )}
            {errors.map && <small className="field-error">{errors.map}</small>}
          </section>

          <div className="form-actions">
            <button type="submit" className="btn primary big"><Save size={15} /> {saved ? 'SAVE SETUP' : 'COMPLETE SETUP'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
