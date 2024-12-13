import { User, UserCredentials } from "../models/User"
import { client } from "./axios"

const authUrl = window.__env.AUTH_URL;

interface LoginResponse {
    DYM: string,
    DYMisi: string,
    d_rl: string,
    d_lp: string,
    d_uid: string,
    d_appuid: string
    d_gid: string
}

export const Authentication = {
    login: (credentials: UserCredentials) => client.post<LoginResponse>(`${authUrl}/login`, credentials),
    // logout: () => client.post(`${authUrl}/logout`, {}),
    // getCurrentUser: () => client.get<User>(`${authUrl}/info`)   
}