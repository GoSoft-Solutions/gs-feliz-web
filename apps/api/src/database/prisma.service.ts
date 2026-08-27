import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@feliz/database';

/**
 * Wraps the shared Prisma client (from @feliz/database) as a Nest
 * injectable, so business modules depend on this service instead of
 * instantiating PrismaClient themselves. Handles connect/disconnect with
 * the Nest application lifecycle.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
