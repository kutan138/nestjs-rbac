import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
export class Post {
  @ApiProperty({ example: 'a1b2c3d4-...', description: 'UUID tự sinh' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Tiêu đề bài viết' })
  @Column({ length: 255 })
  title!: string;

  @ApiProperty({ example: 'Nội dung bài viết...' })
  @Column({ type: 'text' })
  content!: string;

  @ApiPropertyOptional({ example: 'tieu-de-bai-viet' })
  @Column({ type: 'varchar', length: 300, unique: true, nullable: true })
  slug!: string | null;

  @ApiProperty({ enum: PostStatus, default: PostStatus.DRAFT })
  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.DRAFT })
  status!: PostStatus;

  // ── Relation: Author ─────────────────────────────────────────────────────
  @ApiProperty({ description: 'ID của tác giả' })
  @Column('uuid')
  authorId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @ApiProperty()
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt!: Date;
}
