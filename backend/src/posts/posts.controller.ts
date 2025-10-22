import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('channel') channel?: string,
  ) {
    return this.postsService.findAll({ status, channel });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return this.postsService.getEvents(id);
  }
}
