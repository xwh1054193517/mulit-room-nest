import { Controller, Get, Post, Body, Param, Request, Query, Put, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChattingService } from './chatting.service';


@Controller('/chat')
@ApiTags('Chat')
export class ChattingController {
  constructor(private readonly ChattingService: ChattingService) { }

  @Post('/createRoom')
  createOwnRoom(@Request() request, @Body() param) {
    return this.ChattingService.createOwnRoom(request.payload, param)
  }

  @Get('/roomDetail')
  roomDetail(@Query() param) {
    return this.ChattingService.getRoomInfo(param)
  }

  @Put('/updateRoom')
  updateRoom(@Request() request, @Body() params) {
    return this.ChattingService.updateRoom(request.payload, params)
  }

  @Post('/history')
  getHistort(@Body() param) {
    return this.ChattingService.getHistoryMes(param)
  }
}
