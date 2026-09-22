import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, BatteryCharging, Camera as CameraIcon, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleDot, CloudRain, Crosshair, Droplets, Flame, Gauge, Globe2, HardHat,HeartPulse, Image as ImageIcon, Info, LifeBuoy, Map as MapIcon, MapPin, Maximize2, Moon, Navigation, Pause, Play, Radio, Search, Settings2, ShieldAlert, Signal, Sun, Thermometer, Timer, UserRound, Users, Wind, X, Zap } from 'lucide-react';

type Page = 'Overview' | 'Camera' | 'Mapping' | 'Environment' | 'Mission Log';
type Severity = 'critical' | 'warning' | 'safe';
type Mission = { id: string; mine: string; location: string; date: string; time: string; type: 'pre' | 'post'; hazard?: string; survivors?: string; summary?: string; };

const mines = ['Jharia Central', 'Raniganj East', 'Kolar Gold Fields', 'Singareni Block 7', 'Neyveli Lignite'];
const hazards = [
  { id: 'H-042', title: 'CH4 HIGH', detail: 'Methane levels exceed LEL at Sector 4. Suspend drilling immediately.', time: '2 min ago', severity: 'critical' as Severity },
  { id: 'H-039', title: 'WATER INGRESS', detail: 'Subterranean flooding detected in lower shaft. Rate rising.', time: '11 min ago', severity: 'warning' as Severity },
  { id: 'H-035', title: 'SIGNAL DEGRADATION', detail: 'Relay node R-02 intermittent. Alternate route recommended.', time: '18 min ago', severity: 'warning' as Severity },
];
const targets = [
  { id: 'S-01', status: 'ALIVE', note: 'Vitals detected · stable', distance: '42 m', kind: 'safe' as Severity },
  { id: 'S-02', status: 'INJURED', note: 'Weak pulse · thermal detected', distance: '86 m', kind: 'warning' as Severity },
  { id: 'U-01', status: 'UNKNOWN', note: 'Heat signature only', distance: '112 m', kind: 'critical' as Severity },
];
const missions: Mission[] = [
  { id: 'pre-jharia', type: 'pre', mine: 'Jharia Central', location: 'Dhanbad, Jharkhand', time: '02:18:44', date: '12 Sep 2026' },
  { id: 'pre-raniganj', type: 'pre', mine: 'Raniganj East', location: 'Asansol, West Bengal', time: '01:42:09', date: '29 Aug 2026' },
  { id: 'pre-kolar', type: 'pre', mine: 'Kolar Gold Fields', location: 'Kolar, Karnataka', time: '03:06:51', date: '18 Aug 2026' },
  { id: 'pre-neyveli', type: 'pre', mine: 'Neyveli Lignite', location: 'Cuddalore, Tamil Nadu', time: '01:54:20', date: '04 Aug 2026' },
  { id: 'pre-singareni', type: 'pre', mine: 'Singareni Block 7', location: 'Kothagudem, Telangana', time: '02:41:16', date: '22 Jul 2026' },
  { id: 'post-jharia', type: 'post', mine: 'Jharia Central', location: 'Dhanbad, Jharkhand', time: '04:36:12', date: '14 Sep 2026', hazard: 'Methane gas leak', survivors: '4 survivors · 1 confirmed deceased', summary: 'M.O.L.E. located four trapped miners through the east ventilation branch. The rescue team followed a viable route after methane levels stabilized and extracted survivors through the maintenance shaft.' },
  { id: 'post-raniganj', type: 'post', mine: 'Raniganj East', location: 'Asansol, West Bengal', time: '05:12:48', date: '30 Aug 2026', hazard: 'Roof collapse', survivors: '2 survivors · 0 confirmed deceased', summary: 'A secondary collapse blocked the main route. The rover mapped a narrow bypass, relayed coordinates, and guided the rescue crew to both survivors.' },
  { id: 'post-kolar', type: 'post', mine: 'Kolar Gold Fields', location: 'Kolar, Karnataka', time: '03:28:05', date: '19 Aug 2026', hazard: 'Flooding', survivors: '1 survivor · 2 confirmed deceased', summary: 'Water ingress was isolated at the lower pump room. Thermal scans identified one survivor above the rising water line.' },
  { id: 'post-neyveli', type: 'post', mine: 'Neyveli Lignite', location: 'Cuddalore, Tamil Nadu', time: '02:55:34', date: '05 Aug 2026', hazard: 'Structural crack', survivors: '3 survivors · 0 confirmed deceased', summary: 'A flagged crack widened during the response. The rover completed a rapid scan and created a safe corridor for extraction.' },
  { id: 'post-singareni', type: 'post', mine: 'Singareni Block 7', location: 'Kothagudem, Telangana', time: '06:04:19', date: '23 Jul 2026', hazard: 'Coal dust ignition', survivors: '0 survivors · 3 confirmed deceased', summary: 'The blast zone was isolated and all personnel were accounted for after a full atmospheric survey.' },
];

