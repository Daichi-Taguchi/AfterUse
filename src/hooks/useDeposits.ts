import { useAppDataContext } from '../context/AppDataContext';

export function useDeposits() {
  return useAppDataContext();
}
