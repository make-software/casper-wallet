import { useTypedLocation } from './use-typed-location';
import { useTypedNavigate } from './use-typed-navigate';

export function useNavigationMenu() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const toggleNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        showNavigationMenu: !location.state?.showNavigationMenu
      }
    });
  };

  const openNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, showNavigationMenu: true }
    });
  };
  const closeNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, showNavigationMenu: false }
    });
  };

  return {
    toggleNavigationMenu,
    openNavigationMenu,
    closeNavigationMenu
  };
}
