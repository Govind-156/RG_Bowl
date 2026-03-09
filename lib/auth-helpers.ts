import { auth } from "@/auth";

export async function getCurrentAdmin() {
  const session = await auth();
  const user = session?.user as { email?: string; role?: string } | undefined;

  if (!user || user.role !== "admin" || !user.email) {
    return null;
  }

  return {
    email: user.email,
    role: user.role,
  };
}

