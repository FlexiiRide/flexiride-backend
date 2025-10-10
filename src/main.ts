import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureCloudinary } from './configs/cloudinary.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigService to load from .env
  const configService = app.get(ConfigService);

  configureCloudinary(configService);

  // Enable CORS with multiple origins
  const corsOrigin = configService.get<string>('CORS_ORIGIN');

  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((origin) => origin.trim()) : '*',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
        exposeDefaultValues: true,
      },
      whitelist: false, // CHANGED: Disabled to allow nested properties from JSON.parse
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('flexiride-backend')
    .setDescription('API documentation for flexiride-backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 flexiride-backend running on http://localhost:${port}`);
  console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap();
