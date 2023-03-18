import express from 'express'
let routes = express.Router();


routes.get('/',async function(req, res){
    let { server } = req.query;
    try {
        // res.send('510|15|16|3|0|0')
        res.send('100')
    } catch (error) {
        console.log(error)
        res.send("sql error")
    }
});

export default routes;
