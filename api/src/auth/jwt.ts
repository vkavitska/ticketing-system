import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AccessTokenPayload {
  userId: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresInSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === "string" || typeof decoded.userId !== "string") {
    throw new Error("Invalid token payload");
  }
  return { userId: decoded.userId };
}
