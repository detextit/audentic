import { createKnowledgeBaseArticle, getAgentKnowledgeBase } from "@/db";
import { useAuth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return new NextResponse("Agent ID is required", { status: 400 });
    }

    const articles = await getAgentKnowledgeBase(agentId);
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching knowledge base articles:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { agentId, title, content } = await request.json();
    const article = await createKnowledgeBaseArticle(agentId, {
      title,
      content,
      metadata: { type: "text" },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error creating knowledge base article:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
