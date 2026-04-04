import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../../modules/users/entities/user.entity';

dotenv.config();

async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('📦  Database connected');

  const userRepo = AppDataSource.getRepository(User);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';

  const existing = await userRepo.findOne({ where: { email: adminEmail } });

  if (existing) {
    console.log(`⚠️  Admin "${adminEmail}" already exists — skipping seed`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = userRepo.create({
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepo.save(admin);
    console.log(`✅  Admin user created: ${adminEmail}`);
  }

  await AppDataSource.destroy();
  console.log('🔌  Connection closed');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
