import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useState, useEffect } from 'react';

import { supabase } from '~/lib/supabase';
import Auth from '~/components/Auth';
import Account from '~/components/Account';
import { Session } from '@supabase/supabase-js';


export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <SQLiteProvider databaseName="DB_PRF2026.db" onInit={migrateDbIfNeeded}>



      <Stack>
        {session && session.user ? <Account key={session.user.id} session={session} /> : <Auth />}

        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </SQLiteProvider>

  );
}


async function migrateDbIfNeeded(db: SQLiteDatabase) {


  // await db.execAsync(`
  //   DROP TABLE IF EXISTS videos;
  // `);

  // await db.execAsync(`
  //   DROP TABLE IF EXISTS edital;
  // `);

  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL ,
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

  // await db.execAsync(`
  //   PRAGMA journal_mode = 'wal';
  //     CREATE TABLE IF NOT EXISTS edital (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT,
  //       assunto_id INTEGER NOT NULL,
  //       observacao TEXT,
  //       data_hora TEXT NOT NULL
  //   );
  // `);

  // await db.execAsync(`
  //   PRAGMA journal_mode = 'wal';
  //   CREATE TABLE IF NOT EXISTS video_positions (
  //     filename TEXT PRIMARY KEY,
  //     position INTEGER
  //   );
  // `);

}


