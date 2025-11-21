import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import axios from "axios";
import { ObjectId } from "mongodb";

const CRON_SECRET = process.env.NEXTAUTH_SECRET || "your-secure-token";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function POST(req: Request) {
  const token = req.headers.get("authorization");
  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("blockpulse");

  const alerts = await db.collection("thresholds").find({}).toArray();
  if (!alerts.length) {
    return NextResponse.json({ message: "No alerts to check." });
  }

  const uniqueTokens = Array.from(new Set(alerts.map((a) => a.blockchainId)));
  if (!uniqueTokens.length) {
    return NextResponse.json({ message: "No unique tokens found." });
  }
  const { data: prices } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price",
    {
      params: {
        ids: uniqueTokens.join(","),
        vs_currencies: "usd",
      },
    }
  );

  let notified = 0;

  for (const alert of alerts) {
    const currentPrice = prices[alert.blockchainId]?.usd;
    const targetPrice = parseFloat(alert.targetPrice);
    const priceWhenAlertSet = parseFloat(alert.priceWhenAlertSet);

    if (!currentPrice) continue;

    // Determine if the target price has been crossed
    const hasTargetBeenReached = checkIfTargetReached(
      priceWhenAlertSet,
      targetPrice,
      currentPrice
    );

    console.log(
      `Checking alert for ${alert.name}: current price is $${currentPrice}, target price is $${targetPrice}, price when set: $${priceWhenAlertSet}, target reached: ${hasTargetBeenReached}`
    );

    if (!hasTargetBeenReached) continue;

    const now = new Date();
    const lastSent = alert.updatedAt ? new Date(alert.updatedAt) : null;
    const hoursSinceLast = lastSent
      ? (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
      : Infinity;

    try {
      if (alert.alertMode === "once") {
        await sendEmail(alert, currentPrice);
        await db
          .collection("thresholds")
          .deleteOne({ _id: new ObjectId(alert._id) });
        notified++;
      } else if (alert.alertMode === "recurring" && hoursSinceLast >= 6) {
        await sendEmail(alert, currentPrice);
        await db
          .collection("thresholds")
          .updateOne(
            { _id: new ObjectId(alert._id) },
            { $set: { updatedAt: now } }
          );
        notified++;
      }
    } catch (error: any) {
      console.error(`Failed to send email to ${alert.email}:`, error);
      await db.collection("email_failures").insertOne({
        alertId: alert._id,
        email: alert.email,
        error: error.message || String(error),
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({
    message: `Processed ${alerts.length} alerts.`,
    notified,
  });
}

function checkIfTargetReached(
  priceWhenSet: number,
  targetPrice: number,
  currentPrice: number
): boolean {
  // If target price is higher than the price when alert was set,
  // we're watching for price to go UP (bullish alert)
  if (targetPrice > priceWhenSet) {
    return currentPrice >= targetPrice;
  }
  // If target price is lower than the price when alert was set,
  // we're watching for price to go DOWN (bearish alert)
  else if (targetPrice < priceWhenSet) {
    return currentPrice <= targetPrice;
  }
  // If target price equals the price when set (edge case),
  // check for exact match with some tolerance
  else {
    const tolerance = 0.01; // 1 cent tolerance
    return Math.abs(currentPrice - targetPrice) <= tolerance;
  }
}

async function sendEmail(alert: any, currentPrice: number) {
  const priceWhenSet = parseFloat(alert.priceWhenAlertSet);
  const targetPrice = parseFloat(alert.targetPrice);
  const isUpwardAlert = targetPrice > priceWhenSet;
  const priceDirection = isUpwardAlert ? "📈 Above" : "📉 Below";
  const alertType = isUpwardAlert ? "Bullish" : "Bearish";

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: alert.email,
    subject: `${priceDirection} ${alert.name} hit $${currentPrice}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">🚨 Crypto Price Alert - ${alertType}</h2>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${alert.logo}" alt="${
      alert.name
    }" width="60" style="border-radius: 10px;" />
          <h3 style="margin: 10px 0;">${
            alert.name
          } (${alert.symbol.toUpperCase()})</h3>
        </div>
        <p style="font-size: 16px; color: #444;">🎯 <b>Target Price:</b> <span style="color: ${
          isUpwardAlert ? "green" : "red"
        };">$${alert.targetPrice}</span></p>
        <p style="font-size: 16px; color: #444;">📊 <b>Current Price:</b> <span style="color: blue;">$${currentPrice}</span></p>
        <p style="font-size: 16px; color: #444;">📌 <b>Price When Alert Set:</b> <span style="color: #666;">$${
          alert.priceWhenAlertSet
        }</span></p>
        <p style="font-size: 16px; color: #444;">🔁 <b>Alert Mode:</b> ${
          alert.alertMode
        }</p>
        <div style="background-color: ${
          isUpwardAlert ? "#e8f5e8" : "#ffe8e8"
        }; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: ${
            isUpwardAlert ? "#2e7d32" : "#c62828"
          };">
            ${isUpwardAlert ? "🚀" : "📉"} Price has ${
      isUpwardAlert ? "risen above" : "fallen below"
    } your target of $${alert.targetPrice}!
          </p>
        </div>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 14px; color: #777; text-align: center;">
          You received this alert because you set a price threshold on 
          <b>CryptoNotify</b></a>.
        </p>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 10px;">
          If you don't need any more alerts for this coin, please delete or deactivate this alert through the 
          <a href="https://crypto-pulse-hack.vercel.app/" style="color: #777; text-decoration: underline;">CryptoNotify website</a>.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending mail:", error);
    throw error;
  }
}
