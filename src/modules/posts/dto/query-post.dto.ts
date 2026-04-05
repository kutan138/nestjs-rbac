import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class QueryPostDto {
  @ApiPropertyOptional({
    enum: PostStatus,
    description: 'Lọc theo trạng thái',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ description: 'Lọc theo authorId' })
  @IsOptional()
  @IsUUID()
  authorId?: string;
}
