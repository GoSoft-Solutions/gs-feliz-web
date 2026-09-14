export enum AdminRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
}

export interface AdminSession {
  userId: string;
  username: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  exp: number;
}

export const AUTH_USER = 'AUTH_USER';
