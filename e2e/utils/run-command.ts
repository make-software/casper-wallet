import { spawn } from 'cross-spawn';

export async function runCommand(
  command: string,
  args: string[]
): Promise<string[]> {
  const output: string[] = [];
  let mostRecentError;
  let errorSignal;
  let errorCode;
  const internalError = new Error('Internal');
  try {
    await new Promise<void>((resolve, reject) => {
      const childProcess = spawn(command, args);

      childProcess.stdout.setEncoding('utf8');
      childProcess.stderr.setEncoding('utf8');

      childProcess.on('error', (error: Error) => {
        mostRecentError = error;
      });

      childProcess.stdout.on('data', (message: string) => {
        const nonEmptyLines = message.split('\n').filter(line => line !== '');
        output.push(...nonEmptyLines);
      });

      childProcess.stderr.on('data', (message: string) => {
        mostRecentError = new Error(message.trim());
      });

      childProcess.once('exit', (code: number, signal: string) => {
        if (code === 0) {
          return resolve();
        }
        errorCode = code;
        errorSignal = signal;
        return reject(internalError);
      });
    });
  } catch (error) {
    if (error === internalError) {
      const errorMessage = composeError(errorCode, errorSignal);
      const improvedError = new Error(errorMessage);

      if (mostRecentError) {
        improvedError.cause = mostRecentError;
      }

      throw improvedError;
    }
  }
  return output;
}

export async function runInShell(
  command: string,
  args: string[]
): Promise<void> {
  let errorSignal;
  let errorCode;
  const internalError = new Error('Internal');
  try {
    await new Promise<void>((resolve, reject) => {
      const childProcess = spawn(command, args, {
        stdio: 'inherit'
      });

      childProcess.once('exit', (code: number, signal: string) => {
        if (code === 0) {
          return resolve();
        }
        errorCode = code;
        errorSignal = signal;
        return reject(internalError);
      });
    });
  } catch (error) {
    if (error === internalError) {
      throw new Error(composeError(errorCode, errorSignal));
    }
  }
}

function composeError(
  errorCode: number | undefined,
  errorSignal: string | undefined
): string {
  if (errorCode && errorSignal) {
    return `Terminated by signal '${errorSignal}'; exited with code '${errorCode}'`;
  } else if (errorSignal) {
    return `Terminated by signal '${errorSignal}'`;
  } else if (!errorCode) {
    return 'Exited with no code or signal';
  } else {
    return `Exited with code '${errorCode}'`;
  }
}
