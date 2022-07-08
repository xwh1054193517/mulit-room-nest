import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator'

//数据传输对象
export class LoginDto {
  @ApiProperty({ example: 'user', description: '用户名', required: true })
  @IsNotEmpty({ message: '用户名不能为空' })
  user_name: string;

  @ApiProperty({ example: 'password', description: '登陆密码', required: true })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度最低为6位' })
  @MaxLength(15, { message: '密码长度最多为15位' })
  user_password: string;
}
