import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association from Warpcast Developer Portal
    // accountAssociation: {
    //   header: "YOUR_HEADER_HERE",
    //   payload: "YOUR_PAYLOAD_HERE",
    //   signature: "YOUR_SIGNATURE_HERE"
    // },
    frame: {
      version: "1",
      name: "Battle Arena - NFT Fighter",
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/feed-image.png`,
      screenshotUrls: [],
      tags: ["game", "nft", "battle", "base", "web3"],
      primaryCategory: "game",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
