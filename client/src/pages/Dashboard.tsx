import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getRuns } from '../api/runs'
import type { Run } from '../types'


const Dashboard = () => {
    const { user } = useAuth()
    const { data: runs, isLoading, isError } = useQuery({
        queryKey: ['runs'],
        queryFn: getRuns,
    })

    if (isLoading) return <div> Loading...</div>
    if (isError) return <div> Something went wrong </div>

    return (
        <div> 
            <h1> Welcome back, {user?.name} </h1>

            <section>
                <h2> Recent Runs </h2>
                {runs?.length === 0 && <p> No runs yet, get out there</p>}
                {runs?.slice(0,5).map((run: Run) => (
                    <div key={run.id}>
                        <p> {run.distance_km} KM </p>
                        <p> {run.duration_seconds} seconds </p>
                    </div>
               ))}
            </section>
        </div>
    )
}

export default Dashboard