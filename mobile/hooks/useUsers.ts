import { useQuery } from '@tanstack/react-query'
import { User } from '@/types'
import { useApi } from '@/lib/axios';

// A pragmatic gate, not full RFC validation: just enough to avoid querying
// the backend on every keystroke of a name or a half-typed address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isLikelyEmail = (value: string) => EMAIL_RE.test(value.trim());

/**
 * Looks a single person up by their exact email — there is no "list everyone"
 * endpoint, so this is the only way to find someone to start a chat with.
 * Disabled until the query looks like a complete email, so a query never
 * fires on every keystroke of a partial one.
 */
export const useSearchUserByEmail = (email: string) => {
  const { apiWithAuth } = useApi();
  const normalized = email.trim().toLowerCase();

  return useQuery<User | null, Error>({
    queryKey: ['users', 'search', normalized],
    queryFn: async () => {
      const { data } = await apiWithAuth<User | null>({
        method: 'GET',
        url: `/users/search?email=${encodeURIComponent(normalized)}`,
      });
      return data;
    },
    enabled: isLikelyEmail(normalized),
  })
}
