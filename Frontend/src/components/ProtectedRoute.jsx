import React from 'react'
import { Navigate } from "react-router-dom";
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
    const user = useSelector((state) => state.auth.user);
    if (!user) 
    {
        return <Navigate to="/login" replace />; // replace prop replaces the current entry in the history stack. So, the user can’t go back to the protected page using the back button.
    }
    return children;
}

export default ProtectedRoute
