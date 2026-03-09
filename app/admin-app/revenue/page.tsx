import RevenueClient from "@/components/admin/RevenueClient";

export default function AdminAppRevenuePage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-zinc-400">
          High-level revenue metrics for RG Bowl – BTM.
        </p>
      </header>
      <RevenueClient />
    </div>
  );
}

