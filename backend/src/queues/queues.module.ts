import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'scrape',
      },
      {
        name: 'post',
      },
    ),
  ],
  providers: [QueuesService],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}
