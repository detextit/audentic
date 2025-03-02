import { NextResponse } from "next/server";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Form API");

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch form: ${response.statusText}`);
    }

    const html = await response.text();

    // Validate that we got the expected data
    if (!html.includes("FB_PUBLIC_LOAD_DATA_")) {
      throw new Error("Invalid form data received");
    }

    return NextResponse.json({ html });
  } catch (error) {
    logger.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
