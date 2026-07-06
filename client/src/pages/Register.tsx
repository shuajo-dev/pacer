import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/auth'



interface RegisterForm {
    name: string
    email: string
    password: string
    password_confirmation: string
}


const Register = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [ formData, setFormData] = useState<RegisterForm>({ name: '', email: '', password: '', password_confirmation: ''})
    const [ errors, setErrors ] = useState<Record<string,string[]>>({})
    const [ loading, setLoading ] = useState(false)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setFormData({ ...formData, [e.target.name]: e.target.value })

    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        setLoading(true)
        try{
            const data = await registerApi(formData)
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
            <h1> Register </h1>
            <form onSubmit={handleSubmit}>
                <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                />
                
                {errors.name && <p> {errors.name[0]} </p>}

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

                <input
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                />
                {errors.password && <p> {errors.password[0]}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    )


}

export default Register

