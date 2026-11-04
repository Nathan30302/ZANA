import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <AuthForm intendedRole="CUSTOMER" redirectTo="/home" />;
}
