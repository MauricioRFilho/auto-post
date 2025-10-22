import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ScrapeJobData {
  affiliateLinkId: string;
}

export interface PostJobData {
  productId: string;
  channels: {
    instagram?: boolean;
    pinterest?: boolean;
    whatsapp?: boolean;
  };
  context?: Record<string, any>;
}

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('scrape') private scrapeQueue: Queue<ScrapeJobData>,
    @InjectQueue('post') private postQueue: Queue<PostJobData>,
  ) {}

  async addScrapeJob(data: ScrapeJobData) {
    return this.scrapeQueue.add('scrape-product', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addPostJob(data: PostJobData) {
    return this.postQueue.add('post-product', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async getScrapeQueue() {
    return this.scrapeQueue;
  }

  async getPostQueue() {
    return this.postQueue;
  }
}
