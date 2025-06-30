import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReferenceCard from "./ReferenceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, Plus } from "lucide-react";
import type { Reference } from "@shared/schema";

interface GalleryViewProps {
  searchQuery: string;
  selectedTags: string[];
}

export default function GalleryView({ searchQuery, selectedTags }: GalleryViewProps) {
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useQuery<{ references: Reference[], total: number }>({
    queryKey: ["/api/references", searchQuery, selectedTags, sortBy, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());
      
      const response = await fetch(`/api/references?${params}`);
      if (!response.ok) throw new Error('Failed to fetch references');
      return response.json();
    },
  });

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="text-destructive mb-4">
          <h3 className="text-lg font-semibold">読み込みエラー</h3>
          <p>リファレンスの取得に失敗しました。ページを再読み込みしてください。</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Results Header */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-foreground">
              {isLoading ? "読み込み中..." : `${data?.total || 0}件のリファレンス`}
            </h3>
            <span className="text-muted-foreground text-sm">
              最終更新: 2時間前
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">新着順</SelectItem>
                <SelectItem value="popular">人気順</SelectItem>
                <SelectItem value="relevant">関連度順</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <LoadingSkeleton />
        ) : data?.references.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <h3 className="text-lg font-semibold">リファレンスが見つかりません</h3>
              <p>検索条件を変更するか、新しいリファレンスを追加してください。</p>
            </div>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              リファレンスを追加
            </Button>
          </div>
        ) : (
          <>
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {data?.references.map((reference) => (
                <ReferenceCard key={reference.id} reference={reference} />
              ))}
            </div>

            {/* Load More */}
            {data && data.references.length < data.total && (
              <div className="text-center mt-12">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={handleLoadMore}
                  className="px-8"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  さらに読み込む (残り{data.total - data.references.length - offset}件)
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
