import { useCallback, useEffect, useRef } from 'react';
import {
  useNavigate as useNavigateBase,
  NavigateOptions,
  To
} from 'react-router-dom';

export function useNavigate() {
  const navigate = useNavigateBase();
  const navigateRef = useRef({ navigate });

  useEffect(() => {
    navigateRef.current.navigate = navigate;
  }, [navigate]);

  return useCallback((to: To, option?: NavigateOptions, delta?: number) => {
    if (delta) {
      navigateRef.current.navigate(delta);
    } else {
      navigateRef.current.navigate(to, option);
    }
  }, []);
}
