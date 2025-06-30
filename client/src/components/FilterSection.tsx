import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Tag } from "@shared/schema";

interface FilterSectionProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function FilterSection({ selectedTags, onTagsChange }: FilterSectionProps) {
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-foreground font-medium">フィルター:</span>
          
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors"
            >
              <Checkbox
                checked={selectedTags.includes(tag.name)}
                onCheckedChange={() => handleTagToggle(tag.name)}
              />
              <span className="text-muted-foreground">{tag.name}</span>
              <Badge variant="secondary" className="text-xs">
                {tag.count}
              </Badge>
            </label>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 ml-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            タグを追加
          </Button>
        </div>
      </div>
    </section>
  );
}
