import { redirect } from "next/navigation";

export default function SuperAdminRedirect() {
  redirect("/panel/super-admin/dashboard");
}
