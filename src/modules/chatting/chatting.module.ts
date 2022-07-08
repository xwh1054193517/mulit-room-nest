import { Module } from '@nestjs/common';
import { ChattingService } from './chatting.service';
import { ChattingGateway } from './chatting.gateway';
import { ChattingController } from './chatting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { MessageEntity } from './entities/chatting.entity';
import { RoomEntity } from './entities/room.entity';
import { MusicEntity } from '../music/entities/music.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    UserEntity,
    MessageEntity,
    RoomEntity,
    MusicEntity
  ])],
  controllers: [ChattingController],
  providers: [ChattingGateway, ChattingService]
})
export class ChattingModule { }
