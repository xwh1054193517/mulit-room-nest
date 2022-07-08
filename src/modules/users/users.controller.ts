import { Controller, Get, Post, Body, Param, Request, Query, Put, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.user.dto';
import { RegisterDto } from './dto/reg.user.dto';
import { UsersService } from './users.service';

@Controller('/user')
@ApiTags('User')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('/register')
  register(@Body() params: RegisterDto) {
    return this.usersService.registerUser(params)
  }

  @Post('/login')
  login(@Body() params: LoginDto) {
    return this.usersService.loginUser(params)
  }

  @Get('/info')
  getUserInfo(@Request() request) {
    return this.usersService.getUserInfo(request.payload)
  }

  @Put('/update')
  update(@Request() request, @Body() body) {
    return this.usersService.updateUser(request.payload, body)
  }
}
