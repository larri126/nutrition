'use client';

import { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval'; // <--- Usamos la librería potente DB

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 horas en memoria basura
        staleTime: 1000 * 60 * 5,    // 5 minutos los datos se consideran frescos
        retry: 1,
      },
    },
  }));

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    // Configuración Asíncrona (Más rápida, no bloquea la UI)
    if (typeof window !== 'undefined') {
      const asyncPersister = createAsyncStoragePersister({
        storage: {
          getItem: async (key) => {
            const value = await get(key);
            return value;
          },
          setItem: async (key, value) => {
            await set(key, value);
          },
          removeItem: async (key) => {
            await del(key);
          },
        },
      });
      setPersister(asyncPersister);
    }
  }, []);

  if (!persister) {
    // Renderizamos null o un loader simple mientras carga la DB local
    return null; 
  }

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}