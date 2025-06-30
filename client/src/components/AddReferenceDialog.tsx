import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Loader2 } from "lucide-react";

export default function AddReferenceDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URLが必要です",
        description: "追加したいサイトのURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        title: "無効なURL",
        description: "正しいURLを入力してください（例：https://example.com）",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/references", {
        url: url.trim(),
        useAI: true
      });
      
      const result = await response.json();
      
      toast({
        title: "リファレンスを追加しました",
        description: `「${result.title}」をコレクションに追加しました`,
      });
      
      setUrl("");
      setIsOpen(false);
      
      // Refresh the page to show new reference
      window.location.reload();
    } catch (error) {
      toast({
        title: "追加エラー",
        description: "リファレンスの追加に失敗しました。URLを確認してください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>手動追加</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>リファレンスを手動追加</DialogTitle>
          <DialogDescription>
            URLを入力すると、AIが自動でタイトル、説明、タグを生成します
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">サイトURL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              デザインリファレンスとして保存したいサイトのURLを入力してください
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || !url.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI分析中...
                </>
              ) : (
                "追加"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}