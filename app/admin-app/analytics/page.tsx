import AnalyticsClient from "@/components/admin/AnalyticsClient";

export default function AdminAppAnalyticsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-400">
          Today&apos;s revenue, orders, weekly revenue, and best selling dish.
        </p>
      </header>
      <AnalyticsClient />
    </div>
  );
}

