import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';


@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionRes: any = exception.getResponse()

    //异常状态设置 不是HttpException的实例就500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    //设置错误提示信息
    const message = exceptionRes.constructor === Object ? exceptionRes['message'] : exceptionRes
    //异常状态码
    const statusCode = exception.getStatus() || 400;
    //异常返回body
    const errorRes={
      message:Array.isArray(message)?message[0]:message,
      code:statusCode,
      success:false,
      url:request.originalUrl,
      timestamp:new Date().toLocaleDateString()
    }

    Logger.error(
      `${(Date.now())} ${request.method} ${request.url}`,
      JSON.stringify(errorRes),
      'HttpExceptionFilter',
    )

    //设置返回
    response.status(status);
    response.header('Content-Type', 'application/json; charset=utf-8');
    response.send(errorRes);
  }
}
