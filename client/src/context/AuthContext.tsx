import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { User } from '../types/index'
import { getUser } from '../api/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (userData: User, token: string) => void
    logout: () => void

}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children } : {children: ReactNode}) => {

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const login = (userData:User , token: string): void => {
        localStorage.setItem('auth_token', token)
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null)
    }

    useEffect(() => {

        const fetchUser = async () => {

            const userData = await getUser()
            setUser(userData)
            setLoading(false)
        }

        const token = localStorage.getItem('auth_token')
        if (token){
            fetchUser()
        }else{
            setLoading(false)
        }

        },[]
    )

    return (
        <AuthContext.Provider value ={{ user, loading, login, logout}}>
            {children}
        </AuthContext.Provider>
    )


    
}


export const useAuth = () => useContext(AuthContext);