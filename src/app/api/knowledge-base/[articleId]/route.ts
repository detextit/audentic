import { deleteKnowledgeBaseArticle, updateKnowledgeBaseArticle } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updates = await _request.json();
    const { articleId } = await params;
    const article = await updateKnowledgeBaseArticle(articleId, updates);

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
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { articleId } = await params;
    const success = await deleteKnowledgeBaseArticle(articleId);

    if (!success) {
      return new NextResponse("Article not found", { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting knowledge base article:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
