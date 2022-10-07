import { Dispatch, SetStateAction } from 'react';

const onboardingSessionLoginStatusFieldName = 'onboarding-session-login-status';

export function getSessionLoginStatus(): boolean {
  const onboardingSessionLoginStatusString = sessionStorage.getItem(
    onboardingSessionLoginStatusFieldName
  );

  if (onboardingSessionLoginStatusString == null) {
    return false;
  }

  try {
    const onboardingSessionLoginStatus = JSON.parse(
      onboardingSessionLoginStatusString
    );
    return onboardingSessionLoginStatus;
  } catch (e) {
    throw e;
  }
}

interface SetSessionLoginStatusProps {
  loginStatus: boolean;
  setIsLoggedIn?: Dispatch<SetStateAction<boolean>>;
}

export function setSessionLoginStatus({
  loginStatus,
  setIsLoggedIn
}: SetSessionLoginStatusProps): void {
  const onboardingSessionLoginStatusString = JSON.stringify(loginStatus);

  sessionStorage.setItem(
    onboardingSessionLoginStatusFieldName,
    onboardingSessionLoginStatusString
  );

  if (setIsLoggedIn != null) {
    setIsLoggedIn(loginStatus);
  }
}
