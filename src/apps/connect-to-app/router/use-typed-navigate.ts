import { To, useNavigate } from 'react-router-dom';

export function useTypedNavigate() {
  const navigate = useNavigate();

  return navigate as {
    (
      to: To,
      options?: {
        replace?: boolean;
      }
    ): void;
    (delta: number): void;
  };
}
