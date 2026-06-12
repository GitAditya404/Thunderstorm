import axios from "axios"
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from "ws"

const app = express()
app.use(express.json())
app.use(cors())
const httpServer = app.listen(8080)

const wss = new WebSocketServer({server : httpServer})  // attaching websocket server to same http server

interface testResult {
    success : boolean;
    latency : number;
}

let intervalId : NodeJS.Timeout;

const liveData = {
    total : 0,
    success : 0,
    failure : 0
}

async function makeRequest(url : string ) : Promise<testResult> {

    const start = performance.now()
    try{
        const response = await axios.get(url)
        return {
            success : true,
            latency : performance.now() - start
        }
    }
    catch(err){
        return {
        success : false,
        latency : performance.now() - start
        }  
    }
}

async function virtualUser (url : string ,   duration : number, results : testResult[]) : Promise<void> {

    const endTime : number = Date.now() + duration * 1000 ; 

    while (Date.now() < endTime){

         const response = await makeRequest(url) //  request -> wait -> request -> wait    until time complete
         results.push(response)

         if(response){
            liveData.total++;
            if(response.success===true)
                liveData.success++;
            else
                liveData.failure++;
         }

    }
}

async function loadInitiator(url : string ,  concurrent : number , duration : number)  {

    const results : testResult [] = []  // it stores completed request results(Promise fulfilled) 
                                            //     [
                                            //   { success: true, latency: 120 },
                                            //   { success: true, latency: 150 },
                                            //   { success: false, latency: 500 }
                                            // ]
    const users : Promise<void>[] = []
                                            //  [
                                                //   Promise<pending>,
                                                //   Promise<pending>
                                                // ]
    for(let i = 0 ;i<concurrent ; i++){
        users.push(virtualUser(url,duration,results))
    }
    await Promise.all(users) // wait till all promises gets resolved/rejected in users array
    return results
}

function collectMetrices(results : testResult[] , duration : number){

    const totalRequest : number = results.length;
    let successRequest : number = 0;
    let failedRequest : number = 0;
    let latency : number [] = []
    for(let i= 0 ; i<totalRequest; i++){
        if(results[i]!.success === true)
            successRequest++;
        else
            failedRequest++;
        latency.push(results[i]!.latency)
    }

    const avgLatency = latency.reduce((a,b) => {
        return a+b;
    })/totalRequest;

    const maxLatency = Math.max(...latency) //...means -> Take every element from the array and pass them individually.
    const minLatency = Math.min(...latency)
    const requestsPerSecond = totalRequest/duration;
    return {
        totalRequest,successRequest,failedRequest,avgLatency, maxLatency , minLatency, requestsPerSecond
    }
}

async function sendStats(url : string , concurrent : number , duration : number){
    const results : testResult[] = await loadInitiator(url, concurrent , duration)
    console.log(results)
    clearInterval(intervalId)
    // const data = collectMetrices(results , duration)
}


//WEBSOCKET
wss.on("connection",(socket) => {
    console.log("user Connected")

    socket.on("message",(msg) => {
        const parsedMsg = JSON.parse(msg.toString())
        // console.log(parsedMsg)
        if(parsedMsg.type == "sendStats"){

            const url : string = parsedMsg.payload.url 
            const concurrent : number = Number(parsedMsg.payload.concurrent) 
            const duration : number = Number(parsedMsg.payload.duration)

            sendStats(url , concurrent , duration)
            console.log(url,concurrent,duration)

             intervalId = setInterval(() => {
                socket.send(JSON.stringify({
                    type: "stats",
                    payload : liveData
                }))
            },1000)
            
        }
    })
})
