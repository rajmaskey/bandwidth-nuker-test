import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TestHistoryInput } from "@shared/routes";

export function useHistory() {
  return useQuery({
    queryKey: [api.history.list.path],
    queryFn: async () => {
      const res = await fetch(api.history.list.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.history.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TestHistoryInput) => {
      const res = await fetch(api.history.create.path, {
        method: api.history.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.history.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to save history");
      }
      return api.history.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.history.list.path] }),
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.history.clear.path, {
        method: api.history.clear.method,
      });
      if (!res.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.history.list.path] }),
  });
}
