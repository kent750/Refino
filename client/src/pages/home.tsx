import { useState } from "react";
import { Link } from "wouter";
import SearchBar from "@/components/SearchBar";
import FilterSection from "@/components/FilterSection";
import GalleryView from "@/components/GalleryView";
import UserGuide from "@/components/UserGuide";
import AddReferenceDialog from "@/components/AddReferenceDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Palette, Bot, FolderSync } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="7" y="9" width="16" height="16" rx="3" fill="#2563eb"/>
                <rect x="11" y="5" width="16" height="16" rx="3" fill="#3b82f6" fillOpacity="0.85"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">Refino</h1>
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
            <h2 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Discover Stunning Designs Instantly
            </h2>
            <p className="text-muted-foreground text-lg">
              デザインリファレンスを瞬時に発見
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
              onClick={handleStartScraping}
              disabled={isScrapingLoading}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Bot className="w-4 h-4 mr-2" />
              {isScrapingLoading ? "AI分析中..." : "AI自動収集"}
            </Button>
            <AddReferenceDialog />
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <FilterSection 
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Gallery View */}
      <GalleryView 
        searchQuery={searchQuery}
        selectedTags={selectedTags}
      />



      {/* ユーザーガイド */}
      <UserGuide showOnFirstVisit={true} />
    </div>
  );
}
