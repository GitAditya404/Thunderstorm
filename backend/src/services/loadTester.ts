import axios from "axios"

interface testResult {
    success : boolean;
    latency : number;
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

         const result = await makeRequest(url) //  request -> wait -> request -> wait    until time complete
         results.push(result)
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

function collectMetrices(results : testResult[]){

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
}

const url : string = "https://blazedemo.com/" 
const results : testResult[] = await loadInitiator(url, 5 , 2)
collectMetrices(results)
console.log(results)


