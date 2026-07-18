import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getRun } from '../../api/runs'

const RunDetail = () => {
  const { id } = useParams()

  const { data: run, isLoading, isError } = useQuery({
    queryKey: ['runs', id],
    queryFn: () => getRun(Number(id)),
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Something went wrong</div>

  return (
    <div>
      <h1>Run Detail</h1>
      <p>{run?.distance_km} km</p>
      <p>{run?.duration_seconds} seconds</p>
      <p>{run?.notes}</p>
    </div>
  )
}

export default RunDetail