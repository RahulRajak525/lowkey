import {useQuery} from '@tanstack/react-query'
import {User} from '@/types'
import { useApi } from '@/lib/axios'; 


export const useUsers = () => {
    const {apiWithAuth} = useApi();
    return useQuery<User[], Error>({
        queryKey: ['users'],
        queryFn: async () => {
          const {data} = await apiWithAuth<User[]>({
            method: 'GET',
            url: '/users',
          });
          return data;
        
        },
    })
}
