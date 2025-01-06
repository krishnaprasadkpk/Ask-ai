import React, { createContext, useState } from "react";

export const AuthContext=createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: localStorage.getItem("access_token") || null,
        name: localStorage.getItem("name") || null,
    });

    const setAuthData = (token, name) => {
        localStorage.setItem("access_token",token);
        localStorage.setItem("name", name);
        setAuthState({token, name});
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("name");
        setAuthState({token: null, name: null});

    };

    return (
        <AuthContext.Provider value={{ authState, setAuthData, logout }}>
            {children}
        </AuthContext.Provider>
    )
}