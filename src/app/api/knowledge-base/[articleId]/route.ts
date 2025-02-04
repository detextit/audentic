import { updateKnowledgeBaseArticle, deleteKnowledgeBaseArticle } from "@/db";
import { useAuth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updates = await request.json();
    const article = await updateKnowledgeBaseArticle(params.articleId, updates);

    if (!article) {
      return new NextResponse("Article not found", { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating knowledge base article:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const success = await deleteKnowledgeBaseArticle(params.articleId);

    if (!success) {
      return new NextResponse("Article not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting knowledge base article:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
