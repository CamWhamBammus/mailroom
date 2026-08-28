import { listRules } from "@/lib/categories";
import { RulesView } from "@/components/rules/RulesView";

export default function RulesPage() {
  return (
    <main className="paper-grain mx-auto min-h-screen max-w-3xl px-6 py-12">
      <RulesView initialRules={listRules()} />
    </main>
  );
}
