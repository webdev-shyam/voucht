import { useAppStore } from "@/store/useAppStore";

export function useUser() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  return {
    user,
    setUser,
    isAuthenticated: true,
  };
}
