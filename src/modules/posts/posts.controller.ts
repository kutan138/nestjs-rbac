import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/strategies/jwt.strategy';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { PostsService } from './posts.service';

@ApiTags('posts')
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ── POST /posts ───────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo bài viết mới (cần đăng nhập)' })
  @ApiCreatedResponse({ type: PostEntity, description: 'Bài viết đã được tạo' })
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.postsService.create(createPostDto, user.id);
  }

  // ── GET /posts ────────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết (công khai)' })
  @ApiOkResponse({ type: [PostEntity], description: 'Danh sách bài viết' })
  findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  // ── GET /posts/:id ────────────────────────────────────────────────────────

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy bài viết theo ID (công khai)' })
  @ApiOkResponse({ type: PostEntity, description: 'Chi tiết bài viết' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy bài viết' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  // ── PATCH /posts/:id ──────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết (chủ sở hữu hoặc admin)' })
  @ApiOkResponse({ type: PostEntity, description: 'Bài viết sau khi cập nhật' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy bài viết' })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.postsService.update(id, updatePostDto, user.id, user.role);
  }

  // ── DELETE /posts/:id ─────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá bài viết (chủ sở hữu hoặc admin)' })
  @ApiNoContentResponse({ description: 'Xoá thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy bài viết' })
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.postsService.remove(id, user.id, user.role);
  }
}
