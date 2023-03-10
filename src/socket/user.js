


export default async function (socket,io,user,currentUsers) {
    const {uid,region,username} = user
    if(currentUsers.has(uid)){
        //下线其他客户端
        socket.to(currentUsers.get(uid)).emit("squeezeOut")
    }

    //广播玩家上线信息
    io.emit('chatMsg', {
        senderName: "Server",
        timeStamp: new Date(),
        message: `${region} - ${username} connected`
    })
    //玩家加入本地区的room聊天通信
    let roomId = region
    socket.join(roomId)
    currentUsers.set(uid,socket.id)


    //广播玩家发送在聊天频道的信息
    socket.on('chatMsg', (messageObj, cb) => {
        io.to(roomId).emit('chatMsg', {
            senderName: messageObj.senderName,
            senderRank: messageObj.senderRank,
            timeStamp: messageObj.timeStamp,
            message: messageObj.msg
        });
        cb()
    });
}
