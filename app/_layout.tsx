import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '~/lib/supabase';

import { Session } from '@supabase/supabase-js';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {

  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error.message);
        return;
      }
      setSession(session);
      handleRedirect(session);
    };

    getSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleRedirect(session);
    });

    // return () => {
    //   subscription?.subscription;
    // };
  }, []);

  const handleRedirect = (session: Session | null) => {
    if (session && session.user) {
      // console.log(session.user);
      router.replace('(tabs)'); // Redireciona para a tab

    } else {
      router.replace('auth'); // Redireciona para a tela de autenticação
    }
  };

  return (
    <SQLiteProvider databaseName="DB_PRF2026.db" onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      id_video TEXT,
      titulo TEXT,
      aula TEXT,
      materia TEXT,
      assunto TEXT,
      resolucao_720p TEXT,
      resolucao_480p TEXT,
      resolucao_360p TEXT,
      uri TEXT,
      position INTEGER DEFAULT 0,
      watched BOOLEAN DEFAULT 0
    );
  `);
}
