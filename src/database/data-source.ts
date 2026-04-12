import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { User } from '../modules/users/entities/user.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'postgres',
  entities: [User, RefreshToken],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
