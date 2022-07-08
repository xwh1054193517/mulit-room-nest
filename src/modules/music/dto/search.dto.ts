import { ApiProperty } from '@nestjs/swagger';

export class searchDto {
  @ApiProperty({ example: '晴天', description: '关键词', required: false })
  keyword: string;

  @ApiProperty({ example: 1, description: '页数', required: false })
  page: number;

  @ApiProperty({ example: 10, description: '单页显示的数量', required: false })
  pagesize: number;
}
