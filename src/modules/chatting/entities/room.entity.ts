import { Column, Entity } from 'typeorm'
import { TimeEntity } from 'src/timeEntity/timeEntity'

//建表 user表
@Entity({ name: 'room' })
export class RoomEntity extends TimeEntity {
  @Column({ unique: true, comment: '房主id' })
  room_user_id: number;

  @Column({ unique: true, comment: '房间id' })
  room_id: number;

  @Column({ length: 20, comment: '房名' })
  room_name: string;

  @Column({ default: 1, comment: '是否需要密码,1为公开,2为加密' })
  room_need: number;

  @Column({ length: 255, nullable: true, comment: '房间密码' })
  room_password: string;

  @Column({ length: 255, nullable: true, comment: '房间略缩图' })
  room_avatar: string;

  @Column({ length: 500, default: '房间暂无公告', comment: '房间公告' })
  room_notice: string;

  @Column({ length: 255, nullable: true, comment: '房间背景' })
  room_bg: string;
}
