import { useState } from "react";
import { Link } from "wouter";
import SearchBar from "@/components/SearchBar";
import FilterSection from "@/components/FilterSection";
import GalleryView from "@/components/GalleryView";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Palette, Bot, Plus, FolderSync, Bookmark } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const { toast } = useToast();

  const handleStartScraping = async () => {
    setIsScrapingLoading(true);
    try {
      const response = await apiRequest("POST", "/api/scrape", {
        source: "all",
        limit: 10
      });
      
      const result = await response.json();
      
      toast({
        title: "AI自動収集完了",
        description: `${result.count}件の新しいリファレンスを収集しました`,
      });
    } catch (error) {
      toast({
        title: "収集エラー",
        description: "自動収集に失敗しました。しばらく後に再試行してください。",
        variant: "destructive",
      });
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const handleAddReference = async (url: string) => {
    try {
      const response = await apiRequest("POST", "/api/references", {
        url,
        useAI: true
      });
      
      const result = await response.json();
      
      toast({
        title: "リファレンス追加完了",
        description: `「${result.title}」をAI分析付きで追加しました`,
      });
    } catch (error) {
      toast({
        title: "追加エラー",
        description: "リファレンスの追加に失敗しました。URLを確認してください。",
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Palette className="text-primary-foreground w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground">DesignRef AI</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              ダッシュボード
            </Link>
            <Link href="/collections" className="text-muted-foreground hover:text-foreground transition-colors">
              コレクション
            </Link>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              設定
            </Link>
            <Button 
              onClick={handleStartScraping}
              disabled={isScrapingLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Bot className="w-4 h-4 mr-2" />
              {isScrapingLoading ? "分析中..." : "AI分析"}
            </Button>
          </nav>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              デザインリファレンスを瞬時に発見
            </h2>
            <p className="text-muted-foreground text-lg">
              AIタグ分類と自動クローリングで、理想のデザインを効率的に収集
            </p>
          </div>
          
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={() => {}}
          />

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Button 
              variant="secondary" 
              onClick={handleStartScraping}
              disabled={isScrapingLoading}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI自動収集
            </Button>
            <Button variant="secondary">
              <FolderSync className="w-4 h-4 mr-2" />
              最新更新
            </Button>
            <Button variant="secondary">
              <Bookmark className="w-4 h-4 mr-2" />
              保存済み
            </Button>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <FilterSection 
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {/* Gallery View */}
      <GalleryView 
        searchQuery={searchQuery}
        selectedTags={selectedTags}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-accent hover:bg-accent/90 shadow-lg"
          onClick={handleStartScraping}
          disabled={isScrapingLoading}
        >
          <Bot className="w-6 h-6" />
        </Button>
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => {
            const url = prompt("リファレンスのURLを入力してください:");
            if (url) {
              handleAddReference(url);
            }
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
