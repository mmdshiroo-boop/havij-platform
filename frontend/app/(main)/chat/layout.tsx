// app/(main)/chat/Layout.tsx
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <main className="flex-1 h-full w-full overflow-hidden">{children}</main>
    </div>
  );
}