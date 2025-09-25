export interface JwtUser {
  userId: string;
  email: string;
  name: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface ResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}
