// function loadTest(url : string , concurrency : number , duration : number) {
//     for (int i = 0 ; i < )
// }
import axios from "axios"

let promises = []
async function makeRequest(url : string ){
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

for(let i = 0 ; i<100000 ; i++)
{
  promises.push( makeRequest("https://blazedemo.com/"))
  console.log(i)
}


const result = await Promise.all(promises)
console.log(result)
