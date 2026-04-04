import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('RBCA API')
    .setDescription('Role-Based Access Control API')
    .setVersion('1.0')
    .addTag('users', 'CRUD operations for users')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `🚀 App running at: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📖 Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
void bootstrap();
