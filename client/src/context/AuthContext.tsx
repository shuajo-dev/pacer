import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/index';

interface AuthContextType {
    user: User | null;
    login: (userData: User, token: string) => void;
    logout: () => void;

}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children } : {children: ReactNode}) => {

    const [user, setUser] = useState<User | null>(null);

    const login = (userData:User , token: string): void => {
        localStorage.setItem('auth_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value ={{ user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );  
};

export const useAuth = () => useContext(AuthContext);