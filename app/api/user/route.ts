import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("Unauthorized session:", session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    // console.log("Received data:", data);
    
    const { blockchainId, name, symbol,logo, targetPrice, alertMode,priceWhenAlertSet } = data;
      console.log(logo);
   
    if (!blockchainId || !logo || !name || !symbol || targetPrice === undefined || alertMode === undefined || priceWhenAlertSet=== undefined) {
      // console.log("Missing required fields:", { blockchainId, name, symbol, lowThreshold, highThreshold });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("blockpulse");
    
   
    const existingBlockchain = await db.collection("thresholds").findOne({
      userId: session.user.id,
      blockchainId: blockchainId,
    });

    if (existingBlockchain) {
      console.log("Blockchain already exists for user:", {
        userId: session.user.id,
        blockchainId,
        existing: existingBlockchain
      });
      return NextResponse.json(
        { error: "Price alert already set for this blockchain." },
        { status: 400 }
      );
    }

    const userdetails = await db.collection("users").findOne({
      email: session.user.email
    });

    // console.log("here are the user details : ",userdetails);

    // Add blockchain to watchlist
    const newEntry = {
      userId: session.user.id,
      blockchainId,
      email: userdetails.email,
      name,
      symbol,
      logo,
      targetPrice: Number(targetPrice),
      priceWhenAlertSet: Number(priceWhenAlertSet),
      alertMode,
      createdAt: new Date(),
    };
    // console.log("Attempting to insert:", newEntry);

    const result = await db.collection("thresholds").insertOne(newEntry);
    // console.log("Insert result:", result);

    return NextResponse.json(
      { 
        message: "Blockchain successfully added for price alerts.",
        data: result
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding blockchain to price alerts:", error);
    return NextResponse.json(
      { 
        error: "Error adding blockchain to price alerts.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db("blockpulse");
    const thresholds = await db
      .collection("thresholds")
      .find({ userId: session.user.id })
      .toArray();
      // console.log("Fetched thresholds:", thresholds);
    return NextResponse.json(thresholds);
  } catch (error) {
    console.error("Get thresholds error:", error);
    return NextResponse.json(
      { error: "Failed to fetch thresholds" },
      { status: 500 }
    );
  }
}