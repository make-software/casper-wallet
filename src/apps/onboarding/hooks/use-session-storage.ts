import { useState } from 'react';

const IS_LOGGED_IN_KEY = 'onboarding-session-login-status';

function saveToSessionStorage(key: string, value: boolean): void {
  const stringifiedValue = JSON.stringify(value);
  sessionStorage.setItem(key, stringifiedValue);
}

function loadFromSessionStorage(key: string): boolean | null {
  const stringifiedValue = sessionStorage.getItem(key);

  if (stringifiedValue != null) {
    try {
      return JSON.parse(stringifiedValue);
    } catch (e) {
      throw e;
    }
  }

  return null;
}

export function useSessionStorage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  return {
    loadIsLoggedIn: () => {
      const isLoggedInFromSessionStorage =
        loadFromSessionStorage(IS_LOGGED_IN_KEY);

      if (
        isLoggedInFromSessionStorage != null &&
        isLoggedInFromSessionStorage !== isLoggedIn
      ) {
        setIsLoggedIn(isLoggedInFromSessionStorage);
      }

      return isLoggedIn;
    },
    saveIsLoggedIn: (isLoggedInNextValue: boolean): void => {
      if (isLoggedIn !== isLoggedInNextValue) {
        setIsLoggedIn(isLoggedInNextValue);
      }
      saveToSessionStorage(IS_LOGGED_IN_KEY, isLoggedInNextValue);
    }
  };
}
