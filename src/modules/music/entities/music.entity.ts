import { TimeEntity } from 'src/timeEntity/timeEntity';
import { Column, Entity } from 'typeorm';


@Entity({ name: 'music' })
export class MusicEntity extends TimeEntity {
  @Column({ length: 64, unique: true, comment: '歌曲mid' })
  music_mid: string;

  @Column({ length: 300, comment: '歌曲名称' })
  music_name: string;

  @Column({ length: 300, comment: '歌曲专辑名' })
  music_album: string;

  @Column({ length: 300, nullable: true, comment: '歌曲专辑图片' })
  music_albumPic: string;

  @Column({ length: 300, comment: '歌曲作者' })
  music_singer: string;

  @Column({ comment: '歌曲时长' })
  music_duration: number;

  @Column({ comment: '是否推荐到热门歌曲 1:是 -1:不是', default: 0 })
  is_recommend: number;
}
