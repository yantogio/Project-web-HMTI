import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

function getAllowedCorsOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[WARN] CORS_ORIGINS is not configured; browser CORS requests will be rejected');
    return [];
  }

  return [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedCorsOrigins = getAllowedCorsOrigins();

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedCorsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
  });

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
