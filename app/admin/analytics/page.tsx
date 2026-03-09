export default async function AdminAnalyticsPage() {
  const { redirect } = await import("next/navigation");
  redirect("/admin-app/analytics");
}

