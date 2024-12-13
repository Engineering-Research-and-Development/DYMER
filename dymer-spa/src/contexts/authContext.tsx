import { createContext, PropsWithChildren, useContext, useState } from "react";
import { useCookies } from "react-cookie";
import { User } from "../models/User";
import { useNavigate } from "react-router-dom";

interface IAuthContext {
    loggedUser?: User;
    token?: string;
    setUser: (user: User) => void;
    startSession: (token: string) => void;
    endSession: Function;
    loggedIn: boolean;
}

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const [cookies, setCookies, removeCookie] = useCookies([
        "COOKIE_SUPPORT",
        "DYM",
        "DYM_EXTRA",
        "DYMisi",
        "GUEST_LANGUAGE_ID",
        "dUserLogged",
        "d_uid",
        "g_uid",
        "ilmiocookie",
        "ilmiocookie2",
        "lll",
        "nodejscookie",
        "DYMER_USER" // TODO: l'ho aggiunto
    ]);
    const [token, setToken] = useState<string | undefined>(cookies["DYM"]);
    const [loggedUser, setLoggedUser] = useState<User | undefined>(cookies["DYMER_USER"]); // TODO: SERVE?
    const loggedIn = token !== undefined;

    const endSession = () => {
        removeCookie("DYM");
        removeCookie("DYMER_USER");
        setLoggedUser(undefined);
        setToken(undefined);
        navigate('/login');
    }

    const startSession = (token: string) => {
        setToken(token);
        setCookies("DYM", token);
        navigate('/dashboard');
    }

    const setUser = (user: User) => {
        setLoggedUser(user);
        setCookies("DYMER_USER", user);
    }

    return (
        <AuthContext.Provider value={{ loggedUser, setUser, token, startSession, endSession, loggedIn }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);