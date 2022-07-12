import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserEntity } from '../users/entities/user.entity';
import { MessageEntity } from './entities/chatting.entity';
import { MusicEntity } from '../music/entities/music.entity';
import { RoomEntity } from './entities/room.entity';
import { formatRoomlist, formatUser, getTimeSpace, verfiyJwt } from 'src/utils/tool';
import { getRandomNum } from 'src/utils/avatar';
import { getMusicInfo, getMusicSRC } from 'src/utils/music';


//开启websocket服务
@WebSocketGateway(3002, {
  //兼容socketIO2.x
  allowEIO3: true,
  path: '/chat',
  cors: {
    origin: /.*/,
    credentials: true
  },

})

export class ChattingGateway {
  constructor(
    @InjectRepository(UserEntity)
    private readonly UserRepository: Repository<UserEntity>,
    @InjectRepository(MessageEntity)
    private readonly MessageRepository: Repository<MessageEntity>,
    @InjectRepository(MusicEntity)
    private readonly MusicRepository: Repository<MusicEntity>,
    @InjectRepository(RoomEntity)
    private readonly RoomRepository: Repository<RoomEntity>,
  ) { }
  //访问原生特定库的服务器实例
  @WebSocketServer() private socketServer: Server


  //数据库里有多少歌曲
  private musicInDb: any = {}
  //记录clientId，userid,roomid关系 {client.id:{user_id,room_id}}
  private clientMap: any = {}
  //在线用户列表
  private onlineUser: any = {}
  //所有在线房间列表 存储着在线用户，房间信息和管理员
  private roomList: any = {}
  //房间内 计时器列表 用于计时歌曲
  private timerInRoom: any = {}
  //记录每个 用户的点歌时间 限制点歌频率
  private chooseMusicTimewithUser: any = {}

  //初始化
  async afterInit() {
    const musicCount = await this.MusicRepository.count();
    this.musicInDb = musicCount;
  }

  /* -----------------------用户操作------------------------*/
  async handleConnection(client: Socket): Promise<any> {
    console.log('用户连接');
    this.connectToRoom(client, client.handshake.query)

  }

  //用户断开连接 
  async handleDisconnect(client: Socket) {
    // console.log('client', this.clientMap[client.id]);
    // console.log('onlineUser', this.onlineUser);
    // console.log('roomlist', this.roomList);
    console.log('用户断开');
    const clientUser = this.clientMap[client.id]
    if (!clientUser) return
    //删除用户
    delete this.clientMap[client.id]
    const { user_id, room_id } = clientUser
    const { online_user_list, room_info, room_admin } = this.roomList[Number(room_id)]
    //拿到名称用于广播
    let user_nickname;
    const shoulddelIdx = online_user_list.findIndex((item) => {
      if (item.id === user_id) {
        user_nickname = item.user_nickname
        return true
      }
    })
    online_user_list.splice(shoulddelIdx, 1)
    // 房间没人关闭
    if (!online_user_list.length && Number(room_id) !== 555) {
      clearTimeout(this.timerInRoom[`timer${room_id}`]);
      delete this.roomList[Number(room_id)]

      //通知所有人 每个在线用户 房间列表更新
      const { room_name } = room_info
      const { user_nickname: roomAdminNickname } = room_admin
      return this.socketServer.emit('updateRoomlist', {
        room_list: formatRoomlist(this.roomList),
        msg: `${roomAdminNickname}的房间${room_name}(id:${room_id})因为全部人退出而关闭`
      })
    }
    this.socketServer.emit('updateRoomlist', {
      room_list: formatRoomlist(this.roomList),
    })
    //通知用户离开 通知这个房间的
    ///这里的身份好像不对劲 
    this.socketServer.to(room_id).emit('offline', {
      code: 1,
      online_user_list: formatUser(online_user_list, room_admin.id),
      msg: `${user_nickname}离开了房间`
    })
  }

