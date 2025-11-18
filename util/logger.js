const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log levels
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const appLogStream = fs.createWriteStream(path.join(logsDir, 'app.log'), { flags: 'a' });

// Get current timestamp
const timestamp = () => new Date().toISOString();

// Log levels
const LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

// Format log message
const formatLog = (level, message, meta = {}) => {
  return `${timestamp()} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;
};

// Logger functions
const info = (message, meta = {}) => {
  const logMessage = formatLog(LEVELS.INFO, message, meta);
  console.log(logMessage);
  appLogStream.write(logMessage);
};

const warn = (message, meta = {}) => {
  const logMessage = formatLog(LEVELS.WARN, message, meta);
  console.warn(logMessage);
  appLogStream.write(logMessage);
};

const error = (message, meta = {}) => {
  const logMessage = formatLog(LEVELS.ERROR, message, meta);
  console.error(logMessage);
  errorLogStream.write(logMessage);
  appLogStream.write(logMessage);
};

const debug = (message, meta = {}) => {
  const logMessage = formatLog(LEVELS.DEBUG, message, meta);
  console.debug(logMessage);
  appLogStream.write(logMessage);
};

// Middleware for logging HTTP requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  const requestMeta = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };
  
  info(`Incoming request`, requestMeta);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseMeta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      warn(`Request completed with error`, responseMeta);
    } else {
      info(`Request completed successfully`, responseMeta);
    }
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const errorMeta = {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  };
  
  error(`Unhandled error occurred`, errorMeta);
  
  next(err);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  requestLogger,
  errorLogger
};