import { AuthForm } from "@/components/features/auth/AuthForm";
import { redirectIfAuthenticated } from "@/lib/auth-guards";

type SearchParams = Promise<{ mode?: string }>;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await redirectIfAuthenticated();

  const { mode: raw } = await searchParams;
  const mode = raw === "register" ? "register" : "login";

  return <AuthForm key={mode} mode={mode} />;
}
