import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";

import * as jwt from 'jsonwebtoken'
import { secretkey, whiteList } from "src/config/jwt";


@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //拿到request对象
    const request = context.switchToHttp().getRequest()
    //拿到请求信息
    const { headers, path } = context.switchToRpc().getData()

    //路由在白名单内直接通过
    if (whiteList.includes(path)) {
      return true
    }
    //获得token
    const token = headers.authorization || request.headers.authorization
    if (token) {
      //解析token并把它加到req对象上
      const payload = await this.verify(token, secretkey)
      request.payload = payload
      return true
    } else {
      throw new HttpException('你还没有登录', HttpStatus.UNAUTHORIZED)
    }
  }


  private verify(token: string, secretkey: string) {
    return new Promise((resolve) => {
      jwt.verify(token, secretkey, (error, payload) => {
        if (error) {
          throw new HttpException('token验证失败', HttpStatus.UNAUTHORIZED)
        } else {
          resolve(payload)
        }
      })
    })
  }
}
