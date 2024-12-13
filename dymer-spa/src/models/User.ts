export interface User {
    roles: Roles[];
    id: string;
    gid: number
    email: string;
    username: string
}

export interface UserCredentials {
    username: string;
    password: string;
}

interface Roles {
    role: string
}