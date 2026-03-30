import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { QueuesModule } from '../queues/queues.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [QueuesModule, PrismaModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
