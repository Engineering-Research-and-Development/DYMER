// import { Button } from "react-bootstrap";
// import { ToastType, useToast } from "../contexts/toastContext";
// import { useAuth } from "../contexts/authContext";
import { useEffect } from "react";
import { Navigate, useLocation, useRoutes } from "react-router-dom";
import { ROUTES } from "./routes"

type Props = {}

export default function AppRouter() {
  const { pathname } = useLocation();
    // const { showToast } = useToast(); 
    //const { loggedIn, token, loggedUser, setUser} = useAuth();
    const loggedIn = false
    const token = false

    useEffect(()=> {
      if(token && !loggedIn) {

      }
    })

    if(pathname !== "/login" && !loggedIn) return <Navigate to="/login" />
    else if (pathname === "/login" && loggedIn) return <Navigate to="/" />;

    return useRoutes(ROUTES)
  }