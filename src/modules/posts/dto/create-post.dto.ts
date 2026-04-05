import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ example: 'Tiêu đề bài viết hay', description: 'Tiêu đề' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'Nội dung chi tiết bài viết...',
    description: 'Nội dung',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({
    example: 'tieu-de-bai-viet-hay',
    description: 'Slug SEO (chỉ chứa a-z, 0-9 và dấu gạch ngang)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug chỉ được chứa chữ thường, số và dấu gạch ngang (-)',
  })
  slug?: string;

  @ApiPropertyOptional({
    enum: PostStatus,
    default: PostStatus.DRAFT,
    description: 'Trạng thái bài viết',
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
