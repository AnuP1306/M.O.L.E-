import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MINES, SEEDED_ACCOUNTS } from '../data/prototype';
import type {
  Account, AccessRequestInput, ActiveMission, CreateAccountResult, CreatedCredentials, Deployment,
  LoginResult, Mine, MineSetup, User,
} from '../types';
import { SessionContext, type DeploymentInput, type SessionValue } from './SessionContext';

/* localStorage / sessionStorage keys */
const KEY_SESSION = 'mole.session.v1';
const KEY_MINE = 'mole.selectedMine.v1';
const KEY_ACCOUNTS = 'mole.accounts.v1';
const KEY_MINES = 'mole.mines.v1';
const KEY_SETUPS = 'mole.mineSetups.v1';
const KEY_ACCOUNT_SETUP = 'mole.accountSetupCompleted.v1';
const KEY_DEPLOYMENTS = 'mole.deployments.v1';
const KEY_MISSION = 'mole.activeMission.v1';
const KEY_CREATED = 'mole.lastCreated.v1'; // sessionStorage only

function getStore(kind: 'local' | 'session'): Storage | undefined {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined; // storage blocked — the app still works, just without persistence
  }
}

function readJSON<T>(store: Storage | undefined, key: string): T | null {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(store: Storage | undefined, key: string, value: unknown) {
  try { store?.setItem(key, JSON.stringify(value)); } catch { /* ignore quota / blocked storage */ }
}

function removeKey(store: Storage | undefined, key: string) {
  try { store?.removeItem(key); } catch { /* ignore */ }
}

const norm = (v: string) => v.trim().toLowerCase();
const slug = (v: string) => norm(v).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';

/** 10-character temporary password (no look-alike characters). */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join('');
}

function allAccounts(created: Account[]): Account[] {
  return [...created, ...SEEDED_ACCOUNTS];
}

