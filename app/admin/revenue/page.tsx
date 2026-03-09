export default async function AdminRevenuePage() {
  const { redirect } = await import("next/navigation");
  redirect("/admin-app/revenue");
}

