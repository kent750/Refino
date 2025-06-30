import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Palette, ArrowLeft, Search, Filter, Grid, List, Bookmark, Trash2, ExternalLink } from "lucide-react";
import { useReferences } from "@/hooks/useReferences";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCopyReference } from "@/hooks/useReferences";

export default function Collections() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data: referencesData, isLoading, refetch } = useReferences({
    query: searchQuery || undefined,
    source: selectedSource === "all" ? undefined : selectedSource,
    limit: 50,
    offset: 0
  });
  
  const { toast } = useToast();
  const copyReference = useCopyReference();

  const references = referencesData?.references || [];
  const sources = ["all", ...Array.from(new Set(references.map(r => r.source)))];

  const handleDelete = async (id: number) => {
    if (!confirm("このリファレンスを削除しますか？")) return;
    
    try {
      await apiRequest("DELETE", `/api/references/${id}`);
      await refetch();
      toast({
        title: "削除完了",
        description: "リファレンスを削除しました",
      });
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (reference: any) => {
    try {
      await copyReference.mutateAsync(reference.id);
      toast({
        title: "コピー完了",
        description: "リファレンス情報をクリップボードにコピーしました",
      });
    } catch (error) {
      toast({
        title: "コピーエラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            </Link>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Palette className="text-primary-foreground w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground">コレクション管理</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="リファレンスを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">すべてのソース</option>
              {sources.filter(s => s !== "all").map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {references.length}件のリファレンス
            </p>
            <Link href="/">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                ギャラリービューで見る
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* References List/Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">読み込み中...</div>
          </div>
        ) : references.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchQuery ? "検索結果が見つかりません" : "まだリファレンスがありません"}
            </div>
            <Link href="/">
              <Button>
                リファレンスを追加
              </Button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {references.map((reference) => (
              <Card key={reference.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-1">
                        {reference.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {reference.description || "説明なし"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(reference)}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reference.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary">{reference.source}</Badge>
                    {reference.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {reference.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{reference.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    追加日: {new Date(reference.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {references.map((reference) => (
              <Card key={reference.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {reference.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {reference.description || "説明なし"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{reference.source}</Badge>
                        {reference.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {reference.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{reference.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(reference.createdAt).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(reference)}
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reference.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}