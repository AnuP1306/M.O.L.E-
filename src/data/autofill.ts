/* ==========================================================================
   Shared helpers for the AUTO-FILL buttons. Every value produced here is a
   plausible placeholder for demoing the prototype - nothing is submitted
   anywhere outside this app.
   ========================================================================== */
import type { Role } from '../types';

const FIRST_NAMES = [
  'Ravi', 'Suresh', 'Anil', 'Vikram', 'Rajesh', 'Deepak', 'Manoj', 'Sanjay', 'Ashok', 'Prakash',
  'Sunita', 'Kavita', 'Pooja', 'Neha', 'Anita', 'Rakesh', 'Birsa', 'Somra', 'Lakhan', 'Gopal',
];
const LAST_NAMES = ['Kumar', 'Singh', 'Verma', 'Sharma', 'Yadav', 'Mahato', 'Oraon', 'Prasad', 'Tiwari', 'Gupta'];

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

export function randomMobile(): string {
  return `${pick(['6', '7', '8', '9'])}${Array.from({ length: 9 }, () => randomInt(0, 9)).join('')}`;
}

export function emailFor(name: string, domain = 'mole-mines.gov.in'): string {
  return `${name.trim().toLowerCase().replace(/\s+/g, '.')}@${domain}`;
}

export function randomEmployeeId(role: Role): string {
  const prefix = role === 'SITE_MANAGER' ? 'SM' : role === 'DISPATCHER' ? 'DSP' : 'RES';
  return `${prefix}-${randomInt(10000, 99999)}`;
}

export const ROLE_DESIGNATIONS: Record<Role, string[]> = {
  SITE_MANAGER: ['Mine Manager', 'Assistant Manager'],
  DISPATCHER: ['Control Room Dispatcher', 'Shift Dispatcher'],
  RESCUE_OPERATOR: ['Rescue Rover Operator', 'Rescue In-charge'],
};

export interface SampleMine {
  organization: string;
  mineName: string;
  mineCode: string;
  district: string;
  state: string;
}

export const SAMPLE_MINES: SampleMine[] = [
  { organization: 'Bharat Coking Coal Ltd.', mineName: 'Kusunda Underground Mine', mineCode: 'KUS-UG-01', district: 'Dhanbad', state: 'Jharkhand' },
  { organization: 'Central Coalfields Ltd.', mineName: 'Bhurkunda Underground Mine', mineCode: 'BHU-UG-03', district: 'Ramgarh', state: 'Jharkhand' },
  { organization: 'Eastern Coalfields Ltd.', mineName: 'Sonepur Bazari Mine', mineCode: 'SPB-UG-07', district: 'Barddhaman', state: 'West Bengal' },
  { organization: 'South Eastern Coalfields Ltd.', mineName: 'Gevra Underground Mine', mineCode: 'GEV-UG-04', district: 'Korba', state: 'Chhattisgarh' },
];

export const DEPLOYMENT_REMARK_SAMPLES = [
  'Routine shift, no issues reported.',
  'Extra ventilation check advised in the lower panel.',
  'New workers inducted this shift; briefed on emergency exits.',
  'Water seepage noted near gallery entrance, being monitored.',
];
