import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { MusicModule } from './modules/music/music.module';

import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path'
import { ChattingModule } from './modules/chatting/chatting.module';

@Module({
  imports: [
    //加载配置文件 创建两个配置， db,jwt配置
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('db'),
      inject: [ConfigService],
    }),
    UsersModule, MusicModule,ChattingModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
