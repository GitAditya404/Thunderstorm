import type { server } from "typescript"
import { WebSocketServer } from "ws"
import { sendStats } from "./services/loadTester"

const websocket = (httpServer : any  ) => {

const wss = new WebSocketServer({server : httpServer})  // attaching websocket server to same http server

interface LiveData{
    total : number;
    success : number ;
    failure : number;
}

interface header {
    name : string;
    value : string;
}

wss.on("connection",(socket) => {

        console.log("user Connected")

        socket.on("message",async (msg) => {
            const parsedMsg = JSON.parse(msg.toString())
            // console.log(parsedMsg)
            if(parsedMsg.type == "sendStats"){

                const url : string = parsedMsg.payload.url 
                const concurrent : number = Number(parsedMsg.payload.concurrent) 
                const duration : number = Number(parsedMsg.payload.duration)
                const method : string = parsedMsg.payload.method
                const header : header[]  = parsedMsg.payload.header
                
                let latestStats : LiveData = { 
                    total : 0,
                    success : 0,
                    failure : 0
                }

                const intervalId = setInterval(() => {

                    socket.send(JSON.stringify({
                        type: "liveStats",
                        payload : latestStats
                    }))
                },1000)

                const finalMetrics = await sendStats(url,
                    concurrent,
                    duration,
                    method,
                    header,
                    (stats ) => {
                        latestStats = stats
                    }
                )

                clearInterval(intervalId)

                socket.send(JSON.stringify({
                    type : 'liveStats',
                    payload : latestStats
                }))

                socket.send(JSON.stringify({
                    type: "finalStats",
                    payload : finalMetrics 
                }))
                
            }
        })
    })
}

export default websocket