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
import { useSession } from './state/SessionContext';
import type { Role, RoutePath } from './types';

const PUBLIC_ROUTES: RoutePath[] = ['/', '/login', '/request-access', '/access-created'];

const ROLE_ROUTES: Record<Role, RoutePath[]> = {
  SITE_MANAGER: ['/site-manager', '/site-manager/setup'],
  DISPATCHER: ['/dispatcher'],
  RESCUE_OPERATOR: ['/rescue'],
};

/**
 * Decide where the visitor is actually allowed to be.
 *  - logged out: public pages only
 *  - logged in : only the screens of their own role
 *  - Site Manager: setup first, then the Mine Operations dashboard
 */
function resolveRoute(route: RoutePath, role: Role | null, hasCreated: boolean, setupDone: boolean): RoutePath {
  if (!role) {
    if (!PUBLIC_ROUTES.includes(route)) return '/login';
    if (route === '/access-created' && !hasCreated) return '/request-access';
    return route;
  }
  const allowed = ROLE_ROUTES[role];
  if (!allowed.includes(route)) return role === 'SITE_MANAGER' && !setupDone ? '/site-manager/setup' : allowed[0];
  if (route === '/site-manager' && !setupDone) return '/site-manager/setup';
  return route;
}

/**
 * Root of the application:
 *   Landing → Login / Request access → role-specific workflow
 * The existing Active Rescue dashboard (App) is shown, unchanged, to Rescue Operators while a rescue operation is active.
 */
export default function AppShell() {
  const route = useRoute();
  const { user, createdCredentials, selectedMine, mineSetups, rescueActive } = useSession();
  const setupDone = !!(selectedMine && mineSetups[selectedMine.id]);
  const target = resolveRoute(route, user?.role ?? null, !!createdCredentials, setupDone);

  useEffect(() => { if (target !== route) redirect(target); }, [target, route]);

  switch (target) {
    case '/login': return <Login />;
    case '/request-access': return <RequestAccess />;
    case '/access-created': return <AccessCreated />;
    case '/site-manager/setup': return <SiteManagerSetup />;
    case '/site-manager': return <SiteManagerDashboard />;
    case '/dispatcher': return <DispatcherDeployment />;
    case '/rescue': return rescueActive ? <App sessionSlot={<SessionControls />} /> : <NoActiveRescue />;
    default: return <Landing />;
  }
}
