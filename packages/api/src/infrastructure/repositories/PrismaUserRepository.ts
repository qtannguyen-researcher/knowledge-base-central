import type { PrismaClient } from '@prisma/client';

import type { IUserRepository } from '../../domain/user/IUserRepository.js';
import type { User } from '../../domain/user/User.js';

import { toDomainUser, toPrismaUser } from '../mappers/userMapper.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const record = await this.db.user.findUnique({ where: { id } });
    return record ? toDomainUser(record) : null;
  }

  async findByEmail(email: string) {
    const record = await this.db.user.findUnique({ where: { email } });
    return record ? toDomainUser(record) : null;
  }

  async findByUsername(username: string) {
    const record = await this.db.user.findUnique({ where: { username } });
    return record ? toDomainUser(record) : null;
  }

  async save(user: User) {
    const data = toPrismaUser(user);
    await this.db.user.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
