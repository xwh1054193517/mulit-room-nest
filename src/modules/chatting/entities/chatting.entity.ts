import { Column, Entity } from 'typeorm'
import { TimeEntity } from 'src/timeEntity/timeEntity'

//建表 user表
@Entity({ name: 'message' })
export class MessageEntity extends TimeEntity {
  @Column({ comment: '用户id' })
  user_id: number;

  @Column({ comment: '房间id' })
  room_id: number;

  @Column('text', { comment: '聊天信息' })
  message_content: string;

  @Column({ length: 64, comment: '信息类型' })
  message_type: string;

  @Column({ nullable: true, comment: '引用人的用户id' })
  quote_user_id: string;

  @Column({ nullable: true, comment: '引用的信息id' })
  quote_message_id: string;

  @Column({ default: 1, comment: '信息状态,1正常,2撤回' })
  message_statue: number;
}
