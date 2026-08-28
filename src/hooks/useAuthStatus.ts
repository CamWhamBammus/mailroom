"use client";

import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAccounts(data.accounts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading };
}
