/**
 * Logger utility for consistent logging across the application
 */

// Check if we're in development mode using Next.js public environment variables
const isDevelopment = process.env.NEXT_PUBLIC_NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  module?: string;
  enabled?: boolean;
}

class Logger {
  private module: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.module = options.module || "app";
    this.enabled = options.enabled !== undefined ? options.enabled : true;
  }

  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, ...args: any[]): void {
    if (isDevelopment && this.enabled) {
      console.debug(`[${this.module}] ${message}`, ...args);
    }
  }

  /**
   * Info level logging - shown in both development and production
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.info(`[${this.module}] ${message}`, ...args);
    }
  }

  /**
   * Warning level logging - shown in both development and production
   */
  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`[${this.module}] ${message}`, ...args);
    }
  }

  /**
   * Error level logging - always shown
   */
  error(message: string, ...args: any[]): void {
    console.error(`[${this.module}] ${message}`, ...args);
  }
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(
  module: string,
  options: Omit<LoggerOptions, "module"> = {}
): Logger {
  return new Logger({ module, ...options });
}

// Default logger instance
export const logger = new Logger();

// Export the logger class for advanced usage
export default Logger;
