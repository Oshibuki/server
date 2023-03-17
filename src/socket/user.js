import {getRegionUsers} from "../database/getCurrentUsers.js"
import { User } from "../models/index.js"

const regionUsersCount = getRegionUsers()
export default async function (socket,io,user) {
    const {uid,region,username} = user
    const {connectionId} =  await User.findOne({uid})
    if(connectionId != socket.id){
        //下线其他客户端
        io.to(connectionId).emit("squeezeOut")
    }

    //广播玩家上线信息
    io.emit('chatMsg', {
        senderName: "Server",
        timeStamp: new Date().toLocaleTimeString(),
        message: `${region} - ${username} connected`
    })
    //玩家加入本地区的room聊天通信
    socket.join(region)
    await User.findOneAndUpdate({uid},{connectionId:socket.id})
    regionUsersCount[region]++


    //广播玩家发送在聊天频道的信息
    socket.on('chatMsg', (messageObj, cb) => {
        io.to(region).emit('chatMsg', {
            senderName: messageObj.senderName,
            senderRank: messageObj.senderRank,
            timeStamp: messageObj.timeStamp,
            message: messageObj.msg
        });
        cb()
    });
}
