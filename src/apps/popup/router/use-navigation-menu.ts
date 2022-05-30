import { useTypedLocation } from '@hooks/use-typed-location';
import { useTypedNavigate } from '@hooks/use-typed-navigate';
import { LocationState } from '@popup/router/types';

export function useNavigationMenu() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();

  const toggleNavigationMenu = () => {
    navigate(location.pathname, {
      replace: true,
      state: {
        showNavigationMenu: !(location.state as LocationState)
          ?.showNavigationMenu
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
