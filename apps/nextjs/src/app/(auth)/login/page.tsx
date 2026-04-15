import type { Metadata } from "next";

import { LoginForm } from "~/components/auth/login-form";

export const metadata: Metadata = {
  title: "Logowanie — JDK Z4",
};

export default function LoginPage() {
  return <LoginForm />;
}
