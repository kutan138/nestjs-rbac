import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  // ── CREATE ────────────────────────────────────────────────────────────────

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postsRepository.create({
      ...createPostDto,
      slug: createPostDto.slug ?? null,
      authorId,
    });
    return this.postsRepository.save(post);
  }

  // ── READ ──────────────────────────────────────────────────────────────────

  async findAll(query: QueryPostDto): Promise<Post[]> {
    const where: FindManyOptions<Post>['where'] = {};

    if (query.status) where.status = query.status;
    if (query.authorId) where.authorId = query.authorId;

    return this.postsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException(`Post "${id}" không tồn tại`);
    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { slug },
      relations: ['author'],
    });
    if (!post)
      throw new NotFoundException(`Post với slug "${slug}" không tồn tại`);
    return post;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<Post> {
    const post = await this.findOne(id);
    this.assertCanModify(post, requesterId, requesterRole);

    Object.assign(post, updatePostDto);
    return this.postsRepository.save(post);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  async remove(
    id: string,
    requesterId: string,
    requesterRole: UserRole,
  ): Promise<void> {
    const post = await this.findOne(id);
    this.assertCanModify(post, requesterId, requesterRole);
    await this.postsRepository.remove(post);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Chỉ tác giả hoặc admin mới được sửa / xoá bài.
   */
  private assertCanModify(
    post: Post,
    requesterId: string,
    requesterRole: UserRole,
  ): void {
    const isOwner = post.authorId === requesterId;
    const isAdmin = requesterRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }
  }
}
