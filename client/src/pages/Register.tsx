import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/auth'
import logo from '../assets/pacerlogo.png'
import loginBg from '../assets/login-bg2.jpg'



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
        <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left Panel */}
            <div style={{backgroundImage: `url(${loginBg})`}} className="md:w-3/4 bg-cover">
            </div>

        {/* Right Panel */}
            <div className="md:w-1/2 bg-cream flex flex-col items-center justify-center">
                <img src={logo} alt="Pacer" className="w-full max-w-sm h-auto rounded-md object-cover mb-4"/>
                <p className="font-body text-md text-racing-green/80 text-center mb-6">
                    New here? Create your account.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
                        <div>
                            <input
                                name="name"
                                type="text"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full font-body border border-racing-green/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-racing-green"
                            />
                            
                            {errors.name && <p className="text-racing-red text-sm mt-1">{errors.name[0]}</p>}
                            
                        </div>

                        <div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full font-body border border-racing-green/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-racing-green"
                            />
                            {errors.email && <p className="text-racing-red text-sm mt-1">{errors.email[0]}</p>}
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
                            {errors.password && <p className="text-racing-red text-sm mt-1">{errors.password[0]}</p>}
                        </div>

                        <div>
                            <input
                                name="password_confirmation"
                                type="password"
                                placeholder="Confirm password"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                className="w-full font-body border border-racing-green/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-racing-green"
                            />
                        </div>

                        <button
                                type="submit"
                                disabled={loading}
                                className="bg-racing-green text-cream font-body font-medium rounded-lg py-2 mt-2 hover:bg-racing-green/90 disabled:opacity-50 transition-colors"
                        >

                        {loading ? 'Registering...' : 'Register'}
                        
                        </button>
                </form>

            </div>
        </div>
    )


}

export default Register

