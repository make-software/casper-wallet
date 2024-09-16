export class PasswordDoesNotExistError extends Error {
  constructor() {
    super("Password doesn't exist");
  }
}
