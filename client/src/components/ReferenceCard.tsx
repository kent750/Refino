import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Bookmark, Info, ExternalLink } from "lucide-react";
import type { Reference } from "@shared/schema";

interface ReferenceCardProps {
  reference: Reference;
}

export default function ReferenceCard({ reference }: ReferenceCardProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      const response = await apiRequest("POST", `/api/references/${reference.id}/copy`);
      const data = await response.json();
      
      await copyToClipboard(data.text);
      
      toast({
        title: "クリップボードにコピーしました",
        description: "リファレンス情報をクリップボードに保存しました",
      });
    } catch (error) {
      toast({
        title: "コピーに失敗しました",
        description: "しばらく後に再試行してください",
        variant: "destructive",
      });
    }
  };

  const handleSaveToNotion = async () => {
    // Placeholder for Notion integration
    toast({
      title: "Notionに保存しました",
      description: "リファレンスをNotionページに追加しました",
    });
  };

  const getStatusColor = () => {
    return reference.aiAnalyzed ? "bg-emerald-500" : "bg-yellow-400";
  };

  const getStatusTitle = () => {
    return reference.aiAnalyzed ? "AI分析完了" : "AI分析中";
  };

  return (
    <a
      href={reference.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group overflow-hidden hover:shadow-lg transition-all duration-300 border-border no-underline"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card className="overflow-hidden border-border">
        <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
          {reference.imageUrl ? (
            <img
              src={reference.imageUrl}
              alt={reference.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to gradient background if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ExternalLink className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
              {reference.title}
            </h4>
            <div className="flex space-x-1 ml-2">
              <div 
                className={`w-2 h-2 ${getStatusColor()} rounded-full`}
                title={getStatusTitle()}
              />
            </div>
          </div>
          {reference.description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {reference.description}
            </p>
          )}
          {/* AI Generated Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {reference.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index}
                variant={index === 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {tag}
              </Badge>
            ))}
            {reference.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{reference.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {reference.source}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={(e) => { e.preventDefault(); handleCopyToClipboard(); }}
                title="クリップボードにコピー"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={(e) => { e.preventDefault(); handleSaveToNotion(); }}
                title="Notionに保存"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={(e) => { e.preventDefault(); window.open(reference.url, '_blank', 'noopener,noreferrer'); }}
                title="詳細を表示"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
