//搭建swagger接口自动生成
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const setSwagger = new DocumentBuilder()
  .setTitle('chatRoom Api')
  .setDescription('The chattingRoom API description')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

export function setupSwagger(app) {
  const document = SwaggerModule.createDocument(app, setSwagger);
  SwaggerModule.setup('/apiSwagger', app, document);
}
