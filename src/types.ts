/* ==========================================================================
   Shared types for the M.O.L.E. operations shell
   ========================================================================== */

export type Role = 'SITE_MANAGER' | 'DISPATCHER' | 'RESCUE_OPERATOR';

export type MineStatus = 'OPERATIONAL' | 'STANDBY' | 'ADVISORY';

export interface Mine {
  id: string;
  name: string;
  officialMineCode: string;
  district: string;
  state: string;
  status: MineStatus;
}

export interface User {
  id: string;
  name: string;
  designation: string;
  role: Role;
  organization: string;
  assignedMineIds: string[];
  employeeId?: string;
  email?: string;
  mobile?: string;
}

/** A login. `loginId` is the Employee / Service ID entered on the access form. */
export interface Account {
  loginId: string;
  password: string;
  user: User;
}

export interface AccessRequestInput {
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
  requestedRole: Role;
  /** File NAME only; the file itself is not kept. */
  documentName?: string;
}

/** Shown once on the "access created" screen. */
export interface CreatedCredentials {
  loginId: string;
  password: string;
  name: string;
  role: Role;
  mineName: string;
}

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export type CreateAccountResult =
  | { ok: true; credentials: CreatedCredentials }
  | { ok: false; error: string };

/* ---- Site Manager setup ---- */
export interface TeamMember {
  name: string;
  designation: string;
  mobile: string;
  email: string;
}

export interface RoverEntry {
  roverId: string;
  serial: string;
  payloads: string[];
}

export interface MineSetup {
  mineId: string;
  completedAt: string;
  workingMethod: string;
  gassiness: string;
  levels: number;
  maxDepth: number;
  workforcePerShift: number;
  shiftsPerDay: number;
  panels: number;
  galleries: number;
  workingAreas: number;
  team: TeamMember[];
  rovers: RoverEntry[];
  mapMethod: 'UPLOAD' | 'SLAM';
  mapFileName?: string;
}

/* ---- Dispatcher deployment ---- */
export type LocationType = 'PANEL' | 'GALLERY' | 'WORKING_AREA';

export interface LocationAllocation {
  id: string;
  name: string;
  type: LocationType;
  workers: number;
}

export interface Deployment {
  id: string;
  mineId: string;
  date: string;
  shift: string;
  shiftIncharge: string;
  allocations: LocationAllocation[];
  remarks: string;
  savedAt: string;
  savedBy: string;
}

/* ---- Rescue ---- */
export interface ActiveMission {
  id: string;
  /** If omitted the mission applies to every mine. */
  mineId?: string;
  declaredAt: string;
}

export type RoutePath =
  | '/'
  | '/login'
  | '/request-access'
  | '/access-created'
  | '/site-manager'
  | '/site-manager/setup'
  | '/site-manager/slam'
  | '/site-manager/operations'
  | '/dispatcher'
  | '/rescue';
