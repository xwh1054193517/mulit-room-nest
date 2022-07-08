import { join } from 'path'
import { DataSourceOptions } from 'typeorm';

const devConfig: DataSourceOptions = {
  type: 'mysql',
  port: 3306,
  host: process.env.DBHOST_DEV,
  username: process.env.USERNAME_DEV,
  password: process.env.PASSWORD_DEV,
  database: process.env.DBNAME_DEV,
  // 匹配所有实体
  entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
  logging: false,
  //覆盖原有数据库
  synchronize: true
}

const proConfig: DataSourceOptions = {
  type: 'mysql',
  port: 3306,
  host: process.env.DBHOST_PRO,
  username: process.env.USERNAEM_PRO,
  password: process.env.PASSWORD_PRO,
  database: process.env.DBE_PRO,
  entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
  logging: false,
  synchronize: true,
};

const config: DataSourceOptions = process.env.NODE_ENV == 'production' ? proConfig : devConfig;
export default config;