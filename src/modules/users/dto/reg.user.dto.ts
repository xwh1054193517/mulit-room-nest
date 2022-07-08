import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
export class RegisterDto {
  @ApiProperty({ example: 'user', description: '用户名' })
  @IsNotEmpty({ message: '用户名不能为空' })
  user_name: string;


  @ApiProperty({ example: 'nickname', description: '用户昵称' })
  @IsNotEmpty({ message: '用户昵称不能为空' })
  @MaxLength(15, { message: '用户昵称最长为15位' })
  user_nickname: string;

  @ApiProperty({ example: 'password', description: '密码' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度最低为6位' })
  @MaxLength(15, { message: '密码长度最多为15位' })
  user_password: string;

  @ApiProperty({ example: '我的个性签名', description: '签名' })
  user_signature: string;

  @ApiProperty({ example: '123456789@qq.com', description: '邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  user_email: string;

  @ApiProperty({ example: 'www.xxx.png', description: '头像', required: false })
  user_avatar: string;

  @ApiProperty({ example: '1', description: '性别', required: false, enum: [1, 2] })
  @IsOptional()
  @IsEnum([1, 2], { message: '性别只能为1和2' })
  @Type(() => Number) //string转为number
  user_sex: number;
}
