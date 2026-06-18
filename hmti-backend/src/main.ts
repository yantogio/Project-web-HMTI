import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // === RATE LIMITING ===
  // Try to enable rate limiting if express-rate-limit is installed
  try {
    const rateLimit = require('express-rate-limit');
    
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 menit
      max: 100, // 100 requests
      message: 'Terlalu banyak request dari IP ini, coba lagi nanti',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        return req.path === '/health';
      }
    });
    
    app.use(limiter);
    console.log('[OK] Rate limiting enabled');
  } catch (error) {
    console.warn('[WARN] Rate limiting disabled (install express-rate-limit: npm install express-rate-limit)');
  }
  
  // === MEMORY MONITORING ===
  // Log memory usage setiap 30 detik
  setInterval(() => {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const externalMB = Math.round(used.external / 1024 / 1024);
    
    console.log(`[Memory] Heap: ${heapUsedMB}MB / ${heapTotalMB}MB | External: ${externalMB}MB`);
    
    // Warning jika heap usage > 500MB
    if (heapUsedMB > 500) {
      console.warn(`[WARN] Heap memory tinggi! ${heapUsedMB}MB`);
    }
    
    // Critical jika > 800MB
    if (heapUsedMB > 800) {
      console.error(`[ERROR] Heap memory kritis! ${heapUsedMB}MB. Force garbage collection...`);
      if (global.gc) {
        global.gc();
      }
    }
  }, 30000);
  
  // === GRACEFUL SHUTDOWN ===
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`[OK] Server running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
