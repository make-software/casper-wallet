export function exitWithError(errorMessage: string): void {
  console.error(errorMessage);
  process.exitCode = 1;
}