  //接收到客户端传来的信息
  @SubscribeMessage('message')
  async handleClientMessage(client: Socket, data: any) {
    const { user_id, room_id } = this.clientMap[client.id]
    const { message_type, message_content, quote_message = {} } = data

    //引用消息 拿到引用消息的具体内容
    const {
      id: quote_message_id,
      message: quote_message_content,
      message_type: quote_message_type,
      user_info: quoteUserInfo = {}, } = quote_message;

    const { id: quote_user_id, user_nickname: quote_user_nickname } = quoteUserInfo

    //发送的消息数据 存入数据库
    const { user_nickname, user_avatar, user_role, id } = await this.getUserInfoByClientId(client.id)
    const param = { user_id, message_content, message_type, room_id, quote_user_id, quote_message_id }
    const message = await this.MessageRepository.save(param)

    //需要对消息的message_content序列化因为发送的所有消息都是JSON.stringify的
    message.message_content && (message.message_content = JSON.parse(message.message_content))

    //由于message中只有user_id 还有把发送人的信息也加入进去
    const res: any = {
      ...message,
      user_info: { user_nickname, user_avatar, user_role, user_id: id }
    }
    //如果有引用消息的话 也要把引用消息的具体信息加入
    quote_user_id && (res.quote_info = {
      quote_user_id,
      quote_user_nickname,
      quote_message_id,
      quote_message_content,
      quote_message_type,
      quote_message_status: 1,
    })

    //发送socket
    this.socketServer.to(room_id).emit('message', { data: res, msg: '收到一条新的信息' })
  }

  //用户修改信息后，在房间里直接通知其他用户更新这个用户显示的信息
  @SubscribeMessage('updateRoomUser')
  async handleUserUpdate(client: Socket, newInfo: any) {
    const { room_id } = this.clientMap[client.id]

    //拿到这个房间里online_user_list的某个用户 引用直接改值 能修改原数据
    const oldInfo = await this.getUserInfoByClientId(client.id)
    Object.keys(newInfo).forEach((key) => {
      oldInfo[key] = newInfo[key]
    })

    //拿到这个list去更新
    const { online_user_list } = this.roomList[Number[room_id]]
    this.socketServer.to(room_id).emit('updateOnlineUser', { online_user_list })
  }

  //房主修改房间信息需要通知房间内所有人去更新
  @SubscribeMessage('updateRoomInfo')
  async handleRoomUpdate(client: Socket, newRoom) {
    const { room_id } = this.clientMap[client.id]
    //直接赋值然后拿list去更新
    this.roomList[Number(room_id)].room_info = newRoom
    const { user_nickname } = await this.getUserInfoByClientId(client.id)
    const res: any = {
      room_list: formatRoomlist(this.roomList),
      msg: `房主${user_nickname}修改了房间${room_id}的信息`
    }
    this.socketServer.to(room_id).emit('updateRoomlist', res)
  }

  //撤回信息 返回撤回的信息id和信息内容
  @SubscribeMessage('callbackMessage')
  async handleCallbackMessage(client: Socket, { user_nickname, id }) {
    const { user_id, room_id } = this.clientMap[client.id]
    const mes = await this.MessageRepository.findOne({ where: { id, user_id } })
    if (!mes) {
      return client.emit('tips', {
        code: -1,
        msg: '不可撤回他人的信息'
      })
    }
    //比较发送时间和当前时间 限制多少分钟内不可撤回
    const { createdAt } = mes
    const timediff = new Date(createdAt).getTime()
    const now = new Date().getTime()
    if (now - timediff > 1 * 60 * 1000) {
      return client.emit('tips', {
        code: -1,
        msg: '只能撤回一分钟前的信息'
      })
    }
    await this.MessageRepository.update({ id }, { message_statue: 2 })
    this.socketServer.to(room_id).emit('callbackMessage', {
      code: 1,
      id,
      msg: `${user_nickname}撤回了一条信息`
    })
  }





  /* -----------------------歌曲操作------------------------*/
  //切歌
  @SubscribeMessage('nextMusic')
  async handleNextMusic(client: Socket, music: any) {
    const { music_name, music_singer, choose_user_id } = music
    const { room_id } = this.clientMap[client.id]
    //获得发起此操作的用户信息
    const { id: user_id, user_role, user_nickname } = await this.getUserInfoByClientId(client.id)
    const { room_admin } = this.roomList[Number(room_id)]
    // if (!['admin'].includes(user_role) && user_id !== room_admin.id && user_id !== choose_user_id) {
    //   return client.emit('error', {
    //     code: -1,
    //     msg: '非管理员和房主只能切换自己的歌曲'
    //   })
    // }
    this.socketServer.to(room_id).emit('notice', {
      code: 2,
      message_type: 'info',
      message_content: `${user_nickname} 切掉了${music_name}(${music_singer})`,
    })
    this.changeMusic(Number(room_id))
  }

