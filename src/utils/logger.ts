/**
 * Logger utility for Jellyfin Profanity Filter plugin
 * Provides structured logging with levels and timestamps
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private readonly prefix: string;

  private constructor(prefix: string) {
    this.prefix = prefix;
  }

  public static getInstance(prefix: string = 'ProfanityFilter'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(prefix);
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levelOrder: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levelOrder.indexOf(level) >= levelOrder.indexOf(this.logLevel);
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  public error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log(LogLevel.ERROR, message, context);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context
    };

    // Format and output log entry
    const formattedMessage = `[${this.prefix}] [${level}] ${message}`;
    console.log(formattedMessage);
  }
}

export const logger = Logger.getInstance('ProfanityFilter');
