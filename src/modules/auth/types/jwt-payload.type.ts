export interface JwtPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: "user" | "admin";
}
