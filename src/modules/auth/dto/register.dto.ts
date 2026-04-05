import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen Van A', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    minLength: 8,
    description: 'Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  password!: string;

  // Chỉ cho phép tự đăng ký với role EDITOR hoặc VIEWER.
  // ADMIN phải được tạo qua POST /users (admin-only).
  @ApiPropertyOptional({
    enum: [UserRole.EDITOR, UserRole.VIEWER],
    default: UserRole.EDITOR,
    description: 'Chỉ cho phép: editor | viewer (admin cần tạo qua /users)',
  })
  @IsOptional()
  @IsIn([UserRole.EDITOR, UserRole.VIEWER], {
    message: 'role phải là editor hoặc viewer',
  })
  role?: UserRole;
}
