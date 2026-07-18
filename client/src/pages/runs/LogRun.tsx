import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { storeRun } from '../../api/runs'
import type { RunForm } from '../../types'

const LogRun = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RunForm>({
    distance_km: 0,
    duration_seconds: 0,
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    try {
          const newRun = await storeRun(formData)
                        navigate('/runs')
      // call storeRun, navigate to /runs on success
    } catch (error: any) {
      setErrors(error.response?.data?.errors ?? {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Log Run</h1>
      <form onSubmit={handleSubmit}>
             <input
                    name="distance_km"
                    type="number"
                    value={formData.distance_km}
                    onChange={handleChange}
                />
            <input
                    name="duration_seconds"
                    type="number"
                    value={formData.duration_seconds}
                    onChange={handleChange}
                />
            <input
                    name="notes"
                    type="text"
                    value={formData.notes}
                    onChange={handleChange}
            />
             <button type="submit" disabled={loading}>
                    {loading ? 'Submitting Run...' : 'Submit Run'}
            </button>

        
      </form>
    </div>
  )
}

export default LogRun