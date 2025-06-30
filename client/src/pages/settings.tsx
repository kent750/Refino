import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Palette, ArrowLeft, Bot, Database, Download, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [autoScrapeEnabled, setAutoScrapeEnabled] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [scrapingInterval, setScrapingInterval] = useState("24");
  const [maxReferencesPerScrape, setMaxReferencesPerScrape] = useState("10");
  
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Note: In a real application, you would save these settings to a backend
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "設定を保存しました",
        description: "新しい設定が適用されました",
      });
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/references?limit=1000");
      const data = await response.json();
      
      const exportData = {
        references: data.references,
        exportDate: new Date().toISOString(),
        total: data.total
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `designref-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "エクスポート完了",
        description: "リファレンスデータをダウンロードしました",
      });
    } catch (error) {
      toast({
        title: "エクスポートエラー",
        description: "データのエクスポートに失敗しました",
        variant: "destructive",
      });
    }
  };

  const handleClearData = async () => {
    if (!confirm("すべてのリファレンスデータを削除しますか？この操作は取り消せません。")) {
      return;
    }
    
    if (!confirm("本当にすべてのデータを削除しますか？")) {
      return;
    }
    
    try {
      // Note: This would require a backend endpoint to clear all data
      toast({
        title: "データクリア機能",
        description: "この機能は開発中です",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "データの削除に失敗しました",
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
            <h1 className="text-xl font-bold text-foreground">設定</h1>
          </div>
          
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "保存中..." : "設定を保存"}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* AI Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>AI分析設定</span>
              </CardTitle>
              <CardDescription>
                AIによる自動タグ分類と分析の設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="ai-analysis" className="text-base font-medium">
                    AI分析を有効にする
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    新しいリファレンスを自動的にAIで分析してタグを生成します
                  </p>
                </div>
                <Switch
                  id="ai-analysis"
                  checked={aiAnalysisEnabled}
                  onCheckedChange={setAiAnalysisEnabled}
                />
              </div>
              
              {aiAnalysisEnabled && (
                <div className="pt-4 border-t">
                  <Badge variant="secondary" className="mb-2">
                    OpenAI GPT-4o使用中
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    日本語でのタグ生成と説明文の充実化を行います
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scraping Settings */}
          <Card>
            <CardHeader>
              <CardTitle>自動収集設定</CardTitle>
              <CardDescription>
                デザインギャラリーからの自動収集の設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="auto-scrape" className="text-base font-medium">
                    自動収集を有効にする
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Land-book、Muzli、Awwwardsから定期的にリファレンスを収集します
                  </p>
                </div>
                <Switch
                  id="auto-scrape"
                  checked={autoScrapeEnabled}
                  onCheckedChange={setAutoScrapeEnabled}
                />
              </div>

              {autoScrapeEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scraping-interval">収集間隔 (時間)</Label>
                      <Input
                        id="scraping-interval"
                        type="number"
                        value={scrapingInterval}
                        onChange={(e) => setScrapingInterval(e.target.value)}
                        min="1"
                        max="168"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        1〜168時間の間で設定可能
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="max-references">1回の最大収集数</Label>
                      <Input
                        id="max-references"
                        type="number"
                        value={maxReferencesPerScrape}
                        onChange={(e) => setMaxReferencesPerScrape(e.target.value)}
                        min="1"
                        max="50"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        1〜50件の間で設定可能
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>データ管理</span>
              </CardTitle>
              <CardDescription>
                収集したリファレンスデータの管理とバックアップ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">データをエクスポート</h4>
                  <p className="text-sm text-muted-foreground">
                    すべてのリファレンスをJSONファイルでダウンロード
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
                <div>
                  <h4 className="font-medium text-destructive">すべてのデータを削除</h4>
                  <p className="text-sm text-muted-foreground">
                    すべてのリファレンスとタグを完全に削除します（取り消せません）
                  </p>
                </div>
                <Button variant="destructive" onClick={handleClearData}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>アプリケーション情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">バージョン</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">データベース</span>
                <Badge variant="secondary">PostgreSQL</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI エンジン</span>
                <Badge variant="secondary">OpenAI GPT-4o</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">最終更新</span>
                <span className="text-sm text-muted-foreground">2025年6月30日</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4">
            <Link href="/">
              <Button variant="outline">
                ホームに戻る
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                ダッシュボード
              </Button>
            </Link>
            <Link href="/collections">
              <Button variant="outline">
                コレクション管理
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}