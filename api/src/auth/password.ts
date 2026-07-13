import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 defaults to the Argon2id algorithm, as required by the spec.

export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  return verify(hashed, plain);
}
