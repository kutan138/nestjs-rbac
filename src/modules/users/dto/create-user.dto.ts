import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Tên người dùng' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'nguyenvana@example.com',
    description: 'Email (unique)',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secret@123', description: 'Mật khẩu' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.EDITOR,
    description: 'Vai trò: admin | editor | viewer',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
