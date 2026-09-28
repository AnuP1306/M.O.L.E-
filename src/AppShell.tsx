import { useEffect } from 'react';
import App from './App';
import { SessionControls } from './components/SessionControls';
import { redirect, useRoute } from './router';
import { AccessCreated } from './screens/AccessCreated';
import { DispatcherDeployment } from './screens/DispatcherDeployment';
import { Landing } from './screens/Landing';
import { Login } from './screens/Login';
import { NoActiveRescue } from './screens/NoActiveRescue';
import { RequestAccess } from './screens/RequestAccess';
import { SiteManagerDashboard } from './screens/SiteManagerDashboard';
import { SiteManagerSetup } from './screens/SiteManagerSetup';
import { SlamPreparation } from './screens/SlamPreparation';
import { useSession } from './state/SessionContext';
import type { Role, RoutePath } from './types';

const PUBLIC_ROUTES: RoutePath[] = ['/', '/login', '/request-access', '/access-created'];

const ROLE_ROUTES: Record<Role, RoutePath[]> = {
  SITE_MANAGER: ['/site-manager', '/site-manager/setup', '/site-manager/slam', '/site-manager/operations'],
  DISPATCHER: ['/dispatcher'],
  RESCUE_OPERATOR: ['/rescue'],
};

/**
 * Decide where the visitor is actually allowed to be.
 *  - logged out: public pages only
 *  - logged in : only the screens of their own role
 *  - Site Manager: setup first, then the Mine Operations dashboard.
 *    Once the mine already has a completed map (uploaded or SLAM-mapped),
 *    landing/entry routes go straight to the pre-disaster dashboard instead
 *    of the Mine Operations summary — the Site Manager is never forced back
 *    through Mine Setup or SLAM initialization for a mine that's already mapped.
 */
function resolveRoute(
  route: RoutePath,
  role: Role | null,
  hasCreated: boolean,
  setupDone: boolean,
  mapComplete: boolean
): RoutePath {
  if (!role) {
    if (!PUBLIC_ROUTES.includes(route)) return '/login';
    if (route === '/access-created' && !hasCreated) return '/request-access';
    return route;
  }

  const allowed = ROLE_ROUTES[role];

  if (!allowed.includes(route)) {
    if (role === 'SITE_MANAGER') {
      if (!setupDone) return '/site-manager/setup';

      return mapComplete
        ? '/site-manager/operations'
        : '/site-manager';
    }

    return allowed[0];
  }

  /*
   * SITE MANAGER FLOW
   *
   * Setup completion and mine-map completion are two different states.
   *
   * A Site Manager who has completed account/mine setup but whose
   * mine has NOT been mapped must remain on the normal Site Manager
   * summary page.
   *
   * Do not allow an old browser route such as:
   *   /site-manager/operations
   *
   * to bypass the mapping step.
   */
  if (role === 'SITE_MANAGER') {
    if (!setupDone) {
      return '/site-manager/setup';
    }

    if (!mapComplete) {
      if (
        route === '/site-manager/operations'
      ) {
        return '/site-manager';
      }
    }
  }

  return route;
}

/**
 * Root of the application:
 *   Landing → Login / Request access → role-specific workflow
 * The existing Active Rescue dashboard (App) is shown, unchanged, to Rescue Operators while a rescue operation is active.
 */
export default function AppShell() {
  const route = useRoute();
  const { user, createdCredentials, selectedMine, mineSetups, deployments, rescueActive, siteManagerSetupCompleted, } = useSession();
  const setup = selectedMine ? mineSetups[selectedMine.id] : undefined;
  const setupDone =
  user?.role === 'SITE_MANAGER'
    ? siteManagerSetupCompleted
    : !!setup;
  const mapComplete =
  setup?.mapStatus === 'COMPLETE' ||
  (!!setup?.completedAt && !!setup?.mapMethod);
  const today = new Date().toLocaleDateString('en-CA');
  const todayDeployment = selectedMine ? deployments.find((d) => d.mineId === selectedMine.id && d.date === today) : undefined;
  const target = resolveRoute(route, user?.role ?? null, !!createdCredentials, setupDone, mapComplete);

  useEffect(() => { if (target !== route) redirect(target); }, [target, route]);

  switch (target) {
    case '/login': return <Login />;
    case '/request-access': return <RequestAccess />;
    case '/access-created': return <AccessCreated />;
    case '/site-manager/setup': return <SiteManagerSetup />;
    case '/site-manager/slam': return <SlamPreparation />;
    // `key={selectedMine?.id}` forces a full remount of the dashboard whenever
    // the selected mine changes. App's internal mapping/mission UI state is
    // only ever initialized correctly for the mine it was first mounted for;
    // without this key, switching mines via the Mine Selector while staying on
    // the same route would carry the previous mine's local state across —
    // exactly the kind of state leak this fix is meant to prevent.
    case '/site-manager/operations': return <App key={selectedMine?.id} preDisaster workerAllocations={todayDeployment?.allocations ?? []} mineName={selectedMine?.name ?? 'Jharia Central'} maxDepth={setup?.maxDepth ?? 227} mapSource={setup?.mapMethod ?? 'SLAM'} mapAlreadyComplete={mapComplete} lastMappedAt={setup?.lastMappedAt} previousMappedAt={setup?.previousMappedAt} sessionSlot={<SessionControls />} />;
    case '/site-manager': return <SiteManagerDashboard />;
    case '/dispatcher': return <DispatcherDeployment />;
    case '/rescue': return rescueActive ? <App key={selectedMine?.id} workerAllocations={todayDeployment?.allocations ?? []} mineName={selectedMine?.name ?? 'Jharia Central'} maxDepth={setup?.maxDepth ?? 227} mapSource={setup?.mapMethod ?? 'SLAM'} sessionSlot={<SessionControls />} /> : <NoActiveRescue />;
    default: return <Landing />;
  }
}
