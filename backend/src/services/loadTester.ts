import axios from "axios"
interface testResult {
    success : boolean;
    latency : number;
}

// let intervalId : NodeJS.Timeout;
interface LiveDataInterface {
    total : 0;
    success : 0;
    failure : 0;
}

type statsCallback = (stats : LiveDataInterface) => void ;

async function makeRequest(url : string ) : Promise<testResult> {

    const start = performance.now()
    try{
        await axios.get(url)
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

async function virtualUser (url : string,
    duration : number,
    results : testResult[],
    liveData : LiveDataInterface,
    onUpdate : statsCallback
)  {

    const endTime : number = Date.now() + duration * 1000 ; 

    while (Date.now() < endTime){

         const response = await makeRequest(url) //  request -> wait -> request -> wait    until time complete
         results.push(response)

        liveData.total++;
         
        if(response.success===true)
                liveData.success++;
         else
                liveData.failure++;

        onUpdate({...liveData}) // ...livedata means sending real copy so that if i change lateststats in websocket in future then , it will not affect liveData ; b/c spread operator creates different object in memory ; onUpdate(liveData) -> if you do this then both lateststats and liveData will point to the same object in memory 
         

    }
}

async function loadInitiator(url : string ,
    concurrent : number ,
    duration : number,
    liveData : LiveDataInterface,
    onUpdate : statsCallback
)  {

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
        users.push(virtualUser(url,
            duration,
            results,
            liveData ,
            onUpdate))
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

export async function sendStats(url : string ,
    concurrent : number ,
    duration : number,
    onUpdate : statsCallback
){

    const liveData : LiveDataInterface = {  // u cant make liveData global variable b/c then client A liveData will mix up with client B data
        total : 0,
        success : 0,
        failure : 0
    }

    const results : testResult[] = await loadInitiator(url,
        concurrent ,
        duration,
        liveData,
        onUpdate
    )
    
    console.log(results)
    // const data = collectMetrices(results , duration)
    console.log(liveData)

    return collectMetrices(results,duration)
}



