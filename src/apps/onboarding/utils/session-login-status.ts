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

export function setSessionLoginStatus(
  onboardingSessionLoginStatus: boolean
): void {
  const onboardingSessionLoginStatusString = JSON.stringify(
    onboardingSessionLoginStatus
  );

  sessionStorage.setItem(
    onboardingSessionLoginStatusFieldName,
    onboardingSessionLoginStatusString
  );
}
