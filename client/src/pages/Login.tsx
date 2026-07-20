import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'
import logo  from '../assets/pacerlogo.png'
import loginBg from '../assets/login-bg2.jpg'


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
       <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Panel */}
         <div style={{ backgroundImage: `url(${loginBg})` }} className="md:w-3/4 bg-cover bg-right">
        
        </div> 

        {/* Right Panel */}
        <div className="md:w-1/2 bg-cream flex flex-col items-center justify-center">
               <img src={logo} alt="Pacer" className="w-full max-w-sm h-auto rounded-md object-cover mb-4" />
                
                <p className="font-body text-md text-racing-green/80 text-center mb-6">
                    Ready to Run? Welcome back.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
                        <div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full font-body border border-racing-green/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-racing-green"
                            />
                            {errors.email && <p className="text-racing-red text-sm mt-1"> {errors.email[0]}</p>}
                        </div>

                        <div>
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full font-body border border-racing-green/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-racing-green"
                            />
                            {errors.password && <p className="text-racing-red text-sm mt-1"> {errors.password[0]}</p>}
                        </div>

                        <button
                                type="submit"
                                disabled={loading}
                                className="bg-racing-green text-cream font-body font-medium rounded-lg py-2 mt-2 hover:bg-racing-green/90 disabled:opacity-50 transition-colors"
                        >

                        {loading ? 'Logging in...' : 'Login'}
                        
                        </button>
                </form>
            </div>
       </div>
    )


}

export default Login

