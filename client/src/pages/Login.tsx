import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'


interface LoginForm {
    email: string
    password: string
}

const Login = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [ formData, setFormData] = useState<LoginForm>({ email: '', password: ''})
    const [ errors, setErrors ] = useState<Record<string,string[]>>({})
    const [ loading, setLoading ] = useState(false)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setFormData({ ...formData, [e.target.name]: e.target.value })

    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setLoading(true)
        try{
            const data = await loginApi(formData)
            login(data.user, data.token)
            navigate('/')
        }
        catch (error: any) {
            setErrors(error.response?.data?.errors ?? {})

        } finally {
            setLoading(false)
        }
    } 

    return ( 
        <div> 
            <h1> Login </h1>
            <form onSubmit={handleSubmit}>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                />

                {errors.email && <p> {errors.email[0]}</p>}

                <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <p> {errors.password[0]}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    )


}

export default Login

