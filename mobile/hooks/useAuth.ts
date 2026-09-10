import {useMutation} from '@tanstack/react-query';
import { useApi } from '../lib/axios';
import type { User } from '../types';

export const useAuthCallback= ()=>{
     const api = useApi();
    return useMutation({
        mutationFn : async() =>{
            const {data} = await api.post<User>('/api/auth/callback');
            return data;
        }
    })
   
}
