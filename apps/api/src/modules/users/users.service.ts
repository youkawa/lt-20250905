import { Injectable } from '@nestjs/common';

import { CreateUserDto, UpdateUserDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
  findAll() {
    return this.prisma.user.findMany();
  }
  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data });
  }
}
