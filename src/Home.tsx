import React from 'react'
import {Link} from 'react-router-dom'

export default function Home() {
  return (
    <div>Home
        <Link to="/sumArray">sumarray</Link> | 
        <Link to="/mazeCanvas">mazeCanvas</Link>
    </div>
  )
}
