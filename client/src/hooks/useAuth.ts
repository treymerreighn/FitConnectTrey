import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!res.ok) {
        console.log("Auth fetch failed:", res.status, res.statusText);
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      const userData = await res.json();
      console.log("Auth fetch success:", userData);
      return userData;
    },
    retry: false,
    staleTime: 0,
    // cacheTime removed to match current React Query types — keep staleTime=0 for fresh fetches
  });

  console.log("useAuth - user:", user, "isLoading:", isLoading, "error:", error);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}