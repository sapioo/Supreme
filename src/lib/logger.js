const LEVEL_VALUE = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  none: 100,
};

const FALLBACK_LEVEL = import.meta.env.DEV ? 'debug' : 'warn';
const ENV_LEVEL = String(import.meta.env.VITE_LOG_LEVEL || FALLBACK_LEVEL).toLowerCase();
const ACTIVE_LEVEL = Object.prototype.hasOwnProperty.call(LEVEL_VALUE, ENV_LEVEL)
  ? ENV_LEVEL
  : FALLBACK_LEVEL;

function canLog(level) {
  return LEVEL_VALUE[level] >= LEVEL_VALUE[ACTIVE_LEVEL];
}

function toErrorMeta(err) {
  if (!err) return null;

  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  if (typeof err === 'object') {
    return err;
  }

  return { message: String(err) };
}

function write(level, scope, message, meta) {
  if (!canLog(level)) return;

  const timestamp = new Date().toISOString();
  const prefix = `[CourtRoom][${scope}][${level.toUpperCase()}][${timestamp}]`;

  if (meta !== undefined) {
    console[level](prefix, message, meta);
  } else {
    console[level](prefix, message);
  }
}

export function createLogger(scope) {
  return {
    debug(message, meta) {
      write('debug', scope, message, meta);
    },
    info(message, meta) {
      write('info', scope, message, meta);
    },
    warn(message, meta) {
      write('warn', scope, message, meta);
    },
    error(message, err, meta) {
      const errorMeta = toErrorMeta(err);
      if (errorMeta && meta !== undefined) {
        write('error', scope, message, { ...meta, error: errorMeta });
        return;
      }
      if (errorMeta) {
        write('error', scope, message, { error: errorMeta });
        return;
      }
      write('error', scope, message, meta);
    },
  };
}

export function installGlobalErrorLogging() {
  if (typeof window === 'undefined') return;
  if (window.__COURTROOM_GLOBAL_LOGS_INSTALLED__) return;

  const logger = createLogger('Global');

  window.addEventListener('error', (event) => {
    logger.error('Unhandled window error', event.error, {
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });

  window.__COURTROOM_GLOBAL_LOGS_INSTALLED__ = true;
  logger.info('Global error listeners installed', { level: ACTIVE_LEVEL });
}
