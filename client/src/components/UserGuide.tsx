import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Search, Filter, Bookmark, Bot, Plus, BarChart3, Settings, X } from "lucide-react";

interface UserGuideProps {
  showOnFirstVisit?: boolean;
}

export default function UserGuide({ showOnFirstVisit = true }: UserGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem('designref-guide-seen');
    if (!visited && showOnFirstVisit) {
      setIsOpen(true);
      setHasVisited(false);
    } else {
      setHasVisited(true);
    }
  }, [showOnFirstVisit]);

  const handleClose = () => {
    setIsOpen(false);
    if (!hasVisited) {
      localStorage.setItem('designref-guide-seen', 'true');
      setHasVisited(true);
    }
  };

  const guideSteps = [
    {
      icon: <Search className="w-5 h-5" />,
      title: "検索とフィルタリング",
      description: "キーワード検索でリファレンスを見つけ、タグフィルターで絞り込みができます",
      details: [
        "検索バーにキーワードを入力してリファレンスを検索",
        "タグを選択して特定のカテゴリーに絞り込み",
        "複数のタグを組み合わせて詳細検索が可能"
      ]
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: "AI自動収集",
      description: "AIが自動でデザインギャラリーからリファレンスを収集し、日本語タグで分類します",
      details: [
        "Land-book、Muzli、Awwwardsから最新デザインを収集",
        "OpenAI GPT-4oによる自動タグ分類",
        "日本語での説明文とカテゴリー分けを自動生成"
      ]
    },
    {
      icon: <Plus className="w-5 h-5" />,
      title: "手動リファレンス追加",
      description: "URLを入力するだけで、AIが自動分析してリファレンスを追加します",
      details: [
        "URLを入力して「追加」ボタンをクリック",
        "AIが自動でタイトル、説明、タグを生成",
        "手動での情報修正も可能"
      ]
    },
    {
      icon: <Bookmark className="w-5 h-5" />,
      title: "クリップボードコピー",
      description: "リファレンス情報を整形してクリップボードにコピーできます",
      details: [
        "各リファレンスカードのコピーボタンをクリック",
        "タイトル、説明、URL、タグが整形されてコピー",
        "NotionやSlackなどに簡単に貼り付け可能"
      ]
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "ダッシュボード",
      description: "コレクション全体の統計と最近の活動を確認できます",
      details: [
        "総リファレンス数とAI分析済み数を表示",
        "ユニークタグ数と最近の追加リストを確認",
        "コレクションの成長を視覚的に把握"
      ]
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "設定とデータ管理",
      description: "AI分析設定やデータのエクスポート機能を利用できます",
      details: [
        "AI分析のオン・オフ切り替え",
        "自動収集の頻度設定",
        "全データのJSONエクスポート"
      ]
    }
  ];

  return (
    <>
      {/* ヘルプボタン（常時表示） */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg"
            title="使い方ガイド"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  DesignRef AI の使い方
                </DialogTitle>
                <DialogDescription className="mt-2">
                  AIを活用したデザインリファレンス管理システムの完全ガイド
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* 概要 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✨ サービス概要</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  DesignRef AIは、世界中のデザインギャラリーから自動でリファレンスを収集し、
                  AIが日本語でタグ分類する次世代のデザイン管理ツールです。
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">AI自動分析</Badge>
                  <Badge variant="secondary">日本語対応</Badge>
                  <Badge variant="secondary">リアルタイム検索</Badge>
                  <Badge variant="secondary">ワンクリックコピー</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 機能詳細 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guideSteps.map((step, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      {step.icon}
                      <span>{step.title}</span>
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start space-x-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* クイックスタート */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🚀 クイックスタート</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span>「AI分析」ボタンでリファレンスを自動収集</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span>検索バーやタグフィルターでリファレンスを探索</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span>気に入ったリファレンスをクリップボードにコピー</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <span>手動でURLを追加してコレクションを拡充</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* フッター */}
            <div className="text-center pt-4">
              <Button onClick={handleClose} size="lg">
                使い始める
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                右下の「？」ボタンからいつでもこのガイドを再表示できます
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}