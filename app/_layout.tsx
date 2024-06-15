import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="DB_PRF2026.db" onInit={migrateDbIfNeeded}>
      <Stack>
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
  //   DROP TABLE IF EXISTS video_positions;
  // `);

  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY NOT NULL ,
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
      CREATE TABLE IF NOT EXISTS edital (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mateira_id INTEGER,
        observacao TEXT
    );
  `);

  // await db.execAsync(`
  //   PRAGMA journal_mode = 'wal';
  //   CREATE TABLE IF NOT EXISTS video_positions (
  //     filename TEXT PRIMARY KEY,
  //     position INTEGER
  //   );
  // `);

}


