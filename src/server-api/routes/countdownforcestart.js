import express from 'express'
import write from 'write'
let routes = express.Router();

//force game start
routes.get('/', async (req, res) => {
    let { time: currenttime, server } = req.query;
    try {
        if (server != null && currenttime != null) {
            server = server.slice(5)
            const timerFile = `../timers/${server}.timer`;
            let timeDict = {
                "start":["300|10",1],
                "9":["300|9",1],
                "8":["300|8",1],
                "7":["300|7",1],
                "6":["300|6",1],
                "5":["300|5",1],
                "4":["300|4",1],
                "3":["300|3",1],
                "2":["300|2",1],
                "1":["300|1",1],
                "0":["300|0",1],
            }
            setTimeout(()=>{
                res.send(timeDict[currenttime][0])
                const result = timeDict[currenttime][0].split("|")[1]
                if(currenttime != "0"){
                    write.sync(timerFile, result, { overwrite: true });
                }else {
                    write.sync(timerFile, "matchstarted", { overwrite: true });
                }
            },timeDict[currenttime][1]*1000)
            // SECOND SET BEGINS
        }

    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes;
