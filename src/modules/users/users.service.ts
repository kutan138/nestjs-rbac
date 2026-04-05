import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.assertEmailFree(createUserDto.email);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash: await bcrypt.hash(createUserDto.password, SALT_ROUNDS),
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User "${id}" not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.assertEmailFree(updateUserDto.email);
    }

    const { password, ...rest } = updateUserDto;
    Object.assign(user, rest);

    if (password) {
      user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /** Find with passwordHash included (select: false by default) */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async createOAuthUser(profile: {
    email: string;
    name: string;
    googleId?: string;
    appleId?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: profile.email,
      name: profile.name,
      passwordHash: null,
      googleId: profile.googleId ?? null,
      appleId: profile.appleId ?? null,
      role: UserRole.EDITOR,
    });
    return this.usersRepository.save(user);
  }

  async linkOAuthProvider(
    userId: string,
    provider: 'google' | 'apple',
    providerId: string,
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (provider === 'google') user.googleId = providerId;
    else user.appleId = providerId;
    return this.usersRepository.save(user);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async assertEmailFree(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing)
      throw new ConflictException(`Email "${email}" already exists`);
  }
}
