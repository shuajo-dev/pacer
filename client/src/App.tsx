
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={< Login />} />
      <Route path="/register" element ={<div> Register page</div>} />
      <Route path="/" element ={<div> Dashboard </div>} />
    </Routes>
  )
}

export default App