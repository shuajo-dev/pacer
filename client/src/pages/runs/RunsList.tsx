import { useQuery } from '@tanstack/react-query'
import { getRuns } from '../../api/runs'
import type { Run } from '../../types'

const RunsList = () => {
  const { data: runs, isLoading, isError } = useQuery({
    queryKey: ['runs'],
    queryFn: getRuns,
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Something went wrong</div>

  return (
    <div>
      <h1>My Runs</h1>
      {runs?.map((run: Run) => (
        <div key={run.id}>
          <p>{run.distance_km} km</p>
          <p>{run.duration_seconds} seconds</p>
          <p>{run.notes}</p>
        </div>
      ))}
    </div>
  )
}

export default RunsList