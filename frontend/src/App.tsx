import axios from 'axios'
import { useEffect, useState , useRef } from 'react'

function App() {

  interface liveData {
    total : number;
    success : number ; 
    failure : number ;
  }

  interface finalStatsInterface {
    avgLatency : number;
    maxLatency : number ;  
    minLatency : number; 
    requestsPerSecond : number 

  }

  interface header{
    name : string ; 
    value : string ;
  }

  const [data,setData] = useState<liveData>({
    total : 0,
    success : 0, 
    failure : 0
  })

  const [finalData, setFinalData] = useState<finalStatsInterface | null> (null)  // it means either it will be of type finalstatsinterface or it will be null

  const [url ,setUrl] = useState("")
  const [concurrent , setConcurrent] = useState('')
  const [duration , setDuration] = useState('')
  const [method, setMethod] = useState('')

  const [header ,setHeader] = useState<header[]>([
    {name : "" , value : ""}
  ])

  const wsRef = useRef<WebSocket | null>(null)

  async function clickHandler(){
    wsRef.current!.send(JSON.stringify({
      type : "sendStats",
      payload : {
        url : url,
        concurrent : concurrent,
        duration : duration,
        method : method,
        header : header
      }
    }))
  }

  function addHeader (){
    setHeader(prev => [...prev, {name : "" , value : ""}])
  }

  useEffect(()=> {
    const socket = new WebSocket('ws://localhost:8080')
    wsRef.current = socket
    socket.onopen = () => {
      console.log("Websocket connection is now Ready")
    }

    wsRef.current.onmessage = (event) => {
      const parsedMsg = JSON.parse(event.data)
      if(parsedMsg.type === 'liveStats')
        setData(parsedMsg.payload)
      if(parsedMsg.type === 'finalStats')
        setFinalData(parsedMsg.payload)
    }
    
  },[])

  return (
    <>

      <label htmlFor="method">Request</label>
      <select className='border-2 bg-yellow-200' 
        value={method}
        onChange={(e) => setMethod(e.target.value) }
      >

        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>

      </select>

      <label htmlFor="">Webpage URL</label>
      <input 
      onChange={(e) => setUrl(e.target.value)}
      className='border-2' type="text" placeholder='url' />


      <p className=''>Enter No of Concurrent Users</p>
      <input 
      onChange={(e) => setConcurrent(e.target.value)} 
      className='inline border-2' type="number" placeholder='No of Users'/>

      <p>Duration of Test</p>
      <input 
      onChange={(e) => setDuration(e.target.value)}
      className='border-2' type="number" />

<div className="border-4 p-4">

  {header.map((ele, index) => (
    <div key={index} className="mb-2">

      <input
        type="text"
        placeholder="Header Name"
        className="border-2 mr-2"
        value={ele.name}
        onChange={(e) => {
          const updatedHeaders = [...header];
          updatedHeaders[index].name = e.target.value;
          setHeader(updatedHeaders);
        }}
      />

      <input
        type="text"
        placeholder="Header Value"
        className="border-2"
        value={ele.value}
        onChange={(e) => {
          const updatedHeaders = [...header];
          updatedHeaders[index].value = e.target.value;
          setHeader(updatedHeaders);
        }}
      />

    </div>
  ))}

  <button
    className="text-blue-700 font-semibold"
    onClick={addHeader}
  >
    Add New Header
  </button>

</div>


      <p>TotalRequest{data.total}</p>
      <p>Success{data.success}</p>
      <p>Failure{data.failure}</p>
      <p>Average Latency{finalData?.avgLatency || "--" }</p>
      <p>Max Latency{finalData?.maxLatency || "--"}</p>
      <p>Min Latency{finalData?.minLatency || "--"}</p>
      <p>RPS (Request Per Second ) {finalData?.requestsPerSecond || "--"}</p>
      <button className='border-2 rounded-xl bg-amber-500 p-3' onClick={clickHandler}>Start</button>

    </>
  )
}

export default App
