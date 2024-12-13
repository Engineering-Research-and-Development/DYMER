import { useAuth } from "../contexts/authContext";
import { Navigate, Outlet } from 'react-router-dom';

export default function RoutesGuard() {
    const { loggedIn } = useAuth();

    if (!loggedIn) return <Navigate to="/login" />

    return <Outlet />;
}

