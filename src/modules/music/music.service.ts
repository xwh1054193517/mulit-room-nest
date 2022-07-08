import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getMusicInfo, getMusicSRC, initMusicByApi, recommend, searchQuick, searchSong } from 'src/utils/music';
import { Repository } from 'typeorm';
import { CollectEntity } from './entities/collect.entity';
import { MusicEntity } from './entities/music.entity';
const qqMusic = require('qq-music-api')

@Injectable()
export class MusicService {
  constructor(
    @InjectRepository(MusicEntity)
    private readonly MusicRepository: Repository<MusicEntity>,
    @InjectRepository(CollectEntity)
    private readonly CollectRepository: Repository<CollectEntity>
  ) { }


  //搜索歌曲
  async search(param: any) {
    const { keyword, page = 1, pagesize = 20 } = param
    return await searchSong(keyword, page, pagesize)
  }

  //快速搜索
  async quickSearch(param: any) {
    const { keyword } = param
    return await searchQuick(keyword)
  }

  //推荐歌曲
  async recommend() {
    return await recommend()
  }

  //根据id返回链接和歌词
  async getPlay(mid) {
    return await getMusicSRC(mid)
  }

  /* ------------------------------------------------------*/
  // 收藏音乐
  async collectMusic(payload, params) {
    const { music_mid } = params
    const { user_id, user_role } = payload
    const count = await this.CollectRepository.count({
      where: { music_mid, user_id, is_delete: 1 }
    })
    if (count > 0) {
      throw new HttpException('你已经收藏过这首歌曲了', HttpStatus.BAD_REQUEST)
    }
    const music = Object.assign({ user_id }, params)
    console.log(music);
    await this.CollectRepository.save(music)
    user_role === 'admin' && (music.is_recommend = 1)
    const mus = await this.MusicRepository.count({ where: { music_mid } })
    if (mus) {
      if (user_role === 'admin') {
        return await this.MusicRepository.update({ music_mid }, { is_recommend: 1 })
      }
    }
    return await this.MusicRepository.save(music)
  }

  // 获取收藏的歌单
  async getCollect(payload, params) {
    const { page = 1, pagesize = 20 } = params
    if (!payload) {
      throw new HttpException('尚未登录', HttpStatus.FORBIDDEN)
    }
    const { user_id } = payload
    return await this.CollectRepository.find({
      where: { user_id, is_delete: 1 },
      order: { id: 'DESC' },
      skip: (page - 1) * pagesize,
      take: pagesize,
      cache: true
    })
  }

  //移除收藏的音乐
  async removeCollect(payload, params) {
    const { music_mid } = params;
    const { user_id } = payload;
    const c = await this.CollectRepository.findOne({
      where: { user_id, music_mid }
    })
    if (c) {
      await this.CollectRepository.update({ user_id, music_mid }, { is_delete: -1 })
      return '移除成功'
    } else {
      throw new HttpException('歌曲不存在你的歌单里', HttpStatus.FORBIDDEN)
    }
  }


  //获取热门歌曲
  async getHotList(params) {
    const { page = 1, pagesize = 20, user_id = 1 } = params;
    return await this.CollectRepository.find({
      where: { user_id, is_delete: 1 },
      order: { id: 'DESC' },
      skip: (page - 1) * pagesize,
      take: pagesize,
      cache: true
    })
  }

  /* ------------------------------初始化------------------*/
  //启动服务时 拿取部分歌曲存储到数据库中 用于系统随机播放的数据
  async initMusicList() {
    const params = { songList: 5 };
    const musicCount = await this.MusicRepository.count()
    if (musicCount) {
      return console.log(
        `当前曲库共有${musicCount}首音乐`
      );
    }
    const musicList = await initMusicByApi(params)
    await this.MusicRepository.save(musicList)

    musicList.length && console.log(`初始化歌单成功，共获得${musicList.length}首歌曲`);
    return musicList
  }
}
