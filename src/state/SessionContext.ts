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

  deployments: Deployment[];
  saveDeployment: (input: DeploymentInput) => { updated: boolean; deployment: Deployment } | null;

  activeMission: ActiveMission | null;
  /** True when a rescue mission is active for the currently selected mine. */
  rescueActive: boolean;
}

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
