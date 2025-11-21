import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);

    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: limit,
        page,
        searchTerm,
      },
    });

    const data = response.data;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blockchain data:", error);
    return NextResponse.json({ error: "Failed to fetch blockchain data" }, { status: 500 });
  }
}
