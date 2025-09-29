import winston from 'winston';

// 로거 설정
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'nutrient-worker' },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 파일 출력 (개발 환경에서만)
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      })
    ] : [])
  ]
});

// 개발 환경에서는 더 자세한 로그
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}

export default logger;
