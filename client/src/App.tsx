
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import RunsList from './pages/runs/RunsList'
import RunDetail from './pages/runs/RunDetail'
import LogRun from './pages/runs/LogRun'
import Dashboard from './pages/Dashboard'


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={< Login />} />
      <Route path="/register" element ={< Register />} />

      <Route path="/" element = {
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } 
      />

      {/* Run Routes */}
      <Route path="/runs" element = {
        <ProtectedRoute>
          <RunsList />
        </ProtectedRoute>
      }
      />

      <Route path="/runs/log" element ={
        <ProtectedRoute>
          <LogRun />
        </ProtectedRoute>
      }
      />
    <Route path="/runs/:id" element ={
      <ProtectedRoute>
        <RunDetail />
      </ProtectedRoute>
    }
      />
    </Routes>
  )
}

export default App