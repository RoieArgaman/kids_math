export type UserRole = "user" | "admin";

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
}
