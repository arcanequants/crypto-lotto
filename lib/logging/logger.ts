type LogLevel = 'info' | 'warn' | 'error' | 'security' | 'performance';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
  path?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Development: Pretty print
    if (this.isDevelopment) {
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        security: '🔒',
        performance: '⚡',
      }[level];

      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, context || '');
    } else {
      // Production: JSON structured logs
      console.log(JSON.stringify(entry));
    }

    // Send critical logs to monitoring service
    if (level === 'error' || level === 'security') {
      this.sendToMonitoring(entry);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  security(message: string, context?: Record<string, any>) {
    this.log('security', message, context);
    // TODO: Trigger alert for security team via webhook/email
  }

  performance(message: string, context?: Record<string, any>) {
    this.log('performance', message, context);
  }

  // Measure execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;

      if (duration > 1000) {
        this.warn(`Slow operation: ${name}`, { duration, ...context });
      } else {
        this.performance(`${name} completed`, { duration, ...context });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${name} failed`, {
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context,
      });
      throw error;
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // TODO: Integrate with monitoring service
    // Examples:
    // - Sentry: Sentry.captureException()
    // - DataDog: dogstatsd.increment()
    // - Custom webhook to Discord/Slack

    if (entry.level === 'security') {
      // TODO: Send urgent alert
      console.error('🚨 SECURITY ALERT:', entry);
    }
  }
}

export const logger = new Logger();
