import { useState, useCallback } from "react";
import { KnowledgeBaseArticle, KnowledgeBaseDBArticle } from "@/types/agent";

export function useKnowledgeBase() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<KnowledgeBaseDBArticle[]>([]);

  const fetchArticles = useCallback(async (agentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/knowledge-base?agentId=${agentId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch articles");
      }

      const data = await response.json();
      setArticles(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createArticle = async (
    agentId: string,
    article: KnowledgeBaseArticle
  ): Promise<KnowledgeBaseDBArticle | null> => {
    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          title: article.title,
          content: article.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create article");
      }

      const articleDB = await response.json();
      setArticles((prev) => [...prev, articleDB]);
      return articleDB;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create article";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateArticle = async (
    articleId: string,
    updates: Partial<KnowledgeBaseArticle>
  ): Promise<KnowledgeBaseDBArticle | null> => {
    try {
      const response = await fetch(`/api/knowledge-base/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update article");
      }

      const updatedArticle = await response.json();
      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId ? updatedArticle : article
        )
      );
      return updatedArticle;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update article";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteArticle = async (articleId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/knowledge-base/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete article");
      }

      setArticles((prev) => prev.filter((article) => article.id !== articleId));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete article";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createArticles = async (
    agentId: string,
    articles: KnowledgeBaseArticle[]
  ): Promise<KnowledgeBaseDBArticle[]> => {
    const results = await Promise.all(
      articles.map((article) => createArticle(agentId, article))
    );
    return results.filter(
      (result): result is KnowledgeBaseDBArticle => result !== null
    );
  };

  return {
    articles,
    loading,
    error,
    fetchArticles,
    createArticle,
    createArticles,
    updateArticle,
    deleteArticle,
  };
}
