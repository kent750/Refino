import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Tag } from "@shared/schema";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const MAIN_COLORS = [
  { name: "青", value: "blue", color: "#2563eb" },
  { name: "赤", value: "red", color: "#ef4444" },
  { name: "緑", value: "green", color: "#22c55e" },
  { name: "黄", value: "yellow", color: "#eab308" },
  { name: "黒", value: "black", color: "#222" },
  { name: "白", value: "white", color: "#fff", border: true },
  { name: "グレー", value: "gray", color: "#6b7280" },
];

interface FilterSectionProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

export default function FilterSection({ selectedTags, onTagsChange, selectedColor, onColorChange }: FilterSectionProps) {
  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(tag => tag !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <span className="text-foreground font-medium">フィルター:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
        <span className="text-foreground font-medium">フィルター:</span>
        {/* メインカラー圧縮UI */}
        <ToggleGroup type="single" value={selectedColor} onValueChange={onColorChange} className="flex gap-1 mr-4">
          {MAIN_COLORS.map((color) => (
            <ToggleGroupItem key={color.value} value={color.value} aria-label={color.name} className="p-0 w-7 h-7 border border-border rounded-full flex items-center justify-center">
              <span style={{
                display: 'inline-block',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: color.color,
                border: color.border ? '1.5px solid #ccc' : 'none',
              }} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {/* タグフィルター（圧縮表示） */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 8).map((tag) => (
            <label
              key={tag.id}
              className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors"
            >
              <Checkbox
                checked={selectedTags.includes(tag.name)}
                onCheckedChange={() => handleTagToggle(tag.name)}
              />
              <span className="text-muted-foreground text-xs">{tag.name}</span>
              <Badge variant="secondary" className="text-xs">
                {tag.count}
              </Badge>
            </label>
          ))}
          {tags.length > 8 && (
            <span className="text-xs text-muted-foreground">+{tags.length - 8}件</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/80 ml-4"
        >
          <Plus className="w-4 h-4 mr-1" />
          タグを追加
        </Button>
      </div>
    </section>
  );
}
