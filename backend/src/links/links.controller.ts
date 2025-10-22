import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  create(@Body() createLinkDto: CreateLinkDto) {
    return this.linksService.create(createLinkDto);
  }

  @Get()
  findAll(
    @Query('marketplace') marketplace?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.linksService.findAll({
      marketplace,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.linksService.findOne(id);
  }

  @Post(':id/scrape')
  triggerScrape(@Param('id') id: string) {
    return this.linksService.triggerScrape(id);
  }
}
