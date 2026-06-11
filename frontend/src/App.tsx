import axios from 'axios'
import { useEffect, useState } from 'react'


function App() {

  const [data,setData] = useState("")
  
  async function getData(){
    const response = await axios.get('http://localhost:8080/hello')
    setData(response.data)
  }

  useEffect(()=> {
    getData()
  },[])

  return (
    <>
      <p>TotalRequest{data}</p>
      <p>Success</p>
      <p>Failure</p>

    </>
  )
}

export default App
