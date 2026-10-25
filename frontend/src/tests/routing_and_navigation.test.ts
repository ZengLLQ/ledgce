import { describe, expect, it } from 'vitest';
import { pathToRoute, routeToPath } from '../App';
import type { ViewRoute } from '../types/api';

describe('Frontend Routing & Route Mapper Specifications', () => {
  const allRoutes: ViewRoute[] = [
    'landing',
    'platform',
    'architecture',
    'security',
    'docs',
    'login',
    'overview',
    'accounts',
    'transfers',
    'transactions',
    'explorer',
    'reconciliation',
    'outbox',
    'system-health',
    'settings',
  ];

  it('maps all required public routes correctly', () => {
    expect(pathToRoute('/')).toBe('landing');
    expect(pathToRoute('/landing')).toBe('landing');
    expect(pathToRoute('/platform')).toBe('platform');
    expect(pathToRoute('/architecture')).toBe('architecture');
    expect(pathToRoute('/security')).toBe('security');
    expect(pathToRoute('/docs')).toBe('docs');
    expect(pathToRoute('/login')).toBe('login');
  });

  it('maps all required application routes correctly', () => {
    expect(pathToRoute('/app')).toBe('overview');
    expect(pathToRoute('/app/overview')).toBe('overview');
    expect(pathToRoute('/app/accounts')).toBe('accounts');
    expect(pathToRoute('/app/transfers')).toBe('transfers');
    expect(pathToRoute('/app/transactions')).toBe('transactions');
    expect(pathToRoute('/app/ledger')).toBe('explorer');
    expect(pathToRoute('/app/events')).toBe('outbox');
    expect(pathToRoute('/app/reconciliation')).toBe('reconciliation');
    expect(pathToRoute('/app/observability')).toBe('system-health');
    expect(pathToRoute('/app/settings')).toBe('settings');
  });

  it('preserves bidirectional route-path isomorphism', () => {
    for (const route of allRoutes) {
      const path = routeToPath(route);
      expect(path).toMatch(/^\//);
      const mappedBack = pathToRoute(path);
      expect(mappedBack).toBe(route);
    }
  });

  it('gracefully handles trailing slashes and unknown paths', () => {
    expect(pathToRoute('/app/accounts/')).toBe('accounts');
    expect(pathToRoute('/platform/')).toBe('platform');
    expect(pathToRoute('/unknown-random-path')).toBe('landing');
  });
});
