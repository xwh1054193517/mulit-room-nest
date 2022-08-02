import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNotEmpty } from 'class-validator';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { MessageEntity } from './entities/chatting.entity';
import { RoomEntity } from './entities/room.entity';


@Injectable()
export class ChattingService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly MessageRepository: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly UserRepository: Repository<UserEntity>,
    @InjectRepository(RoomEntity)
    private readonly RoomRepository: Repository<RoomEntity>) { }

  //创建个人聊天室
  async createOwnRoom(payload, params) {
    const { room_id } = params;
    const { user_id: room_user_id } = payload
    // 数据库里拿出  房间id和用户头像
    const { user_room_id, user_avatar } = await this.UserRepository.findOne({
      where: { id: room_user_id },
      select: ['user_room_id', 'user_avatar']
    });

    //异常处理
    if (user_room_id) {
      throw new HttpException('你已经创建过一个房间了', HttpStatus.BAD_REQUEST)
    }

    const count = await this.RoomRepository.count({ where: { room_id } })
    if (count) {
      throw new HttpException(
        `房间id${room_id}已经被创建了，换一个试试？`,
        HttpStatus.BAD_REQUEST
      )
    }

    //如果没有房间头像就默认使用用户头像
    const room = Object.assign({ room_user_id }, params);
    !room.room_avatar && (room.room_avatar = user_avatar);
    await this.RoomRepository.save(room);
    //更新用户信息的房间id号
    await this.UserRepository.update(
      { id: room_user_id },
      { user_room_id: room_id }
    )
    return true
  }


  //查询房价的信息
  async getRoomInfo(params) {
    const { room_id } = params;
    const res = await this.RoomRepository.findOne({
      where: { room_id },
      select: [
        'room_id',
        'room_name',
        'room_user_id',
        'room_avatar',
        'room_bg',
        'room_notice',
        'room_need',
      ]
    })
    if (!res) {
      throw new HttpException('没有该房间', HttpStatus.BAD_REQUEST);
    }
    return res
  }

  //修改房间信息
  async updateRoom(payload, params) {
    const { room_id } = params
    const { user_id } = payload

    const room = await this.RoomRepository.findOne({
      where: { room_user_id: user_id, room_id },
    })
    if (!room) {
      throw new HttpException(
        `房间不存在或者你不是房间${room_id}的房主`, HttpStatus.BAD_REQUEST
      )
    }

    const canModify = [
      'room_bg',
      'room_name',
      'room_need',
      'room_password',
      'room_avatar',
      'room_notice'
    ]
    const updateInfo = {}
    canModify.forEach((key) => {
      Object.keys(params).includes(key) && (updateInfo[key] = params[key])
    })

    
    await this.RoomRepository.update({ room_id }, updateInfo);
    return true
  }

  //查询历史信息
  async getHistoryMes(params) {
    const { page = 1, pagesize = 300, room_id = 555 } = params;
    const messageInfo = await this.MessageRepository.find({
      where: { room_id },
      order: { id: 'DESC' },
      skip: (page - 1) * pagesize,
      take: pagesize,
    })

    //收集用户id和引用信息的id
    const userId = []
    const quoteMessageId = []

    messageInfo.forEach((item) => {
      !userId.includes(item.user_id) && userId.push(item.user_id)
      !userId.includes(item.quote_user_id) && userId.push(item.quote_user_id)
      !quoteMessageId.includes(item.quote_message_id) && quoteMessageId.push(item.quote_message_id)
    })

    const userInfoList = await this.UserRepository.find({
      where: { id: In(userId) },
      select: ['id', 'user_nickname', 'user_avatar', 'user_role'],
    })
    userInfoList.forEach((item: any) => (item.user_id = item.id))

    //引用信息
    const messageInfoList = await this.MessageRepository.find({
      where: { id: In(quoteMessageId) },
      select: [
        'id',
        'message_content',
        'message_type',
        'message_statue',
        'user_id'
      ]
    })

    //对引用消息拿到user_nick 并修改字段名称
    messageInfoList.forEach((item: any) => {
      item.quote_user_nickname = userInfoList.find((user: any) => user.user_id === item.user_id)['user_nickname'];
      item.quote_message_content = JSON.parse(item.message_content);
      item.quote_message_type = item.message_type;
      item.quote_message_statue = item.message_statue;
      item.quote_message_id = item.id;
      item.quote_user_id = item.user_id
      delete item.message_content;
      delete item.message_type;
    })


    // 组装信息 带上发消息人的信息 ，已经引用的消息的用户 消息具体信息
    messageInfo.forEach((item: any) => {
      item.user_info = userInfoList.find((user: any) => user.user_id === item.user_id)
      item.quote_info = messageInfoList.find((msg: any) => msg.quote_message_id == item.quote_message_id)
      item.message_statue === 2 && (item.message_content = `${item.user_info.user_nickname}刚撤回了一条不为人知的消息 `);
      item.message_statue === 2 && (item.message_type = 'info');
      item.message_content && item.message_statue === 1 && (item.message_content = JSON.parse(item.message_content))
    })

    return messageInfo.reverse();
  }


  /* 在线搜索表情包 */
  //  async emoticon(params) {
  //   const { keyword } = params;
  //   const url = `https://www.pkdoutu.com/search?keyword=${encodeURIComponent(
  //     keyword,
  //   )}`;
  //   const $ = await requestHtml(url);
  //   const list = [];
  //   $('.search-result .pic-content .random_picture a').each((index, node) => {
  //     const url = $(node).find('img').attr('data-original');
  //     url && list.push(url);
  //   });
  //   return list;
  // }
}