  //点歌 将歌曲添加到房间歌单列表
  @SubscribeMessage('chooseMusic')
  async handleChooseMusic(client: Socket, music: any) {
    const { user_id, room_id } = this.clientMap[client.id]
    const userInfo: any = await this.getUserInfoByClientId(client.id)
    const { music_name, music_mid, music_singer } = music
    const { music_queue_list, room_admin } = this.roomList[room_id]
    const { id: room_admin_id } = room_admin

    //判断是否已经在播放列表中
    if (music_queue_list.some((item) => item.music_mid === music_mid)) {
      return client.emit('tips', { code: -1, msg: '该歌曲已经在播放列表中 ' })
    }

    //计算 距离上次点歌时间 管理员或者房主 不限制点歌时间
    if (this.chooseMusicTimewithUser[user_id]) {
      const timeDiff = getTimeSpace(this.chooseMusicTimewithUser[user_id])
      if (timeDiff <= 6 && !['super', 'admin'].includes(userInfo.user_role) && user_id !== room_admin_id) {
        return client.emit('tips', {
          code: -1,
          msg: `太频繁了,请在${6 - timeDiff}秒之后再尝试`
        })
      }
    }

    //点歌成功
    music.user_info = userInfo
    music_queue_list.push(music)
    this.chooseMusicTimewithUser[user_id] = getTimeSpace()
    client.emit('tips', { code: 1, msg: `点歌成功` })
    this.socketServer.to(room_id).emit('chooseMusic', {
      code: 1,
      music_queue_list,
      msg: `${userInfo.user_nickname}点了一首${music_name}(${music_singer})`
    })
  }

  //移除 房间歌单列表中的歌曲
  @SubscribeMessage('removeMusic')
  async handleRemoveMusic(client: Socket, music: any) {
    //获取用户id,房间id
    const { user_id, room_id } = this.clientMap[client.id]
    //获取移除的歌曲信息
    const { music_mid, music_name, music_singer, user_info } = music
    //获取点歌人信息
    const { user_role, id } = user_info
    //获得房间歌曲列表，房主信息
    const { music_queue_list, room_admin } = this.roomList[Number(room_id)]
    //结构房主信息
    const { id: room_admin_id } = room_admin
    //获得删歌曲人的信息 
    const { user_role: change_user_role, user_id: change_user_id, user_nickname } = await this.getUserInfoByClientId(client.id)
    if (!['admin'].includes(change_user_role) && user_id !== change_user_id && user_id !== room_admin_id) {
      return client.emit('tips', {
        code: -1,
        msg: '非管理员或者房主只能移除自己点的歌曲哦'
      })
    }
    const delMusicIdx = music_queue_list.findIndex((item) => item.music_mid = music_mid)
    music_queue_list.splice(delMusicIdx, 1)
    client.emit('tips', {
      code: 1,
      msg: `成功移除了${music_name}(${music_singer})`
    })
    this.socketServer.to(room_id).emit('chooseMusic', {
      code: 1,
      music_queue_list,
      msg: `${user_nickname}移除了歌单中的${music_name}(${music_singer})`
    })
  }




  /* ---------------------辅助函数-------------------*/

  //根据client.id拿到用户信息
  async getUserInfoByClientId(client_id) {
    const { user_id, room_id } = this.clientMap[client_id]
    const { online_user_list } = this.roomList[Number(room_id)]
    return online_user_list.find((item) => item.id === user_id)
  }

  ////根据client.id拿到房间歌曲列表
  async getMusicQueueListByClientId(cliend_id) {
    const { room_id } = this.clientMap[cliend_id];
    const { music_queue_list } = this.roomList[room_id];
    return music_queue_list;
  }

