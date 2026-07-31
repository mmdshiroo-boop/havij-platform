import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromotedAdCard({ viewMode }: { viewMode: "grid" | "list" }) {
  const isGrid = viewMode === "grid";

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-4
      ${isGrid ? "col-span-2 sm:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col gap-2" : "flex gap-4 items-center"}
    `}>
      <div className={`flex items-center gap-2 ${isGrid ? "" : "shrink-0"}`}>
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Megaphone className="w-5 h-5" />
        </div>
        {!isGrid && <span className="font-bold text-sm">تبلیغات</span>}
      </div>
      
      <div className="flex-1 space-y-2">
        <h4 className="font-bold text-sm">پیشنهاد ویژه</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          این فضای تبلیغاتی می‌تواند شامل بنر یا پیشنهاد ویژه کسب‌وکار شما باشد.
        </p>
      </div>

      <Button size="sm" className="rounded-xl text-xs w-full">
        مشاهده
      </Button>
    </div>
  );
}