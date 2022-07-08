import { Column, Entity } from 'typeorm'
import { TimeEntity } from 'src/timeEntity/timeEntity'

//建表 user表
@Entity({ name: 'collect' })
export class CollectEntity extends TimeEntity {
  @Column({ comment: '用户id' })
  user_id: number;

  @Column({ comment: '歌曲mid' })
  music_mid: number;

  @Column({ length: 255, comment: '歌曲名字' })
  music_name: string;

  @Column({ length: 255, comment: '歌曲专辑' })
  music_album: string;

  @Column({ length: 255, comment: '歌曲专辑大图' })
  music_albumPic: string;

  @Column({ length: 255, comment: '歌曲作者' })
  music_singer: string;

  @Column({ comment: '软删除 1:正常 -1:已删除', default: 1 })
  is_delete: number;
}
