import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
  }

  // teardown logic
  cleanDb() {
    return this.$transaction([
      this.bookMark.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
