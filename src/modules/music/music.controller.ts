import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { configureCookie } from 'src/utils/music';
import { searchDto } from './dto/search.dto';
import { MusicService } from './music.service';

@ApiTags('Music')
@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {     /* 初始化歌单和主房间信息 */
    this.musicService.initMusicList();
  }

  @Get('/configureCookie')
  test(@Query('cookie') c) {
    return configureCookie(c);
  }

  @Get('/search')
  search(@Query() param: searchDto) {
    return this.musicService.search(param)
  }

  @Get('/quickSearch')
  quickSearch(@Query() param: searchDto) {
    return this.musicService.quickSearch(param)
  }

  @Get('/daily')
  recommend() {
    return this.musicService.recommend()
  }

  @Get('/source')
  source(@Query('mid') mid) {
    return this.musicService.getPlay(mid)
  }

  @Post('/addCollect')
  collect(@Request() req, @Body() param) {
    return this.musicService.collectMusic(req.payload, param)
  }

  @Get('/collect')
  getCollect(@Request() req, @Query() param) {
    return this.musicService.getCollect(req.payload, param)
  }

  @Get('/hotList')
  getHotList(@Query() param) {
    return this.musicService.getHotList(param)
  }

  @Post('/remove')
  removeCollect(@Request() req, @Query() param) {
    return this.musicService.removeCollect(req.payload, param)
  }
}
