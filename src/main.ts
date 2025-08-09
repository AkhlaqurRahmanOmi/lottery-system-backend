import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config'; // Make sure this exists
import { setupSwagger } from './config/swagger.config';

function patchConsoleToWinston(logger: any) {
  const serializeArgs = (args: any[]) =>
    args.map((arg) =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

  console.log = (...args: any[]) => logger.log('info', serializeArgs(args));
  console.warn = (...args: any[]) => logger.log('warn', serializeArgs(args));
  console.error = (...args: any[]) => logger.log('error', serializeArgs(args));
  console.debug = (...args: any[]) => logger.log('debug', serializeArgs(args));
}

async function bootstrap() {
  const winstonLogger = WinstonModule.createLogger(winstonConfig);

  patchConsoleToWinston(winstonLogger); // Redirect native console.* to Winston

  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger/OpenAPI documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
