import { useState } from 'react';
import { Contact } from '../types';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  return { contacts, setContacts };
};
