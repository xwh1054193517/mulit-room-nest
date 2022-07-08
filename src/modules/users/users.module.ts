import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt';
import { expires, secretkey } from 'src/config/jwt';
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.register({
      secret: secretkey,
      signOptions: { expiresIn: expires }
    })],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule { }
