import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secretKey = () =>
    new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

const COOKIE_NAME = "taha_session";

export type SessionPayload = {
    userId: string;
    role: "SUPERADMIN" | "DIVISION_HEAD" | "STAFF";
    divisionId: string | null;
    fullName: string;
    username: string;
};

export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
    cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
          const { payload } = await jwtVerify(token, secretKey());
          return payload as unknown as SessionPayload;
    } catch {
          return null;
    }
}

export async function requireUser() {
    const session = await getSession();
    if (!session) return null;
    const user = await prisma.user.findUnique({
          where: { id: session.userId },
          include: { division: true },
    });
    return user;
}
