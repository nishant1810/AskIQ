import { useState } from 'react'
import {URL} from './constants';
// import './App.css'

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult]= useState(undefined);

  const payload={
    "contents": [{
    "parts": [{
            "text": "Explain how AI works"
          }]
      }]
  }

  const askQuestion=async()=>{
    let response=await fetch(URL,{
      method: 'POST',
      body: JSON.stringify(payload),
    })

    response=await response.json();
    setResult(response.candidates[0].content.parts[0].text);
  }
  
  return (
    <div className="grid grid-cols-5 h-screen text-center">
      <div className="col-span-1 bg-zinc-800 text-white ">
        <h1>Recent History</h1>
      </div>
      <div className="col-span-4 p-10">
        <div className="container h-130">
          <div className="text-white">
          {result}
          </div>
        </div>
        <div className="bg-zinc-800 w-1/2 text-white p-1 pr-5 m-auto rounded-4xl 
        border border-zinc-700 flex h-16 ">
          <input 
          type="text" value={question} onChange={(event)=> setQuestion(event.target.value)}
          className="w-full h-full p-3 bg-transparent text-white outline-none" 
          placeholder="Ask me Anything">
          </input>
          <button onClick={askQuestion} className="text-white p-3 rounded-md hover:bg-gray-800 transition">Ask</button>
        </div>
      </div>
    </div>
  )
}

export default App
