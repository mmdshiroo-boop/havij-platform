// components/ui/skeletons.tsx
import { Skeleton } from "@/components/ui/skeleton";

// ✅ اسپینر تمام صفحه با لوگوی هویج (در حال چرخش)
export const FullPageSpinner = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <div className="text-center space-y-6">
        {/* لوگوی هویج (تصویر از public/log.png) با انیمیشن چرخش */}
        <div className="relative mx-auto w-24 h-24">
          <img
            src="/log.png"
            alt="هویج"
            className="w-full h-full object-contain animate-spin"
          />
        </div>

        {/* عنوان */}
        <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
          پلتفرم آگهی هویچ
        </h1>

        {/* متن بارگذاری */}
        <p className="text-sm text-muted-foreground animate-pulse">
          در حال بارگذاری...
        </p>
      </div>
    </div>
  );
};

// بقیه اسکلتون‌ها بدون تغییر...
export const HomePageSkeleton = () => {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-4 md:py-6">
      <div className="flex gap-6 mb-8 overflow-hidden justify-center">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-[72px] h-[72px] rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="h-44 w-full bg-muted animate-pulse rounded-2xl mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] w-full bg-muted animate-pulse rounded-2xl" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SearchPageSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="hidden lg:block w-72 shrink-0">
        <div className="h-[500px] w-full bg-muted animate-pulse rounded-2xl" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-28 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-20 bg-muted animate-pulse rounded-full"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square w-full bg-muted animate-pulse rounded-xl" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-5 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PanelSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 lg:col-span-3">
        <div className="h-[300px] w-full bg-muted animate-pulse rounded-2xl" />
      </div>
      <div className="md:col-span-8 lg:col-span-9 space-y-4">
        <div className="h-32 w-full bg-muted animate-pulse rounded-2xl" />
        <div className="h-64 w-full bg-muted animate-pulse rounded-2xl" />
      </div>
    </div>
  );
};

export const AdDetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="aspect-square w-full bg-muted animate-pulse rounded-2xl" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 w-20 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-muted animate-pulse rounded-lg" />
        <div className="h-6 w-1/2 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 w-full bg-muted animate-pulse rounded-xl" />
        <div className="flex gap-3">
          <div className="h-11 flex-1 bg-muted animate-pulse rounded-xl" />
          <div className="h-11 flex-1 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="h-24 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  );
};

export const AdCardSkeleton = () => {
  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] w-full bg-muted animate-pulse rounded-2xl" />
      <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
      <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
    </div>
  );
};