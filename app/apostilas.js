import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import axios from 'axios';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PdfList = ({ pdfs, aula }) => {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloading, setDownloading] = useState({});
  const [downloadedPdfs, setDownloadedPdfs] = useState({});

  const insertPdf = async (db, id_aula, tipo, uri) => {
    try {
      await db.runAsync(
        `INSERT INTO pdfs (id_aula, tipo, uri) VALUES (?, ?, ?);`,
        [id_aula, tipo, uri]
      );
    } catch (error) {
      console.error('Erro ao inserir PDF:', error);
    }
  };

  const deletePdf = async (db, id_aula, tipo) => {
    try {
      await db.runAsync(`DELETE FROM pdfs WHERE id_aula = ? AND tipo = ?;`, [id_aula, tipo]);
    } catch (error) {
      console.error('Erro ao deletar PDF:', error);
    }
  };

  const checkDownloadedPdfs = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const downloadedPdfIds = files.map(file => file.split('.').slice(0, -1).join('.'));
      const downloadedPdfsObj = {};
      downloadedPdfIds.forEach(id => {
        downloadedPdfsObj[id] = true;
      });
      setDownloadedPdfs(downloadedPdfsObj);
    } catch (error) {
      console.error('Erro ao listar PDFs baixados:', error);
    }
  };

  const handleDownload = async (pdf, tipo) => {
    const pdfUrl = pdf.url;

    if (!pdfUrl) {
      Alert.alert('Erro', 'URL do PDF não disponível.');
      return;
    }

    try {
      setDownloading((prev) => ({ ...prev, [`${pdf.id_aula}_${tipo}`]: true }));
      const downloadResumable = FileSystem.createDownloadResumable(
        pdfUrl,
        `${FileSystem.documentDirectory}${pdf.id_aula}_${tipo}.pdf`,
        {},
        (progress) => {
          const progressValue = Math.max(0, Math.min(100, (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100));
          setDownloadProgress((prev) => ({
            ...prev,
            [`${pdf.id_aula}_${tipo}`]: progressValue,
          }));
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      await insertPdf(db, pdf.id_aula, tipo, uri);

      setDownloadProgress((prev) => ({
        ...prev,
        [`${pdf.id_aula}_${tipo}`]: 0,
      }));
      setDownloading((prev) => ({
        ...prev,
        [`${pdf.id_aula}_${tipo}`]: false,
      }));
      checkDownloadedPdfs();

      navigation.navigate('pdf', { uri, id_aula: pdf.id_aula, tipo });
    } catch (error) {
      console.error('Erro ao baixar o PDF:', error);
      Alert.alert('Erro', 'Erro ao baixar o PDF. Por favor, tente novamente.');
      setDownloading((prev) => ({
        ...prev,
        [`${pdf.id_aula}_${tipo}`]: false,
      }));
    }
  };

  const handleDelete = async (pdf, tipo) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${pdf.id_aula}_${tipo}.pdf`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert('Erro', 'PDF não encontrado para exclusão.');
        return;
      }

      await FileSystem.deleteAsync(fileUri);
      await deletePdf(db, pdf.id_aula, tipo);
      checkDownloadedPdfs();
    } catch (error) {
      console.error('Erro ao excluir o PDF:', error);
      Alert.alert('Erro', 'Erro ao excluir o PDF. Por favor, tente novamente.');
    }
  };

  useEffect(() => {
    checkDownloadedPdfs();
  }, [pdfs]);

  const openPdf = (uri, id_aula, tipo) => {
    navigation.navigate('pdf', { uri, id_aula, tipo });
  };

  return (
    <View>
      {pdfs ? pdfs.map((pdf, index) => (
        <View key={index}>
          <Pressable
            onPress={() => downloadedPdfs[`${pdf.id_aula}_${pdf.tipo}`] ? openPdf(`${FileSystem.documentDirectory}${pdf.id_aula}_${pdf.tipo}.pdf`, pdf.id_aula, pdf.tipo) : handleDownload(pdf, pdf.tipo)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#333333' : '#1B1B1B',
              width: '96%',
              marginTop: 5,
              marginBottom: 10,
              marginLeft: 5,
              marginRight: 5,
            })}
          >
            <View style={styles.pdfContainer}>
              <Text style={[styles.pdfLink, styles.whiteText]}>
                {pdf.nome}
              </Text>
              <View style={styles.buttonsContainer}>
                {!downloading[`${pdf.id_aula}_${pdf.tipo}`] && !downloadedPdfs[`${pdf.id_aula}_${pdf.tipo}`] ? (
                  <Pressable
                    style={[styles.actionButton]}
                    onPress={() => handleDownload(pdf, pdf.tipo)}
                  >
                    <FontAwesome name="download" size={16} color="#fff" />
                  </Pressable>
                ) : downloading[`${pdf.id_aula}_${pdf.tipo}`] ? (
                  <Pressable style={[styles.actionButton]}>
                    <Text style={styles.progressText}>{`${downloadProgress[`${pdf.id_aula}_${pdf.tipo}`]?.toFixed(0) || 0}%`}</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      style={[styles.actionButtonRed]}
                      onPress={() => handleDelete(pdf, pdf.tipo)}
                    >
                      <FontAwesome name="trash" size={14} color="#fff" />
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton]}
                      onPress={() => openPdf(`${FileSystem.documentDirectory}${pdf.id_aula}_${pdf.tipo}.pdf`)}
                    >
                      <FontAwesome name="file-pdf-o" size={16} color="#fff" />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      )) : <Text style={styles.whiteText}>NENHUM PDF DISPONÍVEL</Text>}
    </View>
  );
};

export default function Apostilas() {
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const url = `https://teal-crostata-aea03c.netlify.app/api/apostilas`;

  const fetchData = async () => {
    try {
      const response = await axios.get(url);
      await AsyncStorage.setItem(url, JSON.stringify(response.data.APOSTILAS));
      setData(response.data.APOSTILAS);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar os dados:', err);
      const cachedData = await AsyncStorage.getItem(url);
      if (cachedData) {
        setData(JSON.parse(cachedData));
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const initializeData = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        await fetchData();
      } else {
        const cachedData = await AsyncStorage.getItem(url);
        if (cachedData) {
          setData(JSON.parse(cachedData));
        } else {
          throw new Error('Sem conexão e sem dados em cache disponíveis');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar os dados:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: "APOSTILAS"
        }}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.whiteText}>Erro ao carregar os dados. Tente novamente mais tarde.</Text>
        </View>
      ) : (
        <ScrollView style={{ padding: 10 }}>

          {data ? (
            <PdfList pdfs={data} />
          ) : (
            <Text style={styles.whiteText}>Nenhum PDF encontrado para esta aula.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  videoLink: {
    flex: 1,
    padding: 10,
  },
  container: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  whiteText: {
    color: '#ffffff',
  },
  A5B99CText: {

    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ffffff',

  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  materia: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 1,
    marginBottom: 5,
    width: '99%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aula: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 1,
    marginBottom: 5,
  },
  cursoContainer: {
    flexDirection: 'column',
    // alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 10,

  },
  buttonsContainer: {
    flexDirection: 'col',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#A5B99C',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonRed: {
    backgroundColor: 'rgb(255, 0, 0)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  watchedButton: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: '#fff',
    marginLeft: 10,
  },
  videoBox: {

    borderWidth: 1,
    borderColor: '#ffffff',
    // marginBottom: 10,
    padding: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonRed: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  pdfContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
    borderWidth: 1,
    borderColor: '#ffffff',
    padding: 10,
  },
  pdfLink: {
    fontSize: 16,
    color: '#000',
  },
  whiteText: {
    color: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  actionButtonRed: {
    backgroundColor: '#dc3545',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  progressText: {
    color: '#fff',
  },
});