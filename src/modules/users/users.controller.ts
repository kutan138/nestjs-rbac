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
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo user mới (chỉ ADMIN)' })
  @ApiCreatedResponse({ type: User, description: 'User đã được tạo' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // GET /users
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả users (chỉ ADMIN)' })
  @ApiOkResponse({ type: [User], description: 'Danh sách users' })
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy user theo ID (chỉ ADMIN)' })
  @ApiOkResponse({ type: User, description: 'Thông tin user' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // PATCH /users/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật user (chỉ ADMIN)' })
  @ApiOkResponse({ type: User, description: 'User sau khi cập nhật' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xoá user (chỉ ADMIN)' })
  @ApiNoContentResponse({ description: 'Xoá thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
