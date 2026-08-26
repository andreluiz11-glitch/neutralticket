import { NextResponse } from "next/server";

const COOKIE_NAME = "nt_session";

export async function POST() {
  const res = NextResponse.json({ message: "Sessão encerrada." });
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
  return res;
}
