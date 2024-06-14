import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Stack, Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

const VideoList = ({ videos }) => {


  const db = useSQLiteContext();
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloading, setDownloading] = useState({});
  const [downloadedVideos, setDownloadedVideos] = useState({});

  const insertVideo = async (db, id_video, titulo, resolucao_720p, resolucao_480p, resolucao_360p, uri) => {
    try {
      await db.runAsync(
        `INSERT INTO videos (id_video, titulo, resolucao_720p, resolucao_480p, resolucao_360p, uri) VALUES (?, ?, ?, ?, ?, ?);`,
        [id_video, titulo, resolucao_720p, resolucao_480p, resolucao_360p, uri]
      );
    } catch (error) {
      console.error('Erro ao inserir vídeo:', error);
    }
  };

  const deleteVideo = async (db, id_video) => {
    try {
      await db.runAsync(`DELETE FROM videos WHERE id_video = ?;`, [id_video]);
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
    }
  };

  const checkDownloadedVideos = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const downloadedVideoIds = files.map(file => file.split('.').slice(0, -1).join('.'));
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
      const videoExists = !!downloadedVideos[video.id];

      if (videoExists) {
        Alert.alert('Aviso', 'Este vídeo já foi baixado.');
        return;
      }

      setDownloading((prev) => ({ ...prev, [video.id]: true }));
      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        `${FileSystem.documentDirectory}${video.id}.mp4`,
        {},
        (progress) => {
          const progressValue = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
          setDownloadProgress((prev) => ({ ...prev, [video.id]: progressValue }));
          if (progressValue === 100) {
            setTimeout(() => {
              setDownloadProgress((prev) => ({ ...prev, [video.id]: 0 }));
              setDownloading((prev) => ({ ...prev, [video.id]: false }));
              checkDownloadedVideos(); // Atualiza a lista de vídeos baixados após o download
            }, 1000);
          }
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      await insertVideo(db, video.id, video.titulo, video.resolucoes['720p'], video.resolucoes['480p'], video.resolucoes['360p'], uri);
    } catch (error) {
      console.error('Erro ao baixar o vídeo:', error);
      Alert.alert('Erro', 'Erro ao baixar o vídeo. Por favor, tente novamente.');
    }
  };

  const handleDelete = async (video) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${video.id}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Vídeo não encontrado para exclusão.');
        return;
      }

      await FileSystem.deleteAsync(fileUri);
      await deleteVideo(db, video.id);
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
            {!downloading[video.id] && !downloadedVideos[video.id] ? (
              <Pressable
                style={[styles.actionButton]}
                onPress={() => handleDownload(video)}
              >
                <FontAwesome name="download" size={16} color="#fff" />
              </Pressable>
            ) : downloading[video.id] ? (
              <Pressable style={[styles.actionButton]}>
                {/* <ActivityIndicator size="small" color="#fff" /> */}
                <Text style={styles.progressText}>{`${downloadProgress[video.id]?.toFixed(0) || 0}%`}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionButtonRed]}
                onPress={() => handleDelete(video)}
              >
                <FontAwesome name="trash" size={14} color="#fff" />
              </Pressable>
            )}
          </View>

          {downloadedVideos[video.id] ? (
            <Link
              style={[styles.videoLink, styles.videoText, styles.whiteText]}
              href={{ pathname: '/videos2', params: { video: `${FileSystem.documentDirectory}${video.id}.mp4`, filename: video.titulo } }}
            >
              <Text style={[styles.videoLink, styles.whiteText]}>{video.titulo}</Text>
            </Link>
          ) : (
            <Link
              style={[styles.videoLink, styles.videoText, styles.whiteText]}
              href={{ pathname: '/videos2', params: { video: getVideoUrl(video.resolucoes), filename: video.titulo } }}
            >
              <Text style={[styles.videoLink, styles.whiteText]}>{video.titulo}</Text>
            </Link>
          )}
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
  cursoNome: {
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    // borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonRed: {
    backgroundColor: 'rgb(255, 0, 0)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    // borderRadius: 5,
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
    width: '99%',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
