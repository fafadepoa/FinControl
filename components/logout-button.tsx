import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="fc-btn-ghost">
        Sair
      </button>
    </form>
  );
}
