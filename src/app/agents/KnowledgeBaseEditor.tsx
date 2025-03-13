import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Book,
  Plus,
  Trash2,
  FileText,
  Globe,
  PenLine,
} from "lucide-react";
import { useState } from "react";
import { KnowledgeBaseArticle, KnowledgeBaseDBArticle } from "@/types/agent";
import { cn } from "@/lib/utils";
import { createLogger } from "@/utils/logger";

const logger = createLogger("KB Editor");

interface KnowledgeBaseEditorProps {
  onArticleChange: (article: KnowledgeBaseArticle) => void;
  onDeleteArticle: (articleId: string) => void;
  pendingArticles: KnowledgeBaseArticle[];
  pendingDeletions: string[];
  existingArticles: KnowledgeBaseDBArticle[];
  isLoading?: boolean;
}

export function KnowledgeBaseEditor({
  onArticleChange,
  onDeleteArticle,
  pendingArticles = [],
  pendingDeletions = [],
  existingArticles = [],
  isLoading = false,
}: KnowledgeBaseEditorProps) {
  const [open, setOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isExistingOpen, setIsExistingOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<"manual" | "url" | "file">(
    "manual"
  );
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [article, setArticle] = useState<KnowledgeBaseArticle>({
    title: "",
    content: "",
  });

  const handleSubmit = () => {
    // Pass the article data to parent component
    onArticleChange(article);

    // Reset form and close dialog
    setArticle({ title: "", content: "" });
    setOpen(false);
  };

  const handleUrlSubmit = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/knowledge-base/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "url",
          content: url,
        }),
      });
      const data = await response.json();

      setArticle({
        title: data.title || url,
        content: data.content,
      });
      setInputMethod("manual"); // Switch back to manual mode to review
    } catch (error) {
      logger.error("Failed to fetch URL content:", error);
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("type", "file");
      formData.append("content", file);

      const response = await fetch("/api/knowledge-base/extract", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      setArticle({
        title: data.title || file.name,
        content: data.content,
      });
      setInputMethod("manual"); // Switch back to manual mode to review
    } catch (error) {
      logger.error("Failed to process file:", error);
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false);
    }
  };

  const ArticleList = ({
    articles,
    icon: Icon,
    isOpen,
    onOpenChange,
    title,
  }: {
    articles: (KnowledgeBaseArticle | KnowledgeBaseDBArticle)[];
    icon: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
  }) => {
    if (articles.length === 0) return null;

    return (
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
        <CollapsibleTrigger className="flex items-center w-full px-3 py-2 rounded-md hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-sm">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary">
              <Icon className="h-3 w-3" />
            </div>
            <span className="font-medium">
              {title}{" "}
              <span className="text-muted-foreground">({articles.length})</span>
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 pb-2">
          <div className="space-y-2 pl-9">
            {articles.map((article, index) => {
              const isExistingArticle = "id" in article;
              const isPendingDeletion =
                isExistingArticle &&
                pendingDeletions.includes(article.id || "");

              return (
                <div
                  key={isExistingArticle ? article.id : index}
                  className={cn(
                    "text-sm border border-border/40 rounded-md p-3 hover:bg-muted/30 transition-colors",
                    isPendingDeletion && "opacity-50 bg-muted/20 border-dashed"
                  )}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {article.title}
                      </h4>
                      {article.updatedAt && (
                        <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(article.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                      {article.content && (
                        <p className="text-muted-foreground line-clamp-2 text-xs mt-1.5 leading-relaxed">
                          {article.content}
                        </p>
                      )}
                    </div>
                    {isExistingArticle && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteArticle(article.id || "")}
                        className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const hasArticles = pendingArticles.length > 0 || existingArticles.length > 0;

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-9 border-dashed border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Knowledge</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add Knowledge Base Article</DialogTitle>
            <DialogDescription>
              Add information that the agent can reference when answering
              questions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4 bg-muted/20 p-1 rounded-md">
            <Button
              type="button"
              variant={inputMethod === "manual" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 flex-1 h-8",
                inputMethod === "manual" ? "" : "text-muted-foreground"
              )}
              onClick={() => setInputMethod("manual")}
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Manual</span>
            </Button>
            <Button
              type="button"
              variant={inputMethod === "url" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 flex-1 h-8",
                inputMethod === "url" ? "" : "text-muted-foreground"
              )}
              onClick={() => setInputMethod("url")}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>URL</span>
            </Button>
            <Button
              type="button"
              variant={inputMethod === "file" ? "default" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 flex-1 h-8",
                inputMethod === "file" ? "" : "text-muted-foreground"
              )}
              onClick={() => setInputMethod("file")}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>File</span>
            </Button>
          </div>

          {inputMethod === "url" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm">
                  URL
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to extract content from"
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUrlSubmit}
                    disabled={isProcessing}
                    className="h-9 px-3"
                  >
                    {isProcessing ? "Processing..." : "Extract"}
                  </Button>
                </div>
              </div>
            </div>
          ) : inputMethod === "file" ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm">
                  File
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx"
                  disabled={isProcessing}
                  className="h-9 text-sm"
                />
                {isProcessing && (
                  <div className="text-xs text-muted-foreground animate-pulse mt-2">
                    Processing file...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">
                    Title
                  </Label>
                  <Input
                    id="title"
                    required
                    value={article.title}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter a title for this knowledge base article"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm">
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    required
                    value={article.content}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Enter the content for this knowledge base article"
                    className="min-h-[200px] text-sm resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Add Article
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2 mt-2">
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin"></div>
          Loading knowledge base...
        </div>
      ) : hasArticles ? (
        <div className="space-y-1 mt-2 border rounded-md border-border/40 bg-muted/5 py-1">
          <ArticleList
            articles={existingArticles}
            icon={Book}
            isOpen={isExistingOpen}
            onOpenChange={setIsExistingOpen}
            title="Existing Items"
          />
          {pendingArticles.length > 0 && (
            <ArticleList
              articles={pendingArticles}
              icon={Clock}
              isOpen={isPendingOpen}
              onOpenChange={setIsPendingOpen}
              title="Pending Save"
            />
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center justify-center p-3 border border-dashed border-border/40 rounded-md bg-muted/5">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <span>
              No knowledge base articles added. Add your first article using the
              button above.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
