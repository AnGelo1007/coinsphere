
import { getTickerData } from "@/services/crypto-service";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const data = await getTickerData();
    // If the service returns an empty array or null due to an error, 
    // we return an empty array to prevent the client from crashing.
    return NextResponse.json(data || []);
  } catch (error) {
    // This will catch any unexpected errors during the execution of getTickerData.
    console.error("API route error in /api/market-data:", error);
    // Return an empty array on error to ensure the frontend doesn't break.
    return NextResponse.json([]);
  }
}
