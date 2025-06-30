import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, ArrowLeft, BarChart3, TrendingUp, Clock, Tag } from "lucide-react";
import { useReferences } from "@/hooks/useReferences";

export default function Dashboard() {
  const { data: referencesData, isLoading } = useReferences({ limit: 50, offset: 0 });

  const totalReferences = referencesData?.total || 0;
  const recentReferences = referencesData?.references?.slice(0, 5) || [];

  // Calculate stats
  const aiAnalyzedCount = referencesData?.references?.filter(r => r.aiAnalyzed).length || 0;
  const uniqueTags = new Set(referencesData?.references?.flatMap(r => r.tags)).size || 0;

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
            <h1 className="text-xl font-bold text-foreground">ダッシュボード</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">アナリティクス概要</h2>
          <p className="text-muted-foreground">
            コレクション全体の統計と最近の活動を確認できます
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総リファレンス数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferences}</div>
              <p className="text-xs text-muted-foreground">
                コレクション内の総デザイン数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI分析済み</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aiAnalyzedCount}</div>
              <p className="text-xs text-muted-foreground">
                AIタグ分類完了数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ユニークタグ数</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTags}</div>
              <p className="text-xs text-muted-foreground">
                分類タグの種類数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最近の追加</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentReferences.length}</div>
              <p className="text-xs text-muted-foreground">
                直近5件のリファレンス
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent References */}
        <Card>
          <CardHeader>
            <CardTitle>最近追加されたリファレンス</CardTitle>
            <CardDescription>
              直近で追加されたデザインリファレンスを確認できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            ) : recentReferences.length > 0 ? (
              <div className="space-y-4">
                {recentReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {reference.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reference.description || "説明なし"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{reference.source}</Badge>
                        {reference.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {reference.tags.length > 3 && (
                          <Badge variant="outline">
                            +{reference.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(reference.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                まだリファレンスが追加されていません
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/">
            <Button>
              リファレンスを見る
            </Button>
          </Link>
          <Link href="/collections">
            <Button variant="outline">
              コレクション管理
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline">
              設定
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}