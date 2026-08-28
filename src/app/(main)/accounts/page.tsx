import { listAccountEmails } from "@/lib/googleAuth";
import { AccountsView } from "@/components/accounts/AccountsView";

export default function AccountsPage() {
  return (
    <main className="paper-grain mx-auto min-h-screen max-w-2xl px-6 py-12">
      <AccountsView initialAccounts={listAccountEmails()} />
    </main>
  );
}
