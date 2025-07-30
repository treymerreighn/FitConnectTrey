import compression from "compression";
import type { Express, Request, Response, NextFunction } from "express";

// Production optimizations for Express server
export function applyProductionOptimizations(app: Express) {
  if (process.env.NODE_ENV === "production") {
    console.log("🚀 Applying production optimizations...");
    
    // Enable compression middleware
    app.use(compression({
      threshold: 1024,        // Only compress files > 1KB
      level: 6,              // Compression level (1-9)
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));

    // Set security headers
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Cache headers for static assets
      if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      next();
    });

    // Disable x-powered-by header
    app.disable('x-powered-by');
    
    console.log("✅ Production optimizations applied");
  }
}

// Memory monitoring for production
export function setupMemoryMonitoring() {
  if (process.env.NODE_ENV === "production") {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memInfo = {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      };
      
      console.log('Memory Usage:', memInfo);
      
      // Warning if heap usage is high
      if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
        console.warn('⚠️ High memory usage detected:', memInfo);
      }
    }, 30000); // Check every 30 seconds
  }
}

// Graceful shutdown handling
export function setupGracefulShutdown(server: any) {
  const gracefulShutdown = () => {
    console.log('🔄 Graceful shutdown initiated...');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}