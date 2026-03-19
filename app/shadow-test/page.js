"use client"

import { useState } from "react"

export default function ShadowTest() {

  const [data,setData] = useState(null)

  async function generate() {

    const res = await fetch("/api/precision-shadow-drill",{
      method:"POST"
    })

    const json = await res.json()

    setData(json)
  }

  return (
    <div style={{padding:40}}>

      <button onClick={generate}>
        Generate Shadow Drill
      </button>

      <pre>
        {JSON.stringify(data,null,2)}
      </pre>

    </div>
  )
}