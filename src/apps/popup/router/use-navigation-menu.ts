import { useTypedLocation, useTypedNavigate } from '@popup/router';

export function useNavigationMenu() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const toggleNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: {
        showNavigationMenu: !location.state?.showNavigationMenu
      }
    });
  };

  const openNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: { showNavigationMenu: true }
    });
  };
  const closeNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: { showNavigationMenu: false }
    });
  };

  return {
    toggleNavigationMenu,
    openNavigationMenu,
    closeNavigationMenu
  };
}
