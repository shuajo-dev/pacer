import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    const login = (userData, token) => {
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