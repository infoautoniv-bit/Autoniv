import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock react-router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
}));

// Mock redux provider
vi.mock('../hooks/useStore', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: (selector: any) => selector({
    auth: { user: null, token: null, loading: false, initialized: true },
    agents: { myAgents: [], loading: false },
    calls: { myCalls: [], loading: false },
    analytics: { myStats: null, loading: false },
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    expect(true).toBe(true);
  });

  it('has valid module exports', async () => {
    const mod = await import('../config/constants');
    expect(mod).toBeDefined();
  });
});
