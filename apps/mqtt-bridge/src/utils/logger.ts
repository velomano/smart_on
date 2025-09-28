import { format } from 'util';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private formatLog(level: string, message: string, meta?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    };

    return JSON.stringify(entry);
  }

  info(message: string, meta?: any): void {
    console.log(this.formatLog('INFO', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatLog('DEBUG', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatLog('WARN', message, meta));
  }

  error(message: string, meta?: any): void {
    console.error(this.formatLog('ERROR', message, meta));
  }
}

export const logger = new Logger();
