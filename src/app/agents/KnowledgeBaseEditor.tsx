import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Clock, Book, Plus } from "lucide-react";
import { useState } from "react";
import {
  KnowledgeBaseArticle,
  KnowledgeBaseDBArticle,
} from "@/agentBuilder/types";

interface KnowledgeBaseEditorProps {
  onArticleChange: (article: KnowledgeBaseArticle) => void;
  pendingArticles: KnowledgeBaseArticle[];
  existingArticles: KnowledgeBaseDBArticle[];
  isLoading?: boolean;
}

export function KnowledgeBaseEditor({
  onArticleChange,
  pendingArticles = [],
  existingArticles = [],
  isLoading = false,
}: KnowledgeBaseEditorProps) {
  const [open, setOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isExistingOpen, setIsExistingOpen] = useState(false);

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
        <div className="flex items-center space-x-4 px-4 py-2 rounded-md hover:bg-muted">
          <CollapsibleTrigger className="flex items-center space-x-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Icon className="h-4 w-4" />
            <span className="font-medium">
              {title} ({articles.length})
            </span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="px-8 py-2 space-y-2">
          {articles.map((article, index) => (
            <div
              key={"id" in article ? article.id : index}
              className="text-sm border rounded-md p-3 hover:bg-muted"
            >
              <h4 className="font-medium">{article.title}</h4>
              {article.content && (
                <p className="text-muted-foreground line-clamp-2 text-xs mt-1">
                  {article.content}
                </p>
              )}
              {article.updatedAt && (
                <p className="text-muted-foreground text-xs mt-1">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const hasArticles = pendingArticles.length > 0 || existingArticles.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add Entry
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    required
                    value={article.title}
                    onChange={(e) =>
                      setArticle((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter a title for this knowledge base article"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
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
                    className="min-h-[200px]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Article</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading knowledge base...
        </div>
      ) : hasArticles ? (
        <div className="space-y-2 mt-4">
          <ArticleList
            articles={pendingArticles}
            icon={Clock}
            isOpen={isPendingOpen}
            onOpenChange={setIsPendingOpen}
            title="Pending Save"
          />
          <ArticleList
            articles={existingArticles}
            icon={Book}
            isOpen={isExistingOpen}
            onOpenChange={setIsExistingOpen}
            title="Existing Items"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No articles added yet. Click the button above to add your first
          article.
        </p>
      )}
    </div>
  );
}
