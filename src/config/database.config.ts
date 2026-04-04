import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { User } from '../modules/users/entities/user.entity';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'rbca',
  entities: [User, RefreshToken],
  // Tắt synchronize – dùng migration để quản lý schema an toàn
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
