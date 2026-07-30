import React, {
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState
} from 'react';

import { HomePageTabName } from '@src/constants';

interface HomeTabContextValue {
  activeHomeTab: HomePageTabName;
  setActiveHomeTab: (tab: HomePageTabName) => void;
}

const HomeTabContext = createContext<HomeTabContextValue | null>(null);

/**
 * Owns the active Home tab for the lifetime of the popup session.
 *
 * Deliberately ephemeral: it is destroyed when the popup closes (and when the
 * vault locks), so reopening always starts on Tokens. The tab must not travel
 * in react-router `location.state` — state is bound to a history entry, so a
 * later `navigate(-1)` would restore whatever tab was intended when that entry
 * was created rather than the tab the user actually left (WALLET-1360).
 */
export const HomeTabProvider = ({ children }: { children: ReactNode }) => {
  const [activeHomeTab, setActiveHomeTab] = useState<HomePageTabName>(
    HomePageTabName.Tokens
  );

  const value = useMemo(
    () => ({ activeHomeTab, setActiveHomeTab }),
    [activeHomeTab]
  );

  return (
    <HomeTabContext.Provider value={value}>{children}</HomeTabContext.Provider>
  );
};

export const useHomeTab = () => {
  const context = useContext(HomeTabContext);

  if (!context) {
    throw new Error('useHomeTab must be used within HomeTabProvider');
  }

  return context;
};
