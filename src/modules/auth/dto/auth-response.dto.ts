import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

class UserProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token, hết hạn sau 15 phút' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token, hết hạn sau 7 ngày' })
  refreshToken!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
