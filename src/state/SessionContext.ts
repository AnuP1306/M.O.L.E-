import { createContext, useContext } from 'react';
import type {
  AccessRequestInput, ActiveMission, CreateAccountResult, CreatedCredentials, Deployment,
  LocationAllocation, LoginResult, Mine, MineSetup, User,
} from '../types';

export interface DeploymentInput {
  date: string;
  shift: string;
  shiftIncharge: string;
  allocations: LocationAllocation[];
  remarks: string;
}

export interface SessionValue {
  user: User | null;
  /** Mines the signed-in user is assigned to. */
  mines: Mine[];
  selectedMine: Mine | null;
  selectMine: (mineId: string) => void;

  login: (loginId: string, password: string, remember: boolean) => LoginResult;
  logout: () => void;

  isLoginIdTaken: (loginId: string) => boolean;
  createAccount: (input: AccessRequestInput) => CreateAccountResult;
  createdCredentials: CreatedCredentials | null;
  clearCreatedCredentials: () => void;

  mineSetups: Record<string, MineSetup>;
  saveMineSetup: (setup: MineSetup) => void;
  siteManagerSetupCompleted: boolean;
  markSiteManagerSetupCompleted: () => void;

  deployments: Deployment[];
  saveDeployment: (input: DeploymentInput) => { updated: boolean; deployment: Deployment } | null;

  /**
   * The active mission for the CURRENTLY SELECTED MINE only. This is already
   * scoped by mineId (and excludes ended missions) — it is null whenever the
   * selected mine has no live mission, even if some other mine has one.
   * Never read a mission belonging to a different mine from this field.
   */
  activeMission: ActiveMission | null;
  declareMission: (input: Omit<ActiveMission, 'id' | 'mineId' | 'declaredAt' | 'status' | 'rescueProgress'>) => ActiveMission | null;
  updateMissionStatus: (status: ActiveMission['status']) => void;
  updateMissionProgress: (progress: number) => void;
  /** Clears/ends the active mission entirely. The mine returns to no-mission / pre-disaster state. */
  endMission: () => void;
  /** True when a non-ended emergency exists for the currently selected mine, including the waiting state. */
  rescueActive: boolean;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
