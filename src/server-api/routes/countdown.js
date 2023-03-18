import express from 'express'
import write from 'write'
import { Server } from '../../models/index.js'
let routes = express.Router();


routes.get('/', async (req, res) => {
    let { time: currenttime, server } = req.query;
    try {
        if (server != null && currenttime != null) {
            
            const timerFile = `../timers/${server}.timer`;
            let timeDict = {
                "120":["300|115",5],
                "115":["300|110",5],
                "110":["300|105",5],
                "105":["300|100",5],
                "100":["300|95",5],
                "95":["300|90",5],
                "90":["300|85",5],
                "85":["300|80",5],
                "80":["300|75",5],
                "75":["300|70",5],
                "70":["300|65",5],
                "65":["300|60",5],
                "60":["300|55",5],
                "55":["300|50",5],
                "50":["300|45",5],
                "45":["300|40",5],
                "40":["300|35",5],
                "35":["300|30",5],
                "30":["300|25",5],
                "25":["300|20",5],
                "20":["300|15",5],
                "15":["300|10",5],
                "10":["300|9",1],
                "9":["300|8",1],
                "8":["300|7",1],
                "7":["300|6",1],
                "6":["300|5",1],
                "5":["300|4",1],
                "4":["300|3",1],
                "3":["300|2",1],
                "2":["300|1",1],
                "1":["300|0",1],
            }
            if(currenttime !="matchsoon"){
                setTimeout(()=>{
                    res.send(timeDict[currenttime][0])
                    const result = timeDict[currenttime][0].split("|")[1]
                    if(result != "0"){
                        write.sync(timerFile, result, { overwrite: true });
                    }else {
                        // MATCH BEGAN
                        write.sync(timerFile, "matchstarted", { overwrite: true });
                    }
                },timeDict[currenttime][1]*1000)
            }else{
                let result = await Server.findOne({lobbyID:server})
                if(!result) throw new Error("no server!")
                const {map,faction1,faction2} = result
                res.send(`300|120|${map}|${faction1}|${faction2}`)
            }
        }

    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes;
