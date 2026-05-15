import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, MessageSquareText, ShoppingBag, Stethoscope, Store } from "lucide-react";
import { cn } from "@/utils/cn";
import { useNavigate } from "react-router-dom";

interface AIMessageRendererProps {
  content: string;
  onAskDetails?: (name: string, type: string) => void;
}

interface RecommendedItem {
  type: "product" | "service" | "atelier";
  id: string;
  name: string;
  price?: string | number;
  image?: string;
}

export const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ content, onAskDetails }) => {
  const navigate = useNavigate();
  
  // More robust regex to capture everything between [DATA: and the final ]
  const dataRegex = /\[DATA:\s*([\s\S]*?)\](?!\s*[^[\]]*\])/g;
  
  const items: RecommendedItem[] = [];
  let match;
  
  const tempContent = content;
  while ((match = dataRegex.exec(tempContent)) !== null) {
    try {
      let jsonStr = match[1].trim();
      
      // Fix AI mistake: if multiple {}{} or {},{} without [], wrap it
      if (jsonStr.startsWith('{') && !jsonStr.startsWith('[{')) {
        // If it contains multiple objects (e.g. "}, {"), wrap in []
        if (jsonStr.includes('},')) {
          jsonStr = `[${jsonStr}]`;
        } else {
          // Single object
          jsonStr = jsonStr; 
        }
      }

      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else {
        items.push(parsed);
      }
    } catch (e) {
      console.error("Failed to parse AI data JSON. Content was:", match[1], e);
    }
  }

  // Remove the [DATA: ...] tags from the text for display
  const cleanContent = content.replace(dataRegex, "").trim();

  const handleGoToPage = (item: RecommendedItem) => {
    let path = "";
    if (item.type === "product") path = `/products/${item.id}`;
    else if (item.type === "service") path = `/services/${item.id}`;
    else if (item.type === "atelier") path = `/services/atelier/${item.id}`;

    if (path) navigate(path);
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Markdown Text Content */}
      <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere
        prose-p:leading-relaxed prose-p:text-ink/80
        prose-strong:text-caramel prose-strong:font-bold
        prose-ul:list-disc prose-ul:pl-4 prose-li:my-1
        prose-headings:text-ink prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
        prose-blockquote:border-l-4 prose-blockquote:border-caramel/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {cleanContent}
        </ReactMarkdown>
      </div>

      {/* Render Recommended Cards */}
      {items.length > 0 && (
        <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-sand/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-caramel flex items-center gap-2">
              <span className="h-1 w-4 bg-caramel rounded-full" />
              Gợi ý dành riêng cho bạn
            </p>
            <span className="text-[10px] font-bold text-muted/40 italic">{items.length} kết quả</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {items.map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white border border-sand/60 shadow-sm hover:shadow-xl hover:border-caramel/40 transition-all duration-300 overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative h-20 w-20 shrink-0 rounded-xl bg-warm/30 overflow-hidden border border-sand/20 shadow-inner">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sand/60">
                      {item.type === "product" && <ShoppingBag size={32} />}
                      {item.type === "service" && <Stethoscope size={32} />}
                      {item.type === "atelier" && <Store size={32} />}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider",
                      item.type === "product" ? "bg-blue-100 text-blue-700" : 
                      item.type === "service" ? "bg-purple-100 text-purple-700" : 
                      "bg-orange-100 text-orange-700"
                    )}>
                      {item.type}
                    </span>
                    {item.price && (
                      <span className="text-xs font-bold text-forest">
                        {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') + 'đ' : item.price}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[14px] font-black text-ink leading-tight truncate group-hover:text-caramel transition-colors">
                    {item.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskDetails?.(item.name, item.type);
                      }}
                      className="relative z-[10] pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-caramel text-[10px] font-bold text-white hover:bg-ink shadow-sm transition-all"
                    >
                      <MessageSquareText size={12} /> Hỏi chi tiết
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToPage(item);
                      }}
                      className="relative z-[10] pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm/50 text-[10px] font-bold text-muted hover:bg-caramel hover:text-white transition-all"
                    >
                      <ExternalLink size={12} /> Xem trang
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
