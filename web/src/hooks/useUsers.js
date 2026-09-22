import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/lib/axios'

export const useUsers = () => {
  const { apiWithAuth } = useApi()
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiWithAuth({ method: 'GET', url: '/users' })
      return data
    },
  })
}
