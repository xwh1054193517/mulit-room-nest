//把房主 放到 第一位
export const formatUser = (onlineUserInfo = {}, id) => {
  const keys = Object.keys(onlineUserInfo);
  if (!keys.length) return [];
  let userInfo = Object.values(onlineUserInfo);
  let admin = null;
  const adminIndex = userInfo.findIndex((k: any) => k.id === id);
  adminIndex != -1 && (admin = userInfo.splice(adminIndex, 1));
  adminIndex != -1 && (userInfo = [...admin, ...userInfo]);
  return userInfo;
};

//把调整 房间顺序 把主房间 放到第一
export const formatRoomlist = (roomListMap) => {
  const keys = Object.keys(roomListMap);
  if (!keys.length) return [];
  //找出不是主房间的房间id
  const roomIds = Object.keys(roomListMap).filter((key) => Number(key) !== 555);
  const adminRoom = roomListMap[555];
  let roomList = [];
  roomIds.forEach((roomId) =>
    roomList.push(getBasicRoomInfo(roomListMap[roomId])),
  );
  adminRoom && (roomList = [getBasicRoomInfo(adminRoom), ...roomList]);
  return roomList;
};

//获得房间的基本信息 
export const getBasicRoomInfo = (roomDetailInfo) => {
  const { room_admin, online_user_list, room_info } = roomDetailInfo;
  return Object.assign(room_info, {
    on_line_nums: online_user_list.length,
    room_user_nickname: room_admin.user_nickname,
  });
};


//传入上次时间就则计算时间与现在的差值,不传则返回当前时间 秒为单位
export const getTimeSpace = (last = 0) => {
  const now = Math.round(new Date().getTime() / 1000);
  return last ? now - last : now;
};

import * as jwt from 'jsonwebtoken'
import { secretkey } from '../config/jwt'
// 解析jwt  token
export function verfiyJwt(token, secret: string = secretkey): Promise<any> {
  return new Promise((resolve) => {
    jwt.verify(token, secret, (error, payload) => {
      if (error) {
        resolve({ user_id: -1 })
      } else {
        resolve(payload)
      }
    })
  })
}