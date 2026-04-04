import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID tự sinh' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @Column({ length: 100 })
  name!: string;

  @ApiProperty({ example: 'nguyenvana@example.com' })
  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  passwordHash!: string | null;

  @ApiPropertyOptional({ example: 'google-oauth2|1234567890' })
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  googleId!: string | null;

  @ApiPropertyOptional({ example: 'apple-sub-1234567890' })
  @Column({ type: 'varchar', nullable: true, unique: true, length: 255 })
  appleId!: string | null;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive!: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;
}
