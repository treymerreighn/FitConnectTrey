import type { Request, Response, NextFunction } from 'express';

// Request timing middleware
export function requestTimer(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Add timing header in development before response starts
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Response-Time-Start', start.toString());
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}

// Request size limiter
export function requestSizeLimiter(req: Request, res: Response, next: NextFunction) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (req.headers['content-length']) {
    const size = parseInt(req.headers['content-length']);
    if (size > maxSize) {
      return res.status(413).json({ error: 'Request too large' });
    }
  }
  
  next();
}

// API rate limiting (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function simpleRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    clientData.count++;
    next();
  };
}

// Health check endpoint
export function healthCheck(req: Request, res: Response) {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  };
  
  res.json(health);
}