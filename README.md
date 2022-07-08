# MultiRoom多人聊天音乐房间项目后端 

## 技术栈
* nestjs：后端框架
* typescript：语言
* jwt(jsonwebtoken):身份认证
* typeorm：数据库操作 框架
* websocket：双工通信协议
  
## 项目启动
项目
* 项目采用了 orm 操作数据库,只需要在config文件夹中的db.ts设置数据库 以及在env中添加配置信息 就能自动建表（需要 手动创建数据库）
* 本项目采用qq音乐的官方接口，如果需要获取vip歌曲播放链接，需要在tools中的music.ts配置cookie
  ```js
  qqMusic.setCookie('xxx')

  //或者调用接口 configureCookie设置 cookie(每次启动服务都要重新设置)
  ```
* 项目运行：npm run start:dev 或者 npm run start
* 如果需要创建管理员角色，需要自行使用postman或者apifox调用Register接口，将user_role设置为admin

## 项目功能
### 用户
* 用户登录
* 用户注册
* 查看自己的用户信息
* 更新用户信息
  
### 音乐
* 搜索音乐（调用qq音乐接口,容易抽风)
* 快速搜索（只会搜索出少量，且耗时长）
* 日推歌曲（调用qq音乐接口）
* 根据mid获得播放链接（调用qq音乐接口，注意cookie)
* 收藏歌曲
* 查看收藏歌曲
* 移除收藏歌曲
* 查看热门推荐（管理员的收藏歌曲）
* Websocket(下一首，点歌，移除点歌)

### 聊天 
* 创建房间
* 查找房间信息
* 更新房间信息
* 查看聊天历史
* Websocket(发送信息，撤回信息，更新房间列表，更新用户列表)