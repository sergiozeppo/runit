import * as vm from 'node:vm';
import { Console } from 'node:console';
import { Transform } from 'node:stream';
import { createContext } from '../console/console.config';
import IRunner from './IRunner';

export default class JavaScriptRunner implements IRunner {
  // eslint-disable-next-line class-methods-use-this
  run(code: string) {
    const alertLogs = [];
    const stdout = new Transform({
      transform(chunk, enc, cb) {
        cb(null, chunk);
      },
    });

    const logger = new Console({ stdout });

    const context = createContext(logger, alertLogs);

    vm.createContext(context);

    try {
      const script = new vm.Script(code);
      script.runInContext(context, { timeout: 5000 });

      const terminal = (stdout.read() || '').toString().split('\n');

      return Promise.resolve({ terminal, alertLogs });
    } catch (err) {
      if (err.message === 'Script execution timed out after 5000ms') {
        const errorMsg = 'Script execution timed out';
        return Promise.resolve({ terminal: [errorMsg], alertLogs });
      }
      const lineOfError = err.stack
        .split('evalmachine.<anonymous>:')[1]
        .substring(0, 1);
      const errorMsg = `${err.message} at line ${lineOfError}`;
      return Promise.resolve({ terminal: [errorMsg], alertLogs });
    }
  }
}
