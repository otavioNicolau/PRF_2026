import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router'; // Verifique se o caminho do import está correto
import { Stack, Link } from 'expo-router';

const VideoList = ({ videos }) => {
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloading, setDownloading] = useState({});
  const [downloadedVideos, setDownloadedVideos] = useState({});

  // Verifica e atualiza a lista de vídeos baixados
  const checkDownloadedVideos = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const downloadedVideoIds = files.map(file => file.split('.').slice(0, -1).join('.')); // Obtém apenas os IDs dos vídeos baixados
      const downloadedVideosObj = {};
      downloadedVideoIds.forEach(id => {
        downloadedVideosObj[id] = true;
      });
      setDownloadedVideos(downloadedVideosObj);
    } catch (error) {
      console.error('Erro ao listar vídeos baixados:', error);
    }
  };

  useEffect(() => {
    checkDownloadedVideos();
  }, []);

  // Função para obter o título limpo (sem acentos e caracteres especiais)
  const cleanVideoTitle = (title) => {
    return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const getVideoUrl = (resolucoes) => {
    if (!resolucoes) {
      return null;
    }
    return resolucoes['720p'] || resolucoes['480p'] || resolucoes['360p'] || null;
  };

  const handleDownload = async (video) => {
    const videoUrl = getVideoUrl(video.resolucoes);

    if (!videoUrl) {
      Alert.alert('Erro', 'URL do vídeo não disponível.');
      console.error('Erro: URL do vídeo não disponível:', video);
      return;
    }

    try {
      const cleanTitle = cleanVideoTitle(video.titulo);
      const videoExists = !!downloadedVideos[cleanTitle];

      if (videoExists) {
        Alert.alert('Aviso', 'Este vídeo já foi baixado.');
        return;
      }

      setDownloading((prev) => ({ ...prev, [cleanTitle]: true }));
      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        `${FileSystem.documentDirectory}${cleanTitle}.mp4`,
        {},
        (progress) => {
          const progressValue = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
          setDownloadProgress((prev) => ({ ...prev, [cleanTitle]: progressValue }));
          if (progressValue === 100) {
            setTimeout(() => {
              setDownloadProgress((prev) => ({ ...prev, [cleanTitle]: 0 }));
              setDownloading((prev) => ({ ...prev, [cleanTitle]: false }));
              checkDownloadedVideos(); // Atualiza a lista de vídeos baixados após o download
            }, 1000);
          }
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      // console.log('Downloaded to:', uri);
      // Alert.alert('Sucesso', 'Download concluído com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar o vídeo:', error);
      Alert.alert('Erro', 'Erro ao baixar o vídeo. Por favor, tente novamente.');
    }
  };

  const handleDelete = async (video) => {
    try {
      const cleanTitle = cleanVideoTitle(video.titulo);
      const fileUri = `${FileSystem.documentDirectory}${cleanTitle}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Vídeo não encontrado para exclusão.');
        return;
      }

      await FileSystem.deleteAsync(fileUri);
      // Alert.alert('Sucesso', 'Vídeo excluído com sucesso!');
      checkDownloadedVideos(); // Atualiza a lista de vídeos baixados após a exclusão
    } catch (error) {
      console.error('Erro ao excluir o vídeo:', error);
      Alert.alert('Erro', 'Erro ao excluir o vídeo. Por favor, tente novamente.');
    }
  };

  return (
    <View>
      {videos.map((video, index) => (
        <View key={index} style={styles.videoBox}>
          <View style={styles.buttonsContainer}>
            {!downloading[cleanVideoTitle(video.titulo)] && !downloadedVideos[cleanVideoTitle(video.titulo)] ? (
              <Pressable
                style={[styles.actionButton]}
                onPress={() => handleDownload(video)}
              >
                <FontAwesome name="download" size={24} color="#fff" />
              </Pressable>
            ) : downloading[cleanVideoTitle(video.titulo)] ? (
              <Pressable style={[styles.actionButton]}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.progressText}>{`${downloadProgress[cleanVideoTitle(video.titulo)]?.toFixed(0) || 0}%`}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionButton]}
                onPress={() => handleDelete(video)}
              >
                <FontAwesome name="trash" size={24} color="#fff" />
              </Pressable>
            )}
          </View>

          <Text style={[styles.videoLink, styles.whiteText]}>{video.titulo}</Text>
          
        </View>
      ))}
    </View>
  );
};

export default function Aula() {
  const { aula } = useLocalSearchParams();
  const aulaJson = JSON.parse(aula);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: aulaJson.nome,
        }} />

        <View key={aulaJson.id} style={styles.aulaContainer}>
          <View style={styles.cursoContainer}>
            <Text style={[styles.cursoNome, styles.whiteText]}>{aulaJson.nome.toUpperCase()}</Text>
            <Text style={styles.whiteText}>{aulaJson.conteudo}</Text>
            <Text style={[styles.videoTitle, styles.whiteText]}>ARQUIVOS:</Text>
            {!aulaJson.pdf && !aulaJson.pdf_grifado && !aulaJson.pdf_simplificado ? (
              <Text style={styles.whiteText}>NENHUM PDF DISPONÍVEL</Text>
            ) : (
              <>
                {aulaJson.pdf && (
                  <Pressable onPress={() => Linking.openURL(aulaJson.pdf)} style={styles.link}>
                    <Text style={[styles.linkText, styles.A5B99CText]}>PDF NORMAL</Text>
                  </Pressable>
                )}
                {aulaJson.pdf_grifado && (
                  <Pressable onPress={() => Linking.openURL(aulaJson.pdf_grifado)} style={styles.link}>
                    <Text style={[styles.linkText, styles.A5B99CText]}>PDF GRIFADO</Text>
                  </Pressable>
                )}
                {aulaJson.pdf_simplificado && (
                  <Pressable onPress={() => Linking.openURL(aulaJson.pdf_simplificado)} style={styles.link}>
                    <Text style={[styles.linkText, styles.A5B99CText]}>PDF SIMPLIFICADO</Text>
                  </Pressable>
                )}
              </>
            )}
            <Text style={[styles.videoTitle, styles.whiteText]}>VIDEOS:</Text>
            <VideoList videos={aulaJson.videos} />
          </View>
        </View>
      </ScrollView>
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
    color: '#A5B99C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  cursoNome:{
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 1,
    marginBottom: 5,

  },
  cursoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#A5B99C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  progressText: {
    color: '#fff',
    marginLeft: 10,
  },
  videoBox: {
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 10,
    padding: 10,
    width:'99%',
    flexDirection: 'row', // Adicionado para ajustar o layout dos vídeos na lista
    alignItems: 'center', // Adicionado para centralizar verticalmente o conteúdo
  },
});
