import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const { blockchainId, name, symbol, lowThreshold, highThreshold, notifications } = await req.json();
    const { blockchainId, name, symbol, alertMode, targetPrice, logo,priceWhenAlertSet } = await req.json();

    const client = await clientPromise;
    const db = client.db("blockpulse");

    // Check if the blockchain exists in the user's watchlist
    const existingBlockchain = await db.collection("thresholds").findOne({
      userId: session.user.id,
      blockchainId,
    });

    if (!existingBlockchain) {
      return NextResponse.json(
        { error: "Blockchain not found in price alerts" },
        { status: 404 }
      );
    }

    // Update the blockchain details in the watchlist
    const result = await db.collection("thresholds").updateOne(
      { userId: session.user.id, blockchainId },
      {
        $set: {
          name,
          symbol,
          alertMode,
          targetPrice,
          priceWhenAlertSet,
          logo,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update blockchain" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Blockchain updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating blockchain price alert:", error);
    return NextResponse.json(
      { error: "Couldn’t update price alert for this blockchain." },
      { status: 500 }
    );
  }
}
