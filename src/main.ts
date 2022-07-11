import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { setupSwagger } from './swagger/index'
import { HttpExceptionFilter } from './filter/http-exception.filter'
import { TransformInterceptor } from './interceptor/transform.interceptor'
import { AuthGuard } from './guard/auth.guard';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  //异常过滤器,可以控制精确的控制流以及将响应的内容发送回客户端。
  app.useGlobalFilters(new HttpExceptionFilter());
  //jwt权限认证
  app.useGlobalGuards(new AuthGuard())
  //管道参数验证
  app.useGlobalPipes(new ValidationPipe());
  //响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  //开启swagger接口文档的
  setupSwagger(app);
  //开启跨域
  app.enableCors();
  await app.listen(3001, () => {
    Logger.log(`API服务已经启动,服务请访问:http://localhost:3001`);
    Logger.log(`WebSocket服务已经启动,服务请访问:http://localhost:3002`);
    Logger.log(`swagger已经启动,服务请访问:http://localhost:3001/apiSwagger`);
  });
}
bootstrap();
