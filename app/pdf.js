import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Alert, StatusBar, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import { useSQLiteContext } from 'expo-sqlite';

const PdfViewerScreen = () => {
  useKeepAwake();
  const db = useSQLiteContext();
  const { uri, id_aula, tipo } = useLocalSearchParams();
  const [localPdfUri, setLocalPdfUri] = useState(null);
  const [pageState, setPageState] = useState(0);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (error) {
        console.error('Error locking screen orientation:', error);
      }
    };

    lockOrientation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const result = await db.getFirstAsync('SELECT page FROM pdfs WHERE id_aula = ? AND tipo = ?;', [id_aula, tipo]);
        if (result) {
          const savedPage = result.page;
          setPageState(savedPage);
        } else {
          console.log('No saved page found');
        }
      } catch (e) {
        console.error('Error loading page from database:', e);
      }
    };

    loadPage();
  }, [db, id_aula, tipo]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          setLocalPdfUri(uri);
        } else {
          console.error('PDF file does not exist:', uri);
          Alert.alert('PDF Not Found', 'The requested PDF file does not exist.');
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
        Alert.alert('Error', 'Failed to load PDF. Please try again.');
      }
    };

    loadPdf();
  }, [uri]);

  // useEffect(() => {
    const savePage = async (page) => {
      try {
        const result = await db.getAllAsync('SELECT COUNT(*) AS count FROM pdfs WHERE id_aula = ? AND tipo = ?;', [id_aula, tipo]);
        const count = result[0]?.count || 0;

        if (count > 0) {
          await db.runAsync(
            'UPDATE pdfs SET page = ? WHERE id_aula = ? AND tipo = ?;',
            [page, id_aula, tipo]
          );
        } else {
          await db.runAsync(
            'INSERT INTO pdfs (id_aula, tipo, page) VALUES (?,?,?);',
            [id_aula, tipo, page]
          );
        }
      } catch (e) {
        console.error('Error saving page to database:', e);
      }
    };

  //   if (pageState > 0) {
  //     savePage();
  //   }
  // }, [pageState, id_aula, tipo, db]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar hidden={true} />

      {localPdfUri ? (
        <Pdf
          source={{ uri: localPdfUri }}
          
          onPageChanged={(page, numberOfPages) => {
            // console.log(`Current page: ${page}`);
            savePage(page);
          }}
          onError={(error) => {
            console.error('Error rendering PDF:', error);
            Alert.alert('Error', 'Failed to render PDF. Please try again.');
          }}
          style={styles.pdf}
          scale={3.0}
          fitWidth={true}
          page={pageState}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ccc', // Ajuste para garantir que a tela tenha um fundo consistente
  },
  pdf: {
    flex: 1,
    // width: Dimensions.get('window').width,
    // height: Dimensions.get('window').height,

    width: '100%',
    height:  '100%',
  },
});

export default PdfViewerScreen;
