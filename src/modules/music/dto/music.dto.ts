import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class musicDto {
  @ApiProperty({ example: 'aasdfsadfsaf', description: '歌曲的mid', required: true })
  @IsNotEmpty({ message: 'mid不能为空' })
  mid: string;
}
