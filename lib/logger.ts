import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

let transport: pino.TransportSingleOptions | undefined
if (isDevelopment) {
  try {
    require.resolve('pino-pretty')
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  } catch {
    // pino-pretty not available (e.g. production standalone build)
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  ...(transport && { transport }),
  ...(isProduction && {
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  },
})

// Request context logger factory
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  })
}

// Domain-specific loggers
export const authLogger = logger.child({ module: 'auth' })
export const apiLogger = logger.child({ module: 'api' })
export const dbLogger = logger.child({ module: 'database' })
export const paymentLogger = logger.child({ module: 'payments' })

export default logger
