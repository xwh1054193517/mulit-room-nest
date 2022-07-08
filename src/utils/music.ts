import { HttpException, HttpStatus } from '@nestjs/common';
const qqMusic = require('qq-music-api')

qqMusic.setCookie('xxx')
export const searchSong = async (param, page, pagesize) => {
  const songlist = []
  try {
    const res = await qqMusic.api('/search', { key: param, pageNo: page, pageSize: pagesize })
    res.list.forEach((item) => {
      const response: any = {}
      response.music_mid = item.songmid
      response.music_name = item.songname
      response.music_album = item.albumname
      response.music_albumPic = item.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid}.jpg` : item.albummid
      response.music_singer = item.singer[0].name
      response.music_duration = item.interval
      songlist.push(response)
    })
    return res
  } catch (error) {
    // console.log(error);

    throw new HttpException('服务器繁忙或无歌曲', HttpStatus.BAD_GATEWAY)
  }
}

//快速少量搜索
export const searchQuick = async (param) => {
  console.log(param);
  const ret = []
  let request = []
  try {
    const res = await qqMusic.api('/search/quick', { key: param })
    const songlist = res.song.itemlist
    songlist.forEach(k => {
      request.push(getMusicInfo(k.mid))
    });
    let p = await Promise.allSettled(request)
    p.forEach(k => {
      const temp = k['value']['music_info']
      delete temp.choose_user_id
      ret.push(temp)
    })
    return ret
  } catch (error) {
    // console.log(error);

    throw new HttpException('服务器繁忙或无歌曲', HttpStatus.BAD_GATEWAY)
  }
}

/*根据mid获取音乐详情
data.info是歌曲的公司和流派
data.track_info是歌曲的名字和mid
data.track_info.singer里有歌手的mid和姓名
data.track_info.album里有专辑的名字，发行时间已经mid
专辑图片
https://y.gtimg.cn/music/photo_new/T002R300x300M000${mid}.jpg

返回 歌曲mid，歌曲名，专辑mid,专辑名，歌手名 ,歌词
*/
export const getMusicInfo = async (mid) => {
  const music_info: any = {}
  try {
    const res = await qqMusic.api('/song', { songmid: mid })
    if (Object.keys(res.info).length == 0) {
      throw new Error('no song error')
    }
    music_info.music_mid = mid
    music_info.music_name = res.track_info.name
    music_info.music_albumPic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${res.track_info.album.mid}.jpg`
    music_info.music_album = res.track_info.album.name
    music_info.music_singer = res.track_info.singer[0].name
    music_info.music_duration = res.track_info.interval
    music_info.choose_user_id = null
    return { music_info }
  } catch (error) {
    throw new HttpException('没有找到歌曲', HttpStatus.BAD_REQUEST)
  }
}



//根据mid获取临时的播放地址和歌词
export const getMusicSRC = async (mid) => {
  try {
    let p1 = qqMusic.api('/song/urls', { id: mid })
    let p2 = qqMusic.api('/lyric', { songmid: mid })
    let p3 = qqMusic.api('/song/url', { id: mid, type: 'm4a' })
    let p = await Promise.allSettled([p1, p2, p3])
    // const res = await qqMusic.api('/song/urls', { id: mid })
    // const lyric = await qqMusic.api('/lyric', { songmid: mid })
    // const downloadurl = await qqMusic.api('/song/url', { id: mid, type: 'm4a' })
    p.forEach((item) => {
      if (item.status !== 'fulfilled') {
        throw new Error("");
      }
    })
    return { music_lrc: p[1]['value']['lyric'], music_src: p[0]['value'][`${mid}`], music_downloadSrc: p[2]['value'] }
  } catch (error) {
    console.log(error);
    throw new HttpException('没有找到或者无权获得播放链接(cookie)', HttpStatus.BAD_GATEWAY)

  }
}



/**
  @desc 拿取QQ音乐上的部分歌单中歌曲的信息 用于存入数据库 
*/
export const initMusicByApi = async ({ songList = 5 }) => {
  const music_list = []
  const res = await qqMusic.api('/recommend/playlist/u')
  res.list.forEach(item => {
    music_list.push(item.content_id)
  });
  const dbInfo: any = []
  const cacheMid = []
  if (songList > music_list.length) {
    throw new HttpException('没有这么多歌单数量', HttpStatus.BAD_REQUEST)
  }
  for (let i = 0; i < songList; i++) {
    const songlist = await qqMusic.api('/songlist', { id: music_list[i] })
    songlist.songlist.forEach(k => {
      const temp: any = {}
      temp.music_mid = k.songmid
      temp.music_name = k.songname
      temp.music_album = k.albumname
      temp.music_albumPic = k.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${k.albummid}.jpg` : k.albummid
      temp.music_singer = k.singer[0].name
      temp.music_duration = k.interval
      !cacheMid.includes(temp.music_mid) && dbInfo.push(temp)
      cacheMid.push(temp.music_mid)
    });
  }

  return dbInfo
}


export const recommend = async () => {
  try {
    const songlist = []
    const res = await qqMusic.api('/recommend/daily')
    res.songlist.forEach(item => {
      const response: any = {}
      response.music_mid = item.songmid
      response.music_name = item.songname
      response.music_album = item.albumname
      response.music_albumPic = item.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albummid}.jpg` : item.albummid
      response.music_singer = item.singer[0].name
      response.music_duration = item.interval
      songlist.push(response)
    });
    return { songlist }
  } catch (error) {
  }
}

export const configureCookie = async (cookie = null) => {
  if (cookie) {
    qqMusic.setCookie(cookie)
  }

  return qqMusic.cookie

}