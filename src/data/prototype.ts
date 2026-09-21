/* ==========================================================================
   Seed data: starter mines and a few built-in logins (kept for development;
   officers normally sign in with the account created from the access form).
   ========================================================================== */
import type { Account, Mine, Role, RoutePath } from '../types';

export const MINES: Mine[] = [
  {
    id: 'mine-kusunda',
    name: 'Kusunda Underground Mine',
    officialMineCode: 'KUS-UG-01',
    district: 'Dhanbad',
    state: 'Jharkhand',
    status: 'OPERATIONAL',
  },
  {
    id: 'mine-jharia',
    name: 'Jharia Underground Mine',
    officialMineCode: 'JHA-UG-02',
    district: 'Dhanbad',
    state: 'Jharkhand',
    status: 'OPERATIONAL',
  },
  {
    id: 'mine-bhurkunda',
    name: 'Bhurkunda Underground Mine',
    officialMineCode: 'BHU-UG-03',
    district: 'Ramgarh',
    state: 'Jharkhand',
    status: 'STANDBY',
  },
];

export const SEEDED_ACCOUNTS: Account[] = [
  {
    loginId: 'site.manager',
    password: 'demo',
    user: {
      id: 'user-site-manager',
      name: 'Demo Site Manager',
      designation: 'Mine Manager',
      role: 'SITE_MANAGER',
      organization: 'Mine Operator',
      assignedMineIds: ['mine-kusunda', 'mine-jharia', 'mine-bhurkunda'],
    },
  },
  {
    loginId: 'dispatcher',
    password: 'demo',
    user: {
      id: 'user-dispatcher',
      name: 'Demo Dispatcher',
      designation: 'Control Room Dispatcher',
      role: 'DISPATCHER',
      organization: 'Mine Operator',
      assignedMineIds: ['mine-kusunda', 'mine-jharia'],
    },
  },
  {
    loginId: 'rescue.operator',
    password: 'demo',
    user: {
      id: 'user-rescue-operator',
      name: 'Demo Rescue Operator',
      designation: 'Rescue Rover Operator',
      role: 'RESCUE_OPERATOR',
      organization: 'Rescue Station',
      assignedMineIds: ['mine-kusunda', 'mine-jharia', 'mine-bhurkunda'],
    },
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  SITE_MANAGER: 'SITE MANAGER',
  DISPATCHER: 'DISPATCHER',
  RESCUE_OPERATOR: 'RESCUE OPERATOR',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SITE_MANAGER: 'Configures the mine, its layout and monitoring setup.',
  DISPATCHER: 'Manages daily underground personnel deployment.',
  RESCUE_OPERATOR: 'Runs the rover and rescue console during an emergency.',
};

/** Where each role lands after a successful login. */
export const ROLE_HOME: Record<Role, RoutePath> = {
  SITE_MANAGER: '/site-manager',
  DISPATCHER: '/dispatcher',
  RESCUE_OPERATOR: '/rescue',
};

export const ROLE_OPTIONS: Role[] = ['SITE_MANAGER', 'DISPATCHER', 'RESCUE_OPERATOR'];