function App({ sessionSlot, preDisaster = false, workerAllocations = [], mineName = 'Jharia Central', maxDepth = 227, mapSource = 'SLAM' }: { sessionSlot?: React.ReactNode; preDisaster?: boolean; workerAllocations?: { id: string; name: string; type: string; workers: number }[]; mineName?: string; maxDepth?: number; mapSource?: 'UPLOAD' | 'SLAM' }) {
  const [page, setPage] = useState<Page>('Overview');
  const [dark, setDark] = useState(true);
  const [missionSeconds, setMissionSeconds] = useState(2 * 3600 + 45 * 60 + 12);
  const [stopped, setStopped] = useState(false);
  const [missionActive, setMissionActive] = useState(!preDisaster);
  const [mapProgress, setMapProgress] = useState(preDisaster && mapSource === 'UPLOAD' ? 100 : 0);
  const [mappingPaused, setMappingPaused] = useState(false);

  useEffect(() => {
    if (!missionActive) return;
    const timer = window.setInterval(() => setMissionSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [missionActive]);

  useEffect(() => {
    if (!preDisaster) return;
    if (mapSource === 'UPLOAD') {
      setMapProgress(100);
      setMappingPaused(false);
      return;
    }
    setMapProgress(0);
    setMappingPaused(false);
  }, [preDisaster, mapSource]);

  useEffect(() => {
    if (!preDisaster || mapSource === 'UPLOAD' || mappingPaused || mapProgress >= 100) return;
    // 30 increments × 2 seconds = approximately one minute for the prototype.
    const timer = window.setInterval(() => {
      setMapProgress((current) => Math.min(100, current + (100 / 30)));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [preDisaster, mapSource, mappingPaused, mapProgress]);

  const missionTime = new Date(missionSeconds * 1000).toISOString().substring(11, 19);

  return <div className={dark ? 'app dark' : 'app light'}>
    <TopNav sessionSlot={sessionSlot} page={page} setPage={setPage} dark={dark} setDark={setDark} missionTime={missionTime} missionActive={missionActive} preDisaster={preDisaster} onStop={() => setStopped(true)} onStart={() => { setMissionSeconds(0); setMissionActive(true); }} />
    {stopped && <div className="stop-overlay"><div className="stop-modal"><ShieldAlert size={42} /><p>EMERGENCY STOP ACTIVE</p><span>All rover movement and drilling commands are paused.</span><div className="stop-actions"><button className="btn primary" onClick={() => setStopped(false)}>Resume operations</button><button className="btn end-mission" onClick={() => { setMissionSeconds(0); setMissionActive(false); setStopped(false); }}>End mission</button></div></div></div>}
    <main className="page-wrap">
      {page === 'Overview' && <Overview preDisaster={preDisaster} workerAllocations={workerAllocations} mineName={mineName} maxDepth={maxDepth} mapProgress={mapProgress} />}
      {page === 'Camera' && <CameraPage preDisaster={preDisaster} />}
      {page === 'Mapping' && <MappingPage preDisaster={preDisaster} workerAllocations={workerAllocations} mineName={mineName} maxDepth={maxDepth} mapProgress={mapProgress} mappingPaused={mappingPaused} setMappingPaused={setMappingPaused} />}
      {page === 'Environment' && <EnvironmentPage preDisaster={preDisaster} />}
      {page === 'Mission Log' && <MissionLog />}
    </main>
  </div>;
}

function TopNav({ sessionSlot, page, setPage, dark, setDark, missionTime, missionActive, preDisaster, onStop, onStart }: { sessionSlot?: React.ReactNode; page: Page; setPage: (p: Page) => void; dark: boolean; setDark: (v: boolean) => void; missionTime: string; missionActive: boolean; preDisaster: boolean; onStop: () => void; onStart: () => void }) {
  const links: Page[] = ['Overview', 'Camera', 'Mapping', 'Environment', 'Mission Log'];
  return <header className="topbar"><div className="brand"><div className="brand-mark">M.</div><div><strong>M.O.L.E.</strong><small>MINE OPERATIONS & LIFE-SAVING EXPLORER</small></div></div><nav>{links.map((link) => <button className={page === link ? 'active' : ''} onClick={() => setPage(link)} key={link}>{link}</button>)}</nav><div className="top-actions">{sessionSlot}<div className="mission-clock"><span>{preDisaster ? "OPERATION TIME" : "MISSION TIME"}</span><b>{missionTime}</b></div><StatusBadge text={preDisaster ? "NORMAL" : (missionActive ? "ACTIVE" : "ENDED")} tone={preDisaster ? "safe" : (missionActive ? "safe" : "warning")} /><button className="icon-btn theme-btn" onClick={() => setDark(!dark)} title="Toggle theme">{dark ? <Sun size={14} /> : <Moon size={14} />}<span>{dark ? 'LIGHT' : 'DARK'}</span></button>{!preDisaster && <button className={`emergency ${missionActive ? "" : "start-mission"}`} onClick={missionActive ? onStop : onStart}>{missionActive ? <ShieldAlert size={14} /> : <Play size={14} />} {missionActive ? "EMERGENCY STOP" : "START MISSION"}</button>}</div></header>;
}
function StatusBadge({ text, tone }: { text: string; tone: Severity | 'blue' }) { return <span className={`badge ${tone}`}>{text}</span>; }
function Panel({ title, icon, children, className = '' }: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) { return <section className={`panel ${className}`}><div className="panel-title"><span>{icon}</span><b>{title}</b><i /></div>{children}</section>; }
function Stat({ label, value, unit, tone = '' }: { label: string; value: string; unit?: string; tone?: string }) { return <div className="stat"><span>{label}</span><b className={tone}>{value}<small>{unit}</small></b></div>; }
function AckButton({ acknowledged, onClick }: { acknowledged: boolean; onClick: () => void }) { return <button className={`ack ${acknowledged ? 'acknowledged' : ''}`} onClick={onClick}>{acknowledged ? <Check size={11} /> : 'ACK'}</button>; }
function useAcknowledged() { const [items, setItems] = useState<string[]>([]); return { items, toggle: (id: string) => setItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }; }

function Overview({ preDisaster = false, workerAllocations = [], mineName = 'Jharia Central', maxDepth = 227, mapProgress = 0 }: { preDisaster?: boolean; workerAllocations?: { id: string; name: string; type: string; workers: number }[]; mineName?: string; maxDepth?: number; mapProgress?: number }) {
  const ack = useAcknowledged();
  return <div className="overview-grid">
    <div className="col-stack"><Telemetry preDisaster={preDisaster} /><EnvironmentSensors preDisaster={preDisaster} /></div>
    <div className="col-stack center-col"><CameraPanel compact /><LidarMap compact={true} mine={mineName} /></div>
    <div className="col-stack"><RemoteOperations preDisaster={preDisaster} /><Targets ack={ack} preDisaster={preDisaster} workerAllocations={workerAllocations} mapProgress={mapProgress} /></div>
  </div>;
}

function Telemetry({ preDisaster = false }: { preDisaster?: boolean }) { return <Panel title="Rover telemetry" icon={<Radio size={13} />}><div className="rover-id"><div className="rover-avatar"><Navigation size={20} /></div><div><span>ROVER ID</span><b>MOLE-01</b></div><StatusBadge text={preDisaster ? 'READY' : 'DEPLOYED'} tone="safe" /></div><div className="battery"><div><span><BatteryCharging size={15} /> BATTERY</span><b>{preDisaster ? '94%' : '82%'}</b></div><div className="battery-track"><i style={{ width: preDisaster ? '94%' : '82%' }} /></div><small>{preDisaster ? 'READY FOR DEPLOYMENT' : 'EST. 04:28 REMAINING'}</small></div><div className="stat-grid"><Stat label="SPEED" value={preDisaster ? '0.0' : '1.2'} unit="m/s" /><Stat label="DISTANCE" value={preDisaster ? '0' : '452'} unit="m" /><Stat label="HEADING" value="042" unit="° NE" /><Stat label="SIGNAL" value="98.7" unit="%" tone="green" /><Stat label="TILT" value="0.4" unit="°" /><Stat label="ALTITUDE" value={preDisaster ? '0' : '−84'} unit="m" /></div><div className="sector"><span>{preDisaster ? 'STARTING LOCATION' : 'MISSION SECTOR'}</span><b>{preDisaster ? 'MINE ENTRANCE' : 'SECTOR 04'} <small>· {preDisaster ? 'DESIGNATED ACCESS POINT' : 'EAST VENTILATION BRANCH'}</small></b></div></Panel>; }
function EnvironmentSensors({ preDisaster = false }: { preDisaster?: boolean }) { return <Panel title="Environmental sensors" icon={<Wind size={13} />}><div className="sensor-summary"><Stat label="TEMP" value={preDisaster ? "28.4" : "42.5"} unit="°C" tone={preDisaster ? "green" : "red"} /><Stat label="HUMIDITY" value={preDisaster ? "64" : "88"} unit="%" /></div><div className="subhead">ATMOSPHERIC COMPOSITION <span>LIVE</span></div><div className="gas-grid">{preDisaster ? <><Gas name="CH4" value="0.35" unit="%" status="NORMAL" severity="safe" /><Gas name="CO" value="4" unit="ppm" status="NORMAL" severity="safe" /><Gas name="CO2" value="0.08" unit="%" status="NORMAL" severity="safe" /><Gas name="O2" value="20.6" unit="%" status="NORMAL" severity="safe" /></> : <><Gas name="CH4" value="4.2" unit="%" status="HIGH LEL" severity="critical" /><Gas name="CO" value="12" unit="ppm" status="NOMINAL" severity="safe" /><Gas name="CO2" value="0.1" unit="%" status="NOMINAL" severity="safe" /><Gas name="O2" value="19.1" unit="%" status="LOW" severity="warning" /></>}</div></Panel>; }
function Gas({ name, value, unit, status, severity }: { name: string; value: string; unit: string; status: string; severity: Severity }) { return <div className={`gas ${severity}`}><span>{name}</span><b>{value}<small>{unit}</small></b><StatusBadge text={status} tone={severity} /></div>; }

function CameraPanel({ compact = false, full = false }: { compact?: boolean; full?: boolean }) { const [mode, setMode] = useState<'normal' | 'night' | 'thermal'>('normal'); const [zoom, setZoom] = useState(1); const [flash, setFlash] = useState(false); const [pan, setPan] = useState({ x: 0, y: 0 }); const [clean, setClean] = useState(false); const move = (x: number, y: number) => setPan((p) => ({ x: Math.max(-12, Math.min(12, p.x + x)), y: Math.max(-10, Math.min(10, p.y + y)) })); const night = mode === 'night'; const thermal = mode === 'thermal'; const title = full ? 'Camera / CAM 01' : compact ? 'Thermal camera / CAM 01' : 'Normal camera / CAM 01'; return <Panel title={title} icon={<CameraIcon size={13} />} className={`camera-panel ${night ? 'night' : ''} ${thermal ? 'thermal' : ''} ${flash ? 'flash' : ''} ${full ? 'full' : ''}`}><div className="camera-feed" style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}><div className="feed-noise" /><div className="tunnel-ribs" /><div className="feed-rover"><Crosshair size={28} /><span>{thermal ? 'THERMAL FEED' : night ? 'NIGHT VISION' : 'LIVE FEED'}</span></div><div className="feed-readout"><b>REC <i /></b><span>ZOOM {(zoom * 100).toFixed(0)}%</span><span>PAN {pan.x > 0 ? '+' : ''}{pan.x}° / {pan.y > 0 ? '+' : ''}{pan.y}°</span></div></div><div className="camera-controls"><div className="control-row"><button className="btn small" onClick={() => setZoom(Math.min(1.8, zoom + .1))}>ZOOM IN</button><button className="btn small" onClick={() => setZoom(Math.max(.7, zoom - .1))}>ZOOM OUT</button><button className="btn small" onClick={() => setMode(mode === 'night' ? 'normal' : 'night')}>{night ? <Sun size={12} /> : <Moon size={12} />} {night ? 'NORMAL' : 'NIGHT VISION'}</button><button className={`btn small ${thermal ? 'success-btn' : ''}`} onClick={() => setMode(thermal ? 'normal' : 'thermal')}><Thermometer size={12} /> {thermal ? 'NORMAL CAM' : 'THERMAL CAM'}</button><button className="btn small" onClick={() => { setFlash(true); window.setTimeout(() => setFlash(false), 350); }}>TAKE PICTURE</button><button className={`btn small ${clean ? 'success-btn' : ''}`} onClick={() => { setClean(true); window.setTimeout(() => setClean(false), 1500); }}>{clean ? <Check size={12} /> : <Settings2 size={12} />} {clean ? 'LENS CLEAN' : 'CLEAN LENS'}</button></div><DPad onMove={move} /></div></Panel>; }
function DPad({ onMove, stop = false, disabled = false }: { onMove: (x: number, y: number) => void; stop?: boolean; disabled?: boolean }) { return <div className={`dpad ${disabled ? 'disabled' : ''}`}><button onClick={() => onMove(0, -2)} disabled={disabled}><ChevronUp size={14} /></button><button onClick={() => onMove(-2, 0)} disabled={disabled}><ChevronLeft size={14} /></button><button className="dpad-center" onClick={() => onMove(stop ? 0 : -100, stop ? 0 : -100)} disabled={disabled}>{stop ? 'STOP' : <Crosshair size={12} />}</button><button onClick={() => onMove(2, 0)} disabled={disabled}><ChevronRight size={14} /></button><button onClick={() => onMove(0, 2)} disabled={disabled}><ChevronDown size={14} /></button></div>; }

const mapVariants: Record<string, { viable: string; possible: string; blocked: string[]; nodes: { type: string; x: string; y: string; label: string }[]; pathLabel: string }> = {
  'Jharia Central': { viable: 'M30 230 C90 190 120 210 180 165 S250 120 320 140 S400 175 480 110 S550 75 590 55', possible: 'M180 165 C150 130 165 95 230 85 S300 55 340 30', blocked: ['M320 140 C345 170 355 210 415 230', 'M480 110 C510 90 520 130 560 150'], nodes: [{ type: 'rover', x: '52%', y: '53%', label: 'MOLE-01 · 452 m' }, { type: 'survivor', x: '73%', y: '28%', label: 'SURVIVOR S-01 · ALIVE' }, { type: 'survivor dead', x: '32%', y: '70%', label: 'CASUALTY U-02 · RECORDED' }, { type: 'hotspot', x: '81%', y: '67%', label: 'CH4 4.2% · HIGH' }, { type: 'hotspot warning', x: '25%', y: '32%', label: 'CH4 1.8% · ELEVATED' }], pathLabel: 'PATH A — 87% VIABLE' },
  'Raniganj East': { viable: 'M20 40 C80 80 130 50 200 95 S280 150 350 120 S430 80 510 130 S570 170 590 200', possible: 'M200 95 C180 130 230 160 290 170 S350 200 380 240', blocked: ['M350 120 C370 150 360 190 400 210', 'M510 130 C540 150 530 100 570 80'], nodes: [{ type: 'rover', x: '36%', y: '35%', label: 'MOLE-01 · 318 m' }, { type: 'survivor', x: '65%', y: '48%', label: 'SURVIVOR S-02 · INJURED' }, { type: 'survivor dead', x: '82%', y: '82%', label: 'CASUALTY U-04 · RECORDED' }, { type: 'hotspot', x: '45%', y: '72%', label: 'CH4 3.1% · HIGH' }], pathLabel: 'PATH B — 74% VIABLE' },
  'Kolar Gold Fields': { viable: 'M40 210 C100 170 160 200 220 150 S300 90 380 120 S460 160 560 95', possible: 'M220 150 C200 110 260 70 320 60 S400 35 460 50', blocked: ['M380 120 C410 150 420 200 470 220', 'M560 95 C580 75 560 130 600 150'], nodes: [{ type: 'rover', x: '64%', y: '44%', label: 'MOLE-01 · 276 m' }, { type: 'survivor', x: '82%', y: '30%', label: 'SURVIVOR S-03 · ALIVE' }, { type: 'hotspot warning', x: '40%', y: '72%', label: 'CH4 1.2% · ELEVATED' }], pathLabel: 'PATH C — 91% VIABLE' },
  'Singareni Block 7': { viable: 'M30 120 C90 90 150 140 210 100 S290 55 370 85 S450 140 530 80 S580 50 590 40', possible: 'M210 100 C190 130 240 170 300 180 S370 210 410 240', blocked: ['M370 85 C400 110 390 160 430 180', 'M530 80 C560 60 540 120 580 140'], nodes: [{ type: 'rover', x: '60%', y: '34%', label: 'MOLE-01 · 388 m' }, { type: 'survivor', x: '78%', y: '58%', label: 'SURVIVOR S-04 · ALIVE' }, { type: 'survivor dead', x: '20%', y: '48%', label: 'CASUALTY U-05 · RECORDED' }, { type: 'hotspot', x: '70%', y: '78%', label: 'CH4 5.1% · CRITICAL' }], pathLabel: 'PATH D — 68% VIABLE' },
  'Neyveli Lignite': { viable: 'M25 250 C85 200 145 230 205 175 S275 110 355 135 S435 180 515 115 S565 75 590 60', possible: 'M205 175 C175 140 195 100 255 85 S325 55 365 30', blocked: ['M355 135 C385 165 375 210 425 230', 'M515 115 C545 95 535 145 575 165'], nodes: [{ type: 'rover', x: '58%', y: '48%', label: 'MOLE-01 · 412 m' }, { type: 'survivor', x: '80%', y: '25%', label: 'SURVIVOR S-05 · ALIVE' }, { type: 'survivor dead', x: '35%', y: '76%', label: 'CASUALTY U-06 · RECORDED' }, { type: 'hotspot warning', x: '22%', y: '38%', label: 'CH4 1.6% · ELEVATED' }], pathLabel: 'PATH E — 83% VIABLE' },
};
type MineMapFeature = { id: string; x: number; y: number; label: string; detail: string; tone: 'safe' | 'warning' | 'info' };

const preMapFeatures: MineMapFeature[] = [
  { id: 'entrance', x: 8, y: 82, label: 'MINE ENTRANCE', detail: 'Rover starting point · Depth 0 m', tone: 'info' },
  { id: 'junction-1', x: 31, y: 66, label: 'JUNCTION J-01', detail: 'Primary divergence · 2 reachable branches', tone: 'info' },
  { id: 'panel-a', x: 48, y: 37, label: 'PANEL A', detail: 'Working panel · 2 reachable routes', tone: 'safe' },
  { id: 'gallery-1', x: 58, y: 69, label: 'GALLERY G-01', detail: 'Main haulage gallery · support line normal', tone: 'safe' },
  { id: 'junction-2', x: 72, y: 61, label: 'JUNCTION J-02', detail: 'Secondary divergence · alternate route available', tone: 'info' },
  { id: 'panel-b', x: 82, y: 28, label: 'PANEL B', detail: 'Working panel · 3 reachable routes', tone: 'safe' },
  { id: 'gallery-2', x: 91, y: 45, label: 'GALLERY G-02', detail: 'Ventilation branch · communication stable', tone: 'safe' },
  { id: 'crack-1', x: 40, y: 55, label: 'STRUCTURAL OBSERVATION', detail: 'Minor roof-line observation · inspection recommended', tone: 'warning' },
  { id: 'gas-1', x: 64, y: 47, label: 'ATMOSPHERIC NODE', detail: 'CH4 0.35% · O2 20.6% · NORMAL', tone: 'safe' },
];

const roverRoutePoints = [
  { x: 8, y: 82 },
  { x: 31, y: 66 },
  { x: 48, y: 37 },
  { x: 72, y: 61 },
  { x: 82, y: 28 },
];

function getRoverPoint(progress: number) {
  const clamped = Math.max(0, Math.min(100, progress));
  const scaled = (clamped / 100) * (roverRoutePoints.length - 1);
  const index = Math.min(roverRoutePoints.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = roverRoutePoints[index];
  const b = roverRoutePoints[index + 1];
  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
  };
}

function getCurrentMineArea(progress: number, workerAllocations: { name: string; workers: number }[]) {
  if (!workerAllocations.length) return 'MINE ENTRANCE';
  const index = Math.min(
    workerAllocations.length - 1,
    Math.floor((Math.max(0, Math.min(99, progress)) / 100) * workerAllocations.length)
  );
  return workerAllocations[index]?.name || 'MINE ENTRANCE';
}

function PreDisasterMap({ compact = false, mine = 'Jharia Central', maxDepth = 227, progress = 0, roverProgress = progress, workerAllocations = [], preDisaster = true }: { compact?: boolean; mine?: string; maxDepth?: number; progress?: number; roverProgress?: number; workerAllocations?: { name: string; workers: number }[]; preDisaster?: boolean }) {
  if (!preDisaster) return <LidarMap compact={compact} mine={mine} />;

  const depth = Math.round((progress / 100) * maxDepth);
  const roverDepth = Math.round((roverProgress / 100) * maxDepth);
  const rover = getRoverPoint(roverProgress);
  const currentArea = getCurrentMineArea(roverProgress, workerAllocations);

  const segments = [
    { d: 'M 8 82 C 18 78 24 72 31 66', start: 0, end: 25, label: 'ENTRANCE → JUNCTION J-01' },
    { d: 'M 31 66 C 38 57 42 46 48 37', start: 25, end: 50, label: 'J-01 → PANEL A' },
    { d: 'M 48 37 C 57 43 65 55 72 61', start: 50, end: 75, label: 'PANEL A → JUNCTION J-02' },
    { d: 'M 72 61 C 76 52 79 38 82 28', start: 75, end: 100, label: 'J-02 → PANEL B' },
  ];
  const alternateSegments = [
    { d: 'M 31 66 C 40 67 50 69 58 69 C 64 68 68 64 72 61', start: 25, end: 75 },
    { d: 'M 72 61 C 79 56 85 49 91 45', start: 68, end: 100 },
  ];
  const visibleAt = (threshold: number) => progress >= threshold;
  const routeCount = Math.min(6, progress === 0 ? 0 : 1 + Math.floor(progress / 20));

  return <Panel title="Lidar mine mapping" icon={<MapIcon size={13} />} className={`map-panel pre-map-panel ${compact ? 'compact-map' : ''}`}>
    <div className="pre-map-meta">
      <span>DEPTH <b>{depth} m</b></span>
      <span>MAP COVERAGE <b>{Math.floor(progress)}%</b></span>
      <span>ROUTES RECORDED <b>{routeCount}</b></span>
      <span>ROVER <b>{currentArea}</b></span>
    </div>

    <div className="pre-map-canvas">
      <div className="mine-plan-grid" />
      <div className="mine-plan-boundary" />
      <div className="mine-depth-rings" />

      <svg className="mine-plan-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {segments.map((segment, index) => {
          const revealed = Math.max(0, Math.min(1, (progress - segment.start) / (segment.end - segment.start)));
          return <path
            key={`main-${index}`}
            className={`mine-route ${revealed > 0 ? 'revealed' : ''} ${revealed > 0 && (revealed < 1 || (progress >= 100 && index === 3)) ? 'active-route' : ''} ${revealed >= 1 && progress >= 100 ? 'completed-route' : ''}`}
            d={segment.d}
            style={{ strokeDashoffset: `${100 - revealed * 100}` }}
          />;
        })}

        {alternateSegments.map((segment, index) => {
          const revealed = Math.max(0, Math.min(1, (progress - segment.start) / (segment.end - segment.start)));
          return <path
            key={`alternate-${index}`}
            className={`mine-route alternate-route ${revealed > 0 ? 'revealed' : ''}`}
            d={segment.d}
            style={{ strokeDashoffset: `${100 - revealed * 100}` }}
          />;
        })}

        <path
          className={`mine-ventilation ${progress >= 35 ? 'revealed' : ''}`}
          d="M 12 88 C 25 86 39 86 52 88 C 66 90 79 84 91 76"
        />
      </svg>

      {preMapFeatures.filter((feature) => {
        const thresholds: Record<string, number> = {
          entrance: 0,
          'junction-1': 10,
          'panel-a': 38,
          'gallery-1': 48,
          'crack-1': 54,
          'gas-1': 66,
          'junction-2': 70,
          'panel-b': 88,
          'gallery-2': 94,
        };
        return progress >= (thresholds[feature.id] ?? 100);
      }).map((feature) => (
        <div
          key={feature.id}
          className={`mine-feature ${feature.tone}`}
          style={{ left: `${feature.x}%`, top: `${feature.y}%` }}
        >
          {feature.id.includes('panel') ? <HardHat size={12} />
            : feature.id.includes('crack') ? <AlertTriangle size={12} />
            : feature.id.includes('gas') ? <Wind size={12} />
            : feature.id.includes('entrance') ? <MapPin size={12} />
            : <CircleDot size={11} />}
          <span>{feature.label}</span>
        </div>
      ))}

      <div
        className="mine-rover-marker"
        style={{ left: `${rover.x}%`, top: `${rover.y}%` }}
        title={`M.O.L.E. rover · ${roverDepth} m depth`}
      >
        <Navigation size={13} />
      </div>

      <div className="mine-entrance-label">START · 0 m</div>
      <div className="map-route-label route-a">PRIMARY ROUTE</div>
      {visibleAt(42) && <div className="map-route-label route-b">ALTERNATE ROUTE</div>}

      <div className="mapping-progress-badge">
        <span>{progress >= 100 ? 'MAPPING COMPLETE' : 'SLAM MAPPING ACTIVE'}</span>
        <b>{Math.floor(progress)}%</b>
        <small>ROVER {roverDepth} m · {Math.round(roverDepth * 1.85)} m travelled</small>
      </div>
    </div>

    <div className="map-footer">
      <span><i className="dot green" />ACTIVE ROVER ROUTE</span>
      <span><i className="line dash" />ALTERNATE PATH</span>
      <span><i className="dot amber" />STRUCTURAL / SENSOR OBSERVATION</span>
      <span className="map-distance">ROVER DISTANCE <b>{Math.round(roverDepth * 1.85)} m</b></span>
    </div>
  </Panel>;
}

function LidarMap({ compact = false, building = false, mine = 'Jharia Central' }: { compact?: boolean; building?: boolean; mine?: string }) { const variant = mapVariants[mine] ?? mapVariants['Jharia Central']; return <Panel title="Lidar map navigation" icon={<MapIcon size={13} />} className={`map-panel ${compact ? 'compact-map' : ''}`}><div className="map-canvas"><div className="map-grid" /><div className="map-routes"><svg viewBox="0 0 600 260" preserveAspectRatio="none"><path className="possible" d={variant.possible} /><path className="viable" d={variant.viable} />{variant.blocked.map((d, i) => <path className="blocked" d={d} key={i} />)}</svg></div><div className="path-info"><span>PATH A</span><b>{variant.pathLabel.split('—')[1]?.trim() ?? '87% VIABLE'}</b></div>{building ? <div className="build-pulse"><span>AREA COVERAGE 68%</span></div> : variant.nodes.map((node) => <MapNode key={`${node.type}-${node.x}`} type={node.type} x={node.x} y={node.y} label={node.label} />)}</div><div className="map-footer"><span><i className="dot green" />VIABLE</span><span><i className="line dash" />POSSIBLE</span><span><i className="dot red" />BLOCKED / HAZARD</span><span className="map-distance">ENTRANCE <b>452 m</b></span></div></Panel>; }
function MapNode({ type, x, y, label }: { type: string; x: string; y: string; label: string }) { return <div className={`map-node ${type}`} style={{ left: x, top: y }} title={label}>{type === 'rover' ? <Navigation size={14} /> : type.includes('survivor') ? <UserRound size={13} /> : <Flame size={13} />}<span>{label}</span></div>; }

function NormalHazardLog() { return <Panel title="Hazard log" icon={<AlertTriangle size={13} />}><div className="normal-hazard"><div className="normal-hazard-icon"><Check size={15} /></div><div><b>NO HAZARDS DETECTED</b><span>Atmospheric and structural checks are within normal operating conditions.</span><small>LIVE · LAST SCAN JUST NOW</small></div></div><div className="normal-hazard-list"><span><i className="dot green" /> GAS LEVELS NORMAL</span><span><i className="dot green" /> WATER INGRESS NORMAL</span><span><i className="dot green" /> COMMUNICATION STABLE</span></div></Panel>; }

function HazardLog({ ack, scrollable = false }: { ack: ReturnType<typeof useAcknowledged>; scrollable?: boolean }) { return <Panel title="Hazard log" icon={<AlertTriangle size={13} />}><div className={`log-list ${scrollable ? 'scrollable' : ''}`}>{hazards.map((item) => <div className={`log-item ${item.severity} ${ack.items.includes(item.id) ? 'muted' : ''}`} key={item.id}><div className="log-icon">{item.severity === 'critical' ? <Flame size={14} /> : <Droplets size={14} />}</div><div className="log-copy"><b>{item.severity.toUpperCase()}: {item.title}</b><p>{item.detail}</p><small>{item.time}</small></div><AckButton acknowledged={ack.items.includes(item.id)} onClick={() => ack.toggle(item.id)} /></div>)}</div></Panel>; }
function Targets({ ack, scrollable = false, preDisaster = false, workerAllocations = [], mapProgress = 0 }: { ack: ReturnType<typeof useAcknowledged>; scrollable?: boolean; preDisaster?: boolean; workerAllocations?: { id: string; name: string; type: string; workers: number }[]; mapProgress?: number }) {
  if (preDisaster) {
    const total = workerAllocations.reduce((sum, item) => sum + Number(item.workers || 0), 0);
    const currentArea = getCurrentMineArea(mapProgress, workerAllocations);
    const currentIndex = workerAllocations.findIndex((item) => item.name === currentArea);
    const currentWorkers = currentIndex >= 0 ? workerAllocations[currentIndex].workers : 0;

    return <Panel title="Today's worker deployment" icon={<Users size={13} />}>
      <div className="deployment-current-area">
        <span>ROVER CURRENT AREA</span>
        <b>{currentArea}</b>
        {currentWorkers > 0 && <strong>{currentWorkers} WORKERS</strong>}
      </div>
      <div className={`target-list deployment-list ${scrollable ? 'scrollable' : ''}`}>
        {workerAllocations.length ? workerAllocations.map((item, index) => (
          <div className={`target ${index === currentIndex ? 'current-location' : ''}`} key={item.id}>
            <div className="target-icon safe"><UserRound size={14} /></div>
            <div><b>{item.name}</b><span>{item.type.replace('_', ' ')}</span></div>
            <strong>{item.workers} WORKERS</strong>
          </div>
        )) : <div className="empty">TODAY'S DEPLOYMENT NOT RECORDED</div>}
      </div>
      {workerAllocations.length > 0 && <div className="deployment-total-row"><span>TOTAL UNDERGROUND PERSONNEL</span><b>{total} WORKERS</b></div>}
    </Panel>;
  }
  return <Panel title="Rescue targets" icon={<Users size={13} />}><div className={`target-list ${scrollable ? 'scrollable' : ''}`}>{targets.map((item) => <div className={`target ${ack.items.includes(item.id) ? 'muted' : ''}`} key={item.id}><div className={`target-icon ${item.kind}`}><UserRound size={14} /></div><div><b>{item.id} · {item.status}</b><span>{item.note}</span></div><strong>DIST: {item.distance}</strong>{ack && <AckButton acknowledged={ack.items.includes(item.id)} onClick={() => ack.toggle(item.id)} />}</div>)}</div></Panel>;
}

function RemoteOperations({ preDisaster = false }: { preDisaster?: boolean }) { const [drill, setDrill] = useState(false); const [intensity, setIntensity] = useState(45); const [autonomous, setAutonomous] = useState(false); return <Panel title="Remote operations" icon={<Navigation size={13} />}><div className="command-line"><span>LAST COMMAND</span><b>{preDisaster ? 'SYSTEM CHECK' : 'ADVANCE 2M'}</b><StatusBadge text={preDisaster ? 'STANDBY' : 'STANDBY'} tone="safe" /></div><div className="autonomous-row"><span><Gauge size={13} /> AUTONOMOUS MODE</span><div className="auto-toggle"><button className={`toggle ${autonomous ? 'on' : ''}`} onClick={() => setAutonomous(!autonomous)}><i /></button><b className={autonomous ? 'green' : ''}>{autonomous ? 'AUTONOMOUS' : 'MANUAL'}</b></div></div><div className={`remote-controls ${autonomous ? 'disabled' : ''}`}><DPad onMove={() => undefined} stop disabled={autonomous} /></div><div className={`quick-actions ${autonomous ? 'disabled' : ''}`}>{autonomous && <div className="disabled-overlay" />}<button>FLASHLIGHT ON</button><button>FLASHLIGHT OFF</button><button>CLEAN LENS</button><button>180° TURNAROUND</button><button>TAKE PICTURE</button></div><div className="drill"><div><span><Gauge size={13} /> FRONT DRILL</span><button className={`toggle ${drill ? 'on' : ''}`} onClick={() => setDrill(!drill)}><i /></button></div><div className="range-row"><span>INTENSITY</span><b>{intensity}%</b></div><input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></div></Panel>; }

function CameraPage({ preDisaster = false }: { preDisaster?: boolean }) { return <div className="camera-layout"><div className="camera-stack"><CameraPanel full /><div className="camera-stack-note"><span><CircleDot size={12} /> SINGLE OPTIC ARRAY ONLINE</span><span>FOV 72° · STABILIZED</span></div></div><div className="camera-side"><RemoteOperations preDisaster={preDisaster} />{preDisaster ? <StructuralInspectionLog /> : <DetectionLog />}</div></div>; }
function DetectionLog() { const [events, setEvents] = useState(['Survivor detected — vitals stable', 'Potential hazard — structural crack, possible collapse risk', 'Unknown heat signature detected', 'Camera lens cleaned by operator']); return <Panel title="Detection log" icon={<Activity size={13} />} className="detection-log"><div className="event-list">{events.map((event, i) => <div className="event" key={`${event}-${i}`}><div className={`event-dot ${i === 1 ? 'warning' : i === 2 ? 'critical' : ''}`} /><div><b>{event}</b><span>18:{42 - i * 3} · CAM 01</span></div></div>)}</div><button className="btn outline add-event" onClick={() => setEvents((current) => [`Snapshot captured — operator review required`, ...current])}><ImageIcon size={12} /> ADD SNAPSHOT EVENT</button></Panel>; }

function StructuralInspectionLog() {
  const [events, setEvents] = useState([
    'Roof profile scan normal — support line intact',
    'Ventilation gallery clear — no visible obstruction',
    'Minor surface crack detected — north support line',
    'Camera lens status normal — visibility clear',
  ]);
  return <Panel title="Structural inspection log" icon={<Activity size={13} />} className="detection-log">
    <div className="event-list">
      {events.map((event, i) => <div className="event" key={`${event}-${i}`}>
        <div className={`event-dot ${i === 2 ? 'warning' : ''}`} />
        <div><b>{event}</b><span>{i === 2 ? 'REVIEW REQUIRED' : 'BASELINE CHECK'} · CAM 01</span></div>
      </div>)}
    </div>
    <button className="btn outline add-event" onClick={() => setEvents((current) => ['Fresh structural scan completed — no new issues', ...current])}>
      <ImageIcon size={12} /> ADD INSPECTION EVENT
    </button>
  </Panel>;
}

function MappingPage({ preDisaster = false, workerAllocations = [], mineName = 'Jharia Central', maxDepth = 227, mapProgress = 0, mappingPaused = false, setMappingPaused }: { preDisaster?: boolean; workerAllocations?: { id: string; name: string; type: string; workers: number }[]; mineName?: string; maxDepth?: number; mapProgress?: number; mappingPaused?: boolean; setMappingPaused?: (value: boolean) => void }) {
  const [selected, setSelected] = useState(mineName || mines[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnProgress, setReturnProgress] = useState(100);

  useEffect(() => {
    if (!returning) return;
    const timer = window.setInterval(() => {
      setReturnProgress((current) => {
        if (current <= 0) {
          window.clearInterval(timer);
          setReturning(false);
          return 0;
        }
        return Math.max(0, current - 5);
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [returning]);

  if (preDisaster) {
    const total = workerAllocations.reduce((sum, item) => sum + Number(item.workers || 0), 0);
    const depth = Math.round(((returning ? returnProgress : mapProgress) / 100) * maxDepth);
    return <div className="mapping-layout">
      <div className="mapping-main">
        <div className="mapping-heading">
          <div><span className="eyebrow">AUTONOMOUS CARTOGRAPHY</span><h1>Mine Mapping<span className="live-dot" /></h1></div>
          <div className="mapping-control-strip"><span>DEPTH <b>{depth} m</b></span><span>COVERAGE <b>{Math.floor(mapProgress)}%</b></span><span>DISTANCE <b>{Math.round(depth * 1.85)} m</b></span>{mapProgress < 100 && <button className="btn small" onClick={() => setMappingPaused?.(!mappingPaused)}>{mappingPaused ? <Play size={12} /> : <Pause size={12} />} {mappingPaused ? 'RESUME MAPPING' : 'PAUSE MAPPING'}</button>}{mapProgress >= 100 && <button className="btn small primary" onClick={() => { setReturning(true); setReturnProgress(100); }} disabled={returning}>{returning ? <Navigation size={12} /> : <Navigation size={12} />} {returning ? 'RETURNING TO ENTRANCE' : 'RETURN TO ENTRANCE'}</button>}</div>
        </div>
        <LidarMap mine={mineName} />
      </div>
      <div className="mapping-side">
        <Panel title="Mine structure" icon={<MapPin size={13} />}><div className="mine-structure-summary"><div><b>{mineName}</b><span>ACTIVE MINE</span></div><div className="structure-grid"><span>PANELS <b>2</b></span><span>GALLERIES <b>6</b></span><span>WORK AREAS <b>3</b></span><span>DEPTH <b>{depth} m</b></span></div></div></Panel>
        <Panel title="Today's worker deployment" icon={<Users size={13} />}><div className="mapping-worker-list">{workerAllocations.length ? workerAllocations.map((item) => <div key={item.id}><span>{item.name}</span><b>{item.workers}</b></div>) : <div className="empty">TODAY'S DEPLOYMENT NOT RECORDED</div>}{workerAllocations.length > 0 && <div className="mapping-worker-total"><span>TOTAL</span><b>{total}</b></div>}</div></Panel>
        <NormalHazardLog />
        <Panel title="Route analysis" icon={<Navigation size={13} />}><div className="route-analysis"><div><span>ROUTES RECORDED</span><b>{Math.min(6, Math.floor(mapProgress / 17) + (mapProgress > 0 ? 1 : 0))}</b></div><div><span>ALTERNATE PATHS</span><b>{Math.min(2, Math.floor(mapProgress / 45))}</b></div><div><span>STRUCTURAL FLAGS</span><b>{mapProgress >= 55 ? '1' : '0'}</b></div></div></Panel>
      </div>
    </div>;
  }

  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState('');
  const [buildProgress, setBuildProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const createMap = () => { setMessage('Creating a map of your mine...'); setBuilding(true); setBuildProgress(0); const interval = window.setInterval(() => { setBuildProgress((p) => { if (p >= 100) { window.clearInterval(interval); return 100; } return p + 5; }); }, 190); window.setTimeout(() => { setBuilding(false); setMessage('Map build complete · live coverage connected'); window.setTimeout(() => setMessage(''), 3000); }, 4000); };
  return <div className="mapping-layout"><div className="mapping-main"><div className="mapping-heading"><div><span className="eyebrow">AUTONOMOUS CARTOGRAPHY</span><h1>Lidar Map Navigation<span className="live-dot" /></h1></div><div className="map-actions"><input type="file" ref={fileRef} style={{ display: 'none' }} onChange={() => createMap()} /><button className="btn outline" onClick={() => fileRef.current?.click()}><UploadIcon /> UPLOAD NEW MAP</button><button className="btn primary" onClick={createMap}><Play size={13} /> START SLAM MAPPING</button></div></div>{message && <div className="toast"><Check size={13} />{message}</div>}<LidarMap building={building} mine={selected} />{building && <div className="build-overlay"><div className="build-info"><span>COVERAGE</span><b>{buildProgress}%</b></div><div className="build-bar"><i style={{ width: `${buildProgress}%` }} /></div><div className="build-classes"><span><i className="dot green" />VIABLE</span><span><i className="line dash" />POSSIBLE</span><span><i className="dot red" />BLOCKED</span></div></div>}</div><div className="mapping-side"><Panel title="Mapped mines" icon={<MapPin size={13} />} className={dropdownOpen ? 'mapped-mines-open' : 'mapped-mines-closed'}><div className="mine-dropdown"><button className={`mine-selected ${dropdownOpen ? 'open' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}><span><MapPin size={13} />{selected}</span><ChevronDown size={13} /></button>{dropdownOpen && <div className="mine-options">{mines.map((mine, i) => <button className={selected === mine ? 'selected' : ''} onClick={() => { setSelected(mine); setDropdownOpen(false); }} key={mine}><span><MapPin size={13} />{mine}</span><small>{i === 0 ? 'LIVE' : `${i + 2} DAYS AGO`}</small></button>)}</div>}</div></Panel><Targets ack={useAcknowledged()} /><HazardLog ack={useAcknowledged()} /><Panel title="Mesh link status" icon={<Signal size={13} />}><div className="mesh"><div className="mesh-score"><b>98.7%</b><span>LINK QUALITY</span></div><StatusBadge text="STABLE" tone="safe" /></div><div className="relay-grid"><span>RELAY R-01 <b>−42 dBm</b></span><span>RELAY R-02 <b>−58 dBm</b></span><span>RELAY R-03 <b>−71 dBm</b></span></div></Panel></div></div>;
}
function UploadIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 14v5h14v-5" /></svg>; }

function EnvironmentPage({ preDisaster = false }: { preDisaster?: boolean }) { const normal = preDisaster; return <div className="environment-page"><div className="page-heading"><div><span className="eyebrow">ATMOSPHERIC INTELLIGENCE</span><h1>Environment Monitor<span className="live-dot" /></h1></div><div className="heading-meta"><span>LAST CALIBRATION <b>16:42:08</b></span><StatusBadge text="12 / 12 SENSORS ONLINE" tone="safe" /></div></div><div className="kpi-grid"><Kpi icon={<Thermometer />} label="TEMPERATURE" value={normal ? '28.4°C' : '42.5°C'} sub={normal ? 'Within normal mine range' : '+1.8° from baseline'} tone={normal ? 'green' : 'red'} /><Kpi icon={<Droplets />} label="HUMIDITY" value={normal ? '64%' : '88%'} sub={normal ? 'Normal' : 'Within expected range'} tone="blue" /><Kpi icon={<Flame />} label="METHANE · CH4" value={normal ? '0.35%' : '4.2%'} sub={normal ? 'Normal atmospheric level' : 'Above lower explosive limit'} tone={normal ? 'green' : 'red'} /><Kpi icon={<Wind />} label="OXYGEN · O2" value={normal ? '20.6%' : '19.1%'} sub={normal ? 'Normal atmospheric level' : 'Marginally low'} tone={normal ? 'green' : 'amber'} /></div><div className="charts-grid"><Panel title={normal ? 'Methane concentration · normal baseline' : 'Methane concentration · last 60 minutes'} icon={<Activity size={13} />} className="large-chart"><div className="chart-legend"><span><i className="dot green" />CH4 %</span><span>STATUS <b>{normal ? 'NORMAL' : 'THRESHOLD 4.0%'}</b></span></div><AreaChart normal={normal} /></Panel><Panel title="Gas composition" icon={<Gauge size={13} />}><DonutChart normal={normal} /></Panel><Panel title={normal ? 'Water ingress · normal' : 'Water ingress rate'} icon={<CloudRain size={13} />}><BarChart normal={normal} /></Panel><Panel title="Sensor health" icon={<Settings2 size={13} />}><HealthBars /></Panel></div></div>; }
function Kpi({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: string }) { return <div className={`kpi ${tone}`}><div className="kpi-icon">{icon}</div><div><span>{label}</span><b>{value}</b><small>{sub}</small></div></div>; }
function AreaChart({ normal = false }: { normal?: boolean }) { return <div className="area-chart"><svg viewBox="0 0 800 240" preserveAspectRatio="none"><defs><linearGradient id={normal ? 'area-normal' : 'area'} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={normal ? '#1bb981' : '#fc7c78'} stopOpacity=".28" /><stop offset="1" stopColor={normal ? '#1bb981' : '#fc7c78'} stopOpacity="0" /></linearGradient></defs>{!normal && <path className="threshold" d="M0 82 H800" />}<path className="area" d={normal ? 'M0 175 C70 168 105 176 150 170 S235 174 280 166 S360 174 420 168 S500 172 560 165 S650 171 720 164 S770 169 800 166 V240 H0Z' : 'M0 185 C70 174 84 164 142 178 S210 152 260 164 S320 126 370 143 S425 110 474 124 S532 98 570 111 S635 78 680 93 S740 55 800 60 V240 H0Z'} /><path className="area-line" d={normal ? 'M0 175 C70 168 105 176 150 170 S235 174 280 166 S360 174 420 168 S500 172 560 165 S650 171 720 164 S770 169 800 166' : 'M0 185 C70 174 84 164 142 178 S210 152 260 164 S320 126 370 143 S425 110 474 124 S532 98 570 111 S635 78 680 93 S740 55 800 60'} /></svg><div className="axis"><span>−60m</span><span>−45m</span><span>−30m</span><span>−15m</span><span>NOW</span></div></div>; }
function DonutChart({ normal = false }: { normal?: boolean }) { return <div className="donut-wrap"><div className="donut"><div><b>100%</b><span>COMPOSITION</span></div></div><div className="donut-legend"><span><i className="dot green" />CH4 <b>{normal ? '0.35%' : '4.2%'}</b></span><span><i className="dot blue" />CO <b>{normal ? '4 ppm' : '12 ppm'}</b></span><span><i className="dot green" />O2 <b>{normal ? '20.6%' : '19.1%'}</b></span><span><i className="dot grey" />CO2 <b>{normal ? '0.08%' : '0.1%'}</b></span></div></div>; }
function BarChart({ normal = false }: { normal?: boolean }) { const heights = normal ? [18, 21, 19, 22, 20, 24, 21, 23, 20, 22, 21, 24] : [28, 35, 24, 45, 42, 58, 52, 73, 66, 84, 76, 93]; return <div className="bar-chart"><div className="bars">{heights.map((height, i) => <i style={{ height: `${height}%` }} className={!normal && height > 80 ? 'high' : ''} key={i} />)}</div><div className="axis"><span>12:00</span><span>14:00</span><span>16:00</span><span>NOW</span></div><div className="bar-caption"><b>{normal ? '2 cm' : '14 cm'}</b><span>{normal ? 'current ingress level · normal' : 'current ingress level'}</span></div></div>; }
function HealthBars() { return <div className="health-bars">{[['ATMOSPHERIC', 100], ['THERMAL ARRAY', 100], ['LIDAR SCANNER', 92], ['MESH RELAY', 98]].map(([name, value]) => <div className="health-row" key={String(name)}><div><span>{name}</span><b>{String(value)}%</b></div><div className="health-track"><i style={{ width: `${Number(value)}%` }} /></div></div>)}</div>; }

function MissionLog() { const [search, setSearch] = useState(''); const [selected, setSelected] = useState<Mission | null>(null); const filtered = useMemo(() => { const q = search.toLowerCase().trim(); if (!q) return missions; return missions.filter((m) => `${m.mine} ${m.location} ${m.hazard ?? ''}`.toLowerCase().includes(q) || (q.includes('methane') && m.mine === 'Jharia Central')); }, [search]); return <div className="mission-page"><div className="mission-search"><div><span className="eyebrow">ARCHIVE & REPORTS</span><h1>Mission Log</h1></div><div className="search-box"><Search size={16} /><input placeholder="Search mine, hazard, location..." value={search} onChange={(e) => setSearch(e.target.value)} />{search && <button onClick={() => setSearch('')}><X size={14} /></button>}</div></div><div className="mission-layout"><div className="mission-lists"><MissionBox title="Pre-disaster log" items={filtered.filter((m) => m.type === 'pre')} selected={selected} onSelect={setSelected} /><MissionBox title="Post-disaster log" items={filtered.filter((m) => m.type === 'post')} selected={selected} onSelect={setSelected} /></div><MissionReport mission={selected} /></div></div>; }
function MissionBox({ title, items, selected, onSelect }: { title: string; items: Mission[]; selected: Mission | null; onSelect: (m: Mission) => void }) { return <Panel title={title} icon={title.startsWith('Pre') ? <MapIcon size={13} /> : <LifeBuoy size={13} />}><div className="mission-box-scroll">{items.length ? items.map((m) => <button className={`mission-card ${selected?.id === m.id ? 'selected' : ''}`} onClick={() => onSelect(m)} key={m.id}><div><b>{m.mine}</b><span>{m.location}</span>{m.hazard && <small>{m.hazard}</small>}</div><div className="mission-card-meta"><span><Timer size={11} />{m.time}</span><span>{m.date}</span></div></button>) : <div className="empty">No missions match this search.</div>}</div></Panel>; }
function MissionReport({ mission }: { mission: Mission | null }) { if (!mission) return <div className="report-empty"><FileReportIcon /><h2>Select a mission to see details.</h2><p>Choose a pre- or post-disaster record to open the full incident report.</p></div>; return <div className="report-panel"><div className="report-head"><div><span className="eyebrow">{mission.type === 'post' ? 'INCIDENT REPORT' : 'SURVEY REPORT'}</span><h2>{mission.mine}</h2><span>{mission.location}</span></div><StatusBadge text={mission.type === 'post' ? 'POST-DISASTER' : 'PRE-DISASTER'} tone={mission.type === 'post' ? 'critical' : 'safe'} /></div><div className="report-grid"><div><span>DATE</span><b>{mission.date}</b></div><div><span>TIME TAKEN</span><b>{mission.time}</b></div><div><span>{mission.type === 'post' ? 'HAZARD TYPE' : 'FLAGGED AREAS'}</span><b>{mission.hazard ?? '3 zones flagged'}</b></div>{mission.type === 'post' && <div><span>SURVIVORS DETECTED</span><b>{mission.survivors}</b></div>}</div><div className="report-section"><h3>{mission.type === 'post' ? 'Rescue summary' : 'Survey summary'}</h3><p>{mission.summary ?? 'The autonomous survey covered all accessible branches, producing a detailed mine map and identifying three zones requiring follow-up inspection: east ventilation, lower pump room, and the north support line.'}</p></div><div className="report-section"><h3>{mission.type === 'post' ? 'Captured imagery' : 'Map & flagged areas'}</h3><div className="report-images"><div><MapIcon size={22} /><span>FINAL LIDAR MAP</span></div><div><CameraIcon size={22} /><span>{mission.type === 'post' ? 'NORMAL CAM' : 'RISK AREA'}</span></div><div><Thermometer size={22} /><span>THERMAL CAM</span></div></div></div></div>; }
function FileReportIcon() { return <div className="report-file"><Info size={24} /></div>; }

export default App;
