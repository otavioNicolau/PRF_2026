import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '~/trash/lib/supabase';
import { Session } from '@supabase/supabase-js';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {

  const router = useRouter();

  return (
    <SQLiteProvider databaseName="DB_PRF2026.db" onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        {/* <Stack.Screen name="auth" options={{ headerShown: false }} /> */}
      </Stack>
    </SQLiteProvider>
  );
}



async function migrateDbIfNeeded(db: SQLiteDatabase) {

  // await db.execAsync(`
  //   DROP TABLE IF EXISTS pdfs;
  // `);

  // await db.execAsync(`
  //   DROP TABLE IF EXISTS videos;
  // `);


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

  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS pdfs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      id_aula TEXT,
      uri TEXT,
      tipo TEXT,
      page INTEGER DEFAULT 0
    );
  `);

}
