export default async function AdminOrdersPage() {
  const { redirect } = await import("next/navigation");
  redirect("/admin-app/orders");
}

