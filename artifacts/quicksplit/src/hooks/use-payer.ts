import { useState, useEffect } from 'react';

const STORAGE_KEY = 'quicksplit_payer_phone';
const NAME_STORAGE_KEY = 'quicksplit_payer_name';

export function usePayer() {
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  
  const [name, setName] = useState<string>(() => {
    return localStorage.getItem(NAME_STORAGE_KEY) || '';
  });

  const savePayer = (newPhone: string, newName?: string) => {
    localStorage.setItem(STORAGE_KEY, newPhone);
    setPhone(newPhone);
    if (newName) {
      localStorage.setItem(NAME_STORAGE_KEY, newName);
      setName(newName);
    }
  };

  const clearPayer = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    setPhone('');
    setName('');
  };

  return { phone, name, savePayer, clearPayer, isLoggedIn: !!phone };
}
