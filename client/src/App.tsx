
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={< Login />} />
      <Route path="/register" element ={< Register />} />

      <Route path="/" element = {
        <ProtectedRoute>
          <div> Dashboard </div>
        </ProtectedRoute>
      } 
      />
    </Routes>
  )
}

export default App