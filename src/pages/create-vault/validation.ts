export const minPasswordLength = 12;

export function formIsValid(
  password: string | null,
  otherPassword: string | null
): boolean {
  return (
    passwordIsValid(password) &&
    passwordIsValid(otherPassword) &&
    password === otherPassword
  );
}

export function passwordIsValid(password: string | null): boolean {
  return !!password && password.trim().length >= minPasswordLength;
}