function loadUser(created: Account[]): User | null {
  for (const kind of ['local', 'session'] as const) {
    const record = readJSON<{ userId: string }>(getStore(kind), KEY_SESSION);
    const account = record && allAccounts(created).find((a) => a.user.id === record.userId);
    if (account) return account.user;
  }
  return null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(() => readJSON<Account[]>(getStore('local'), KEY_ACCOUNTS) ?? []);
  const [customMines, setCustomMines] = useState<Mine[]>(() => readJSON<Mine[]>(getStore('local'), KEY_MINES) ?? []);
  const [user, setUser] = useState<User | null>(() => loadUser(readJSON<Account[]>(getStore('local'), KEY_ACCOUNTS) ?? []));
  const [selectedMineId, setSelectedMineId] = useState<string | null>(() => readJSON<string>(getStore('local'), KEY_MINE));
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(() => readJSON<CreatedCredentials>(getStore('session'), KEY_CREATED));
  const [mineSetups, setMineSetups] = useState<Record<string, MineSetup>>(() => readJSON<Record<string, MineSetup>>(getStore('local'), KEY_SETUPS) ?? {});
  const [accountSetupCompleted, setAccountSetupCompleted] = useState<Record<string, boolean>>(
    () => readJSON<Record<string, boolean>>(getStore('local'), KEY_ACCOUNT_SETUP) ?? {}
  );
  const [deployments, setDeployments] = useState<Deployment[]>(() => readJSON<Deployment[]>(getStore('local'), KEY_DEPLOYMENTS) ?? []);
  // Raw mission record as persisted in localStorage. This is a SINGLE global
  // slot (one mine can have a live mission at a time in this prototype), so it
  // must never be exposed to consumers as-is — see `activeMission` below,
  // which scopes it down to the currently selected mine. Reading/using
  // `rawActiveMission` directly anywhere outside this file would reintroduce
  // mission state leaking across mines/accounts.
  const [rawActiveMission, setRawActiveMission] = useState<ActiveMission | null>(() => {
    const stored = readJSON<ActiveMission>(getStore('local'), KEY_MISSION);
    if (!stored || !stored.mineId) return null;
    return {
      ...stored,
      status: stored.status ?? 'DECLARED',
      rescueProgress: Number.isFinite(stored.rescueProgress) ? stored.rescueProgress : 0,
    };
  });

  const allMines = useMemo(() => [...MINES, ...customMines], [customMines]);
  const mines = useMemo(() => (user ? allMines.filter((m) => user.assignedMineIds.includes(m.id)) : []), [user, allMines]);
  const selectedMine = mines.find((m) => m.id === selectedMineId) ?? mines[0] ?? null;

  const selectMine = useCallback((mineId: string) => {
    if (!mines.some((m) => m.id === mineId)) return;
    setSelectedMineId(mineId);
    writeJSON(getStore('local'), KEY_MINE, mineId);
  }, [mines]);

  /* ---------------- login / logout ---------------- */
  const login = useCallback((loginId: string, password: string, remember: boolean): LoginResult => {
    const account = allAccounts(accounts).find((a) => norm(a.loginId) === norm(loginId) && a.password === password);
    if (!account) return { ok: false, error: 'AUTHENTICATION FAILED · CHECK ID AND PASSWORD' };
    removeKey(getStore('local'), KEY_SESSION);
    removeKey(getStore('session'), KEY_SESSION);
    // "Remember device" keeps the session across browser restarts; otherwise it lasts for this tab only.
    writeJSON(getStore(remember ? 'local' : 'session'), KEY_SESSION, { userId: account.user.id });
    setUser(account.user);
    return { ok: true, user: account.user };
  }, [accounts]);

  const logout = useCallback(() => {
    removeKey(getStore('local'), KEY_SESSION);
    removeKey(getStore('session'), KEY_SESSION);
    setUser(null);
  }, []);

  /* ---------------- account creation ---------------- */
  const isLoginIdTaken = useCallback(
    (loginId: string) => allAccounts(accounts).some((a) => norm(a.loginId) === norm(loginId)),
    [accounts],
  );

  const createAccount = useCallback((input: AccessRequestInput): CreateAccountResult => {
    const loginId = input.employeeId.trim();
    if (isLoginIdTaken(loginId)) return { ok: false, error: 'An account already exists for this Employee / Service ID' };

    // Reuse the mine if another officer already registered the same mine code.
    let mine = allMines.find((m) => norm(m.officialMineCode) === norm(input.mineCode));
    if (!mine) {
      mine = {
        id: `mine-${slug(input.mineCode)}`,
        name: input.mineName.trim(),
        officialMineCode: input.mineCode.trim(),
        district: input.district.trim(),
        state: input.state.trim(),
        status: 'OPERATIONAL',
      };
      const nextMines = [...customMines, mine];
      setCustomMines(nextMines);
      writeJSON(getStore('local'), KEY_MINES, nextMines);
    }

    const password = generatePassword();
    const account: Account = {
      loginId,
      password,
      user: {
        id: `user-${slug(loginId)}`,
        name: input.fullName.trim(),
        designation: input.designation.trim(),
        role: input.requestedRole,
        organization: input.organization.trim(),
        assignedMineIds: [mine.id],
        employeeId: loginId,
        email: input.email.trim(),
        mobile: input.mobile.trim(),
      },
    };
    const nextAccounts = [account, ...accounts];
    setAccounts(nextAccounts);
    writeJSON(getStore('local'), KEY_ACCOUNTS, nextAccounts);

        // A newly created account must complete its own first-time Site Manager setup,
    // even when the selected mine already has a setup created by another officer.
    if (account.user.role === 'SITE_MANAGER') {
      setAccountSetupCompleted((current) => {
        const next = { ...current, [account.user.id]: false };
        writeJSON(getStore('local'), KEY_ACCOUNT_SETUP, next);
        return next;
      });
    }

    const credentials: CreatedCredentials = { loginId, password, name: account.user.name, role: account.user.role, mineName: mine.name };
    setCreatedCredentials(credentials);
    writeJSON(getStore('session'), KEY_CREATED, credentials);
    return { ok: true, credentials };
  }, [accounts, allMines, customMines, isLoginIdTaken]);

  const clearCreatedCredentials = useCallback(() => {
    setCreatedCredentials(null);
    removeKey(getStore('session'), KEY_CREATED);
  }, []);

  /* ---------------- Site Manager setup ---------------- */
  const saveMineSetup = useCallback((setup: MineSetup) => {
    setMineSetups((current) => {
      const next = { ...current, [setup.mineId]: setup };
      writeJSON(getStore('local'), KEY_SETUPS, next);
      return next;
    });
  }, []);

  const markSiteManagerSetupCompleted = useCallback(() => {
    if (!user || user.role !== 'SITE_MANAGER') return;
  
    setAccountSetupCompleted((current) => {
      const next = { ...current, [user.id]: true };
      writeJSON(getStore('local'), KEY_ACCOUNT_SETUP, next);
      return next;
    });
  }, [user]);

  /* ---------------- Dispatcher deployments ---------------- */
  const saveDeployment = useCallback((input: DeploymentInput) => {
    if (!selectedMine || !user) return null;
    const existing = deployments.find((d) => d.mineId === selectedMine.id && d.date === input.date && d.shift === input.shift);
    const deployment: Deployment = {
      ...input,
      id: existing?.id ?? `DEP-${Date.now().toString(36).toUpperCase()}`,
      mineId: selectedMine.id,
      savedAt: new Date().toISOString(),
      savedBy: user.name,
    };
    const next = [deployment, ...deployments.filter((d) => d.id !== deployment.id)];
    setDeployments(next);
    writeJSON(getStore('local'), KEY_DEPLOYMENTS, next);
    return { updated: !!existing, deployment };
  }, [deployments, selectedMine, user]);

  /* ---------------- Rescue mission flag ---------------- */
  const declareMission = useCallback((input: Omit<ActiveMission, 'id' | 'mineId' | 'declaredAt' | 'status' | 'rescueProgress'>) => {
    if (!selectedMine) return null;
    const mission: ActiveMission = {
      ...input,
      id: `MSN-${Date.now().toString(36).toUpperCase()}`,
      mineId: selectedMine.id,
      declaredAt: new Date().toISOString(),
      status: 'DECLARED',
      rescueProgress: 0,
    };
    setRawActiveMission(mission);
    writeJSON(getStore('local'), KEY_MISSION, mission);
    return mission;
  }, [selectedMine]);

  const updateMissionStatus = useCallback((status: ActiveMission['status']) => {
    setRawActiveMission((current) => {
      if (!current) return current;
      const next = { ...current, status };
      writeJSON(getStore('local'), KEY_MISSION, next);
      return next;
    });
  }, []);

  const updateMissionProgress = useCallback((progress: number) => {
    setRawActiveMission((current) => {
      if (!current) return current;
      const next = {
        ...current,
        rescueProgress: Math.max(0, Math.min(100, progress)),
      };
      writeJSON(getStore('local'), KEY_MISSION, next);
      return next;
    });
  }, []);

  /**
   * Ends the mission for good: the mine returns to "no active mission" /
   * pre-disaster state, and the Rescue Operator returns to
   * "no active rescue operation". This clears the actual persisted state
   * rather than merely hiding a screen behind an extra UI condition.
   */
  const endMission = useCallback(() => {
    setRawActiveMission(null);
    removeKey(getStore('local'), KEY_MISSION);
  }, []);

  useEffect(() => {
    const dev = {
      declareMission: (mineId: string) => {
        if (!mineId) return;
        const mission: ActiveMission = {
          id: `MSN-${Date.now().toString(36).toUpperCase()}`,
          mineId,
          declaredAt: new Date().toISOString(),
          incidentType: 'OTHER',
          affectedArea: 'Undesignated area',
          workersTrapped: 0,
          timeDetected: new Date().toISOString(),
          status: 'DECLARED',
          rescueProgress: 0,
        };
        setRawActiveMission(mission);
        writeJSON(getStore('local'), KEY_MISSION, mission);
      },
      endMission: () => { setRawActiveMission(null); removeKey(getStore('local'), KEY_MISSION); },
    };
    (window as unknown as { moleDev?: typeof dev }).moleDev = dev;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY_MISSION) return;
      const stored = readJSON<ActiveMission>(getStore('local'), KEY_MISSION);
      setRawActiveMission(
        stored && stored.mineId
          ? {
              ...stored,
              status: stored.status ?? 'DECLARED',
              rescueProgress: Number.isFinite(stored.rescueProgress) ? stored.rescueProgress : 0,
            }
          : null,
      );
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); delete (window as unknown as { moleDev?: unknown }).moleDev; };
  }, []);

  const isCreatedAccount = !!user && accounts.some((account) => account.user.id === user.id);

  const siteManagerSetupCompleted =
    user?.role === 'SITE_MANAGER'
      ? (
          accountSetupCompleted[user.id] ??
          // Existing seeded/demo accounts can continue using an already-configured
          // mine. Newly created accounts never get this fallback.
          (!isCreatedAccount && !!selectedMine && !!mineSetups[selectedMine.id])
        )
      : true;

  /*
   * MINE ISOLATION (critical): `rawActiveMission` is a single persisted slot
   * that could, in principle, belong to any mine — a mission declared for
   * Mine A must never be visible while Mine B or Mine C is selected. Every
   * consumer of mission state must see the mine-scoped view below, never
   * `rawActiveMission` directly, and an ended mission is never "active" for
   * anyone. This is the single source of truth for that isolation rule.
   */
  const activeMission = useMemo(() => {
    if (!rawActiveMission) return null;
    if (rawActiveMission.status === 'ENDED') return null;
    if (!selectedMine) return null;
    if (rawActiveMission.mineId !== selectedMine.id) return null;
    return rawActiveMission;
  }, [rawActiveMission, selectedMine]);

  const rescueActive = !!activeMission;

  const value: SessionValue = {
    user, mines, selectedMine, selectMine,
    login, logout,
    isLoginIdTaken, createAccount, createdCredentials, clearCreatedCredentials,
    mineSetups, saveMineSetup,
    siteManagerSetupCompleted, markSiteManagerSetupCompleted,
    deployments, saveDeployment,
    activeMission, declareMission, updateMissionStatus, updateMissionProgress, endMission, rescueActive,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
