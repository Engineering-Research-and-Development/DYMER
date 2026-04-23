export interface Permissions {
  _id?: string;
  role: string;
  perms: PermissionsEntries;
}

export interface PermissionsEntries {
  entities: PermissionActions;
  modules: PermissionActions;
}

export interface PermissionActions {
  view: string[];
  create: string[];
  edit: string[];
  delete: string[];
}
