import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import type { UserData } from '@/types';

export const useGameData = (uid: string) => {
  const [gameData, setGameData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;

    const db = getDatabase();
    const userRef = ref(db, `users/${uid}`);

    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGameData(snapshot.val());
        } else {
          setError("No user data found");
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return { gameData, loading, error };
};