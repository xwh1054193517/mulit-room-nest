import { Column, Entity } from 'typeorm'
import { TimeEntity } from 'src/timeEntity/timeEntity'

//建表 user表
@Entity({ name: 'user' })
export class UserEntity extends TimeEntity {
  @Column({ length: 15, comment: '用户名' })
  user_name: string;

  @Column({ length: 12, comment: '用户昵称' })
  user_nickname: string;

  @Column({ length: 1000, comment: '用户密码' })
  user_password: string;

  @Column({ default: 1, comment: '用户性别' })
  user_sex: number;

  @Column({ length: 64, unique: true, comment: '用户邮箱' })
  user_email: string;

  @Column({ length: 600, nullable: true, comment: '用户头像' })
  user_avatar: string;

  @Column({ length: 10, default: 'viewer', comment: '用户权限' })
  user_role: string;

  @Column({ length: 255, nullable: true, comment: '用户聊天室背景图' })
  user_room_bg: string;

  @Column({ length: 255, nullable: true, comment: '用户创建的房间Id' })
  user_room_id: string;

  @Column({ length: 255, default: '每个人的个性签名' })
  user_signature: string;
}
