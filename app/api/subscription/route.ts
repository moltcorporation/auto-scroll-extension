import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    return NextResponse.json({ status: "inactive" });
  }

  return NextResponse.json({
    status: user.subscriptionStatus,
    email: user.email,
  });
}
