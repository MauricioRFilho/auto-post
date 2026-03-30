import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { QueuesModule } from '../queues/queues.module';
import { ProductsModule } from '../products/products.module';
import { MessagingModule } from '../messaging/messaging.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [QueuesModule, ProductsModule, MessagingModule, PrismaModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
