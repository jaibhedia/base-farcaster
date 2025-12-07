import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add your own account association from Warpcast Developer Portal
  "accountAssociation": {
    "header": "eyJmaWQiOjE1NzA0OTQsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg4ZTg3ODliM0ZjRDA3NkFBOTEzOGQwRThmNWY4ZTAwNkU5ODE0OTQ1In0",
    "payload": "eyJkb21haW4iOiJiYXNlLWZhcmNhc3Rlci1pb3RhLnZlcmNlbC5hcHAifQ",
    "signature": "KG/XdECJgEuK+EB6CQhxCMfBLHBXv64CNXFroW73SaIvaRVbkWPuZ02mm/OiqbnqtgFmxQsSp5U1mhpfgqO3TRs="
  },
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
