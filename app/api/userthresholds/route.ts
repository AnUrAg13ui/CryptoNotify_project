import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("blockpulse");

    // Fetch all blockchains in the user's watchlist
    const watchlist = await db
      .collection("thresholds")
      .find({ userId: session.user.id })
      .toArray();

    return NextResponse.json(watchlist, { status: 200 });
  } catch (error) {
    console.error("Get price alerts error:", error);
    return NextResponse.json(
      { error: "Error retrieving your price alerts." },
      { status: 500 }
    );
  }
}
