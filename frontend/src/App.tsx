import axios from 'axios'
import { useEffect, useState , useRef } from 'react'

function App() {

  interface liveData {
    total : number;
    success : number ; 
    failure : number ;
  }

  const [data,setData] = useState<liveData>({
    total : 0,
    success : 0, 
    failure : 0
  })

  const [url ,setUrl] = useState("")
  const [concurrent , setConcurrent] = useState('')
  const [duration , setDuration] = useState('')
  
  const wsRef = useRef<WebSocket | null>(null)

  async function clickHandler(){
    wsRef.current!.send(JSON.stringify({
      type : "sendStats",
      payload : {
        url : url,
        concurrent : concurrent,
        duration : duration
      }
    }))
  }

  useEffect(()=> {
    const socket = new WebSocket('ws://localhost:8080')
    wsRef.current = socket
    socket.onopen = () => {
      console.log("Websocket connection is now Ready")
    }

    wsRef.current.onmessage = (event) => {
      const parsedMsg = JSON.parse(event.data)
      setData(parsedMsg.payload)
    }
    
  },[])

  return (
    <>
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
      <p>TotalRequest{data.total}</p>
      <p>Success{data.success}</p>
      <p>Failure{data.failure}</p>
      <button onClick={clickHandler}>Start</button>

    </>
  )
}

export default App
