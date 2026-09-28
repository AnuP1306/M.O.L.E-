/* Tiny hash router (no extra dependency): #/login, #/rescue ... */
import { useSyncExternalStore } from 'react';
import type { RoutePath } from './types';

const ROUTES: RoutePath[] = ['/', '/login', '/request-access', '/access-created', '/site-manager', '/site-manager/setup', '/site-manager/slam', '/site-manager/operations', '/dispatcher', '/rescue'];

export function currentRoute(): RoutePath {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  return (ROUTES as string[]).includes(hash) ? (hash as RoutePath) : '/';
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useRoute(): RoutePath {
  return useSyncExternalStore(subscribe, currentRoute);
}

export function navigate(path: RoutePath) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

/** Change route without adding a browser-history entry (used for redirects). */
export function redirect(path: RoutePath) {
  window.location.replace(`#${path}`);
}
