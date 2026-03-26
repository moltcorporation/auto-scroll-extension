import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || user.subscriptionStatus !== "active") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id));

  return NextResponse.json({
    hotkeys: settings?.hotkeys ?? {},
    presets: settings?.presets ?? [],
  });
}

export async function POST(req: NextRequest) {
  const { email, hotkeys, presets } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || user.subscriptionStatus !== "active") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id));

  if (existing) {
    await db
      .update(userSettings)
      .set({
        ...(hotkeys !== undefined && { hotkeys }),
        ...(presets !== undefined && { presets }),
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, user.id));
  } else {
    await db.insert(userSettings).values({
      userId: user.id,
      hotkeys: hotkeys ?? {},
      presets: presets ?? [],
    });
  }

  return NextResponse.json({ success: true });
}
