import express from 'express'
let routes = express.Router();


routes.get('/', async (req, res) => {
    let { time: currenttime, server } = req.query;
    try {
        if (server != null && currenttime != null) {
            server = server.slice(5)
            let timeDict = {
                "start":["301|30",5],
                "30":["301|25",5],
                "25":["301|20",5],
                "20":["301|15",5],
                "15":["301|10",5],
                "10":["301|9",1],
                "9":["301|8",1],
                "8":["301|7",1],
                "7":["301|6",1],
                "6":["301|5",1],
                "5":["301|4",1],
                "4":["301|3",1],
                "3":["301|2",1],
                "2":["301|1",1],
                "1":["301|0",1],
            }
            setTimeout(()=>{
                res.send(timeDict[currenttime][0])
            },timeDict[currenttime][1]*1000)
            // SECOND SET BEGINS
        }

    } catch (error) {
        res.send("sql error:" + error)
    }
});



export default routes;
