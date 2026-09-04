import { SignJWT, jwtVerify } from "jose";

const secretValue = process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET;

if (!secretValue) {
  throw new Error("JWT_SECRET ou ADMIN_SESSION_SECRET deve estar configurado.");
}

const secret = new TextEncoder().encode(secretValue);

export async function signJwt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
