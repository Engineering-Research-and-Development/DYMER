export interface DymerUser {
  _id?: string;
  username: string;
  password: string;
  active: Boolean,
  email: string;
  roles: Role[];
  salt?: string;
  __v?: number
}

interface Role {
  role: string;
}

export interface JSONResponse {
  success: string;
  message: string;
  data: DymerUser[];
  extraData: Record<string, any>
}