  //切换房间歌曲 参数为房间id
  async changeMusic(room_id) {
    //获取下一首歌的mid，点歌人信息
    const { mid, user_info, music_queue_list } = await this.getNextMusic(room_id);
    try {
      //获得歌曲的详细信息
      const { music_info } = await getMusicInfo(mid)
      //如果有点歌人，就带上他的id，没有标为-1为系统随机播放
      music_info.choose_user_id = user_info ? user_info.id : -1
      //获取歌曲地址和歌词
      const { music_lrc, music_src, music_downloadSrc } = await getMusicSRC(mid)
      this.roomList[Number(room_id)].music_info = music_info
      this.roomList[Number(room_id)].music_src = music_src
      this.roomList[Number(room_id)].music_lrc = music_lrc
      this.roomList[Number(room_id)].music_downloadSrc = music_downloadSrc
      const { music_singer, music_album, music_name, music_duration } = music_info

      // 如果房间点歌列表存在歌曲就把第一首去掉
      music_queue_list.length && this.roomList[Number(room_id)].music_queue_list.shift()

      //通知客户端
      this.socketServer.to(room_id).emit('changeMusic', {
        musicInfo: { music_info, music_src, music_lrc, music_downloadSrc, music_queue_list },
        msg: `正在播放${user_info ? user_info.user_nickname : '系统随机'}点播的${music_name}(${music_singer}-${music_album})`
      })
      // console.log('切歌了:', {
      //   musicInfo: { music_info, music_src, music_lrc, music_downloadSrc, music_queue_list },
      //   msg: `正在播放${user_info ? user_info.user_nickname : '系统随机'}点播的${music_name}(${music_singer}-${music_album})`
      // });

      //设置定时器，歌曲时长结束后自动切歌,每次切歌都先清除然后再设置
      clearTimeout(this.timerInRoom[`timer${room_id}`])
      this.timerInRoom[`timer${room_id}`] = setTimeout(() => {
        this.changeMusic(room_id)
      }, music_duration * 1000)

      // 拿到歌曲时长， 记录歌曲结束时间 用来 给新进的用户计算歌曲播放时间
      this.roomList[Number(room_id)].last_music_timespace = new Date().getTime() + music_duration * 1000;
    } catch (error) {
      //歌曲信息出错 就说明这个歌曲不能播放了，切换下一首
      music_queue_list.shift()
      this.changeMusic(room_id)
      return this.socketServer.to(room_id).emit('notice', {
        code: -1,
        msg: `当前歌曲无法播放，已自动跳过`
      })
    }
  }

  //获取房间的下一首歌曲信息
  //如果有人点歌了就去歌单列表中拿，如果没有就从db里面随机拿一首播放
  async getNextMusic(room_id) {
    let mid: any, user_info: any = null, music_queue_list: any = []
    //获取歌曲列表
    this.roomList[Number(room_id)] && (music_queue_list = this.roomList[Number(room_id)].music_queue_list)

    // 如果当前房间有点歌列表，就顺延，没有就随机播放
    if (music_queue_list.length) {
      //拿到歌曲mid和点歌人的信息
      mid = music_queue_list[0].music_mid
      user_info = music_queue_list[0]?.user_info
    } else {
      const randomId = getRandomNum(1, this.musicInDb)
      const randomMusic: any = await this.MusicRepository.findOne({ where: { id: randomId } })
      if (!randomMusic) { }
      mid = randomMusic.music_mid
    }
    return { mid, user_info, music_queue_list }
  }

  //初始化房间  给出用户需要的各种信息
  async initRoomInfo(client: Socket, user_id, user_nickname, address, room_id) {
    const { music_info, music_queue_list, music_src, music_lrc, room_admin, last_music_timespace, music_downloadSrc, online_user_list } = this.roomList[Number(room_id)]
    //新用户进入房间 音乐播放的开始时间
    const music_current_time = music_info.music_duration - Math.round((last_music_timespace - new Date().getTime()) / 1000)

    //序列化 房间用户
    const formatOnlineUser = formatUser(online_user_list, room_admin.id)

    // 初始化房间用户需要用到的信息
    await client.emit('initRoomInfo', {
      user_id,
      music_info,
      music_src,
      music_downloadSrc,
      music_lrc,
      music_current_time,
      music_queue_list,
      online_user_list: formatOnlineUser,
      room_admin,
      room_list: formatRoomlist(this.roomList),
      tips: `欢迎${user_nickname}加入房间`,
      msg: `来自${address}的${user_nickname}进入了房间`
    })

    // 用户 上线需要通知房间里的所有人并更新房间用户列表
    client.broadcast.to(room_id).emit('online', {
      online_user_list: formatOnlineUser,
      msg: `来自${address}的${user_nickname}进入了房间`
    })

  }

  //初始化并记录房价信息
  async initRoomBasic(room_id, room_info) {
    const { room_user_id } = room_info
    const room_admin = await this.UserRepository.findOne({
      where: { id: room_user_id },
      select: ['user_nickname', 'user_avatar', 'id', 'user_role']
    })

    //初始化
    this.roomList[Number(room_id)] = {
      online_user_list: [],
      music_queue_list: [],
      music_info: {},
      music_src: null,
      music_downloadSrc: null,
      music_lrc: null,
      last_music_timespace: null,
      [`timer${room_id}`]: null,
      room_info,
      room_admin
    }

    //初次开启房间需要播放音乐
    await this.changeMusic(room_id)
  }

  //用户初次连接至房间
  async connectToRoom(client: Socket, query: any) {
    try {
      //获得用户身份 验证是否登录
      const { token, address, room_id = 555 } = query
      const payload = await verfiyJwt(token)
      const { user_id } = payload
      if (user_id === -1 || !token) {
        client.emit('auth', { code: -1, msg: '身份验证失败，请重新登陆' })
        return client.disconnect()
      }

      //判断用户是否已经处于连接状态
      Object.keys(this.clientMap).forEach((clientUser) => {
        if (this.clientMap[clientUser]['user_id'] === user_id) {
          //旧用户被挤掉
          this.socketServer.to(clientUser).emit('tips', {
            code: -2,
            msg: `你的账号在别处登陆了，你被强制下线`
          })
          //新用户覆盖登录
          client.emit('tips', {
            code: -1,
            msg: `你的账号在别地登录，你已将他挤下线`
          })
          //移除旧用户的信息
          this.socketServer.in(clientUser).disconnectSockets(true)
          delete this.clientMap[clientUser]
        }
      })

      //查询用户的信息
      const user = await this.UserRepository.findOne({ where: { id: user_id } })
      const { user_name, user_nickname, user_email, user_role, user_sex, user_room_bg, user_signature, user_avatar } = user
      const userInfo = { id: user_id, user_name, user_nickname, user_email, user_role, user_sex, user_room_bg, user_signature, user_avatar }
      if (!user) {
        client.emit('auth', {
          code: -1,
          msg: `没有该用户信息`
        })
        return client.disconnect()
      }

      //查询房间的信息
      const room_info = await this.RoomRepository.findOne({
        where: { room_id },
        select: ['room_id', 'room_user_id', 'room_avatar', 'room_notice', 'room_bg', 'room_need','room_name']
      })
      if (!room_info) {
        client.emit('tips', {
          code: -3,
          msg: `没有该房间信息`
        })
        return client.disconnect()
      }

      //正式加入房间
      client.join(room_id)
      const HasRoom = this.roomList[room_id]

      //判断有无该房间 没有就新增到房间列表
      !HasRoom && (await this.initRoomBasic(room_id, room_info))
      this.roomList[Number(room_id)].online_user_list.push(userInfo)

      //记录映射
      this.clientMap[client.id] = { user_id, room_id }
      this.onlineUser[user_id] = { userInfo, roomId: room_id }

      //初始化房间
      await this.initRoomInfo(client, user_id, user_nickname, address, room_id)

      // 需要通知所有人更新列表
      const res: any = { room_list: formatRoomlist(this.roomList) }
      !HasRoom && (res.msg = `${user_nickname}的房间[${room_info.room_name}]因为有新用户进入而开启服务了`)
      this.socketServer.emit('updateRoomlist', res)
    } catch (error) {

    }
  }
}

