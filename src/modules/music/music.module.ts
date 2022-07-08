import { Module } from '@nestjs/common';
import { MusicService } from './music.service';
import { MusicController } from './music.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MusicEntity } from './entities/music.entity';
import { CollectEntity } from './entities/collect.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MusicEntity, CollectEntity])],
  controllers: [MusicController],
  providers: [MusicService]
})
export class MusicModule { }
