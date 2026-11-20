import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return <AuthForm intendedRole="ADMIN" redirectTo="/admin" />;
}
