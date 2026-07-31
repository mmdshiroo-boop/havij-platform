import AdvancedSearch from "@/components/AdvancedSearch-panels/AdvancedSearch";

export default function AgentAdvancedSearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">جستجوی پیشرفته</h1>
        <p className="text-sm text-muted-foreground mt-1">
          جستجوی دقیق در آگهی‌های شما با فیلترهای موقعیت مکانی، نوع ملک، بازهٔ
          قیمت و تاریخ
        </p>
      </div>
      <AdvancedSearch />
    </div>
  );
}
