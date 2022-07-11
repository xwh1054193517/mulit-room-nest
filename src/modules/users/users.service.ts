import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt'
import { hashSync, compareSync } from 'bcryptjs'
import { randomAvatar } from 'src/utils/avatar';
//服务 业务逻辑功能
@Injectable()
export class UsersService {
  constructor(
    //服务里面使用@InjectRepository 获取数据库Model 实现操作数据
    @InjectRepository(UserEntity)
    private readonly UserRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService
  ) { }

  //注册账号
  async registerUser(params) {

    const { user_name, user_password, user_email } = params
    //加密密码
    params.user_password = hashSync(user_password, 10)
    const hasOne: any = await this.UserRepository.findOne({
      where: [{ user_name }, { user_email }]
    })
    //默认头像
    params.user_avatar = randomAvatar()
    if (hasOne) {
      const msg = user_name === hasOne.user_name ? '用户名' : '邮箱';
      throw new HttpException(`${msg}已经存在`, HttpStatus.BAD_REQUEST)
    }
    await this.UserRepository.save(params)
    return true
  }

  //登录账号
  async loginUser(params): Promise<any> {
    const { user_name, user_password } = params;
    const res = await this.UserRepository.findOne({
      where: [{ user_name }]
    });
    if (!res) throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    const right = compareSync(user_password, res.user_password)
    if (right) {
      const { user_name, user_email, user_role, user_nickname, id: user_id } = res
      return {
        token: this.jwtService.sign({
          user_name,
          user_nickname,
          user_email,
          user_role,
          user_id
        })
      }
    } else {
      throw new HttpException({ message: '账号密码错误', error: '请检查账号密码是否正确' }, HttpStatus.BAD_REQUEST)
    }
  }


  //获取用户信息
  async getUserInfo(payload) {

    const { user_id: id, exp } = payload
    const res = await this.UserRepository.findOne({
      where: { id: id },
      select: [
        'user_name',
        'user_nickname',
        'user_sex',
        'user_email',
        'user_role',
        'user_avatar',
        'user_signature',
        'user_room_bg',
        'user_room_id',
      ]
    })
    if (!res) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST)
    }
    return { user_info: Object.assign(res, { user_id: id, exp }) }
  }

  //修改用户信息
  async updateUser(payload, params) {
    const { user_id } = payload;
    const canModify = [
      'user_nickname',
      'user_sex',
      'user_signature',
      'user_room_bg',
      'user_avatar'
    ]
    const updateInfo: any = {}
    canModify.forEach((item) => {
      //如果传进来的更新对象有可修改的值就赋值
      Object.keys(params).includes(item) && (updateInfo[item] = params[item])
    })
    await this.UserRepository.update({ id: user_id }, updateInfo)
    return true
  }


}
