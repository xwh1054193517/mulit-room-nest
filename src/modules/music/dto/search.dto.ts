import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class searchDto {
  @ApiProperty({ example: '晴天', description: '关键词', required: true })
  @IsNotEmpty({ message: '关键字不能为空' })
  keyword: string;

  @ApiProperty({ example: 1, description: '页数', required: false })
  page: number;

  @ApiProperty({ example: 10, description: '单页显示的数量', required: false })
  pagesize: number;
}
