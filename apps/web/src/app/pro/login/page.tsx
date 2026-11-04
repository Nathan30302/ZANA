import { AuthForm } from "@/components/auth-form";

export default function ProLoginPage() {
  return <AuthForm intendedRole="PROFESSIONAL" redirectTo="/pro" />;
}
