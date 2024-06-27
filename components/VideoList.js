import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from 'expo-vector-icons';
import { useLocalSearchParams, Stack, Link, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

const VideoList = ({ videos, aula, assunto, materia, pdf, onOpenPdf, onDownloadPdf }) => {
  const navigation = useNavigation();

  const db = useSQLiteContext();
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloading, setDownloading] = useState({});
  const [downloadedVideos, setDownloadedVideos] = useState({});
  const [watchedVideos, setWatchedVideos] = useState({});

  const insertVideo = async (db, id_video, titulo, aula, materia, assunto, resolucao_720p, resolucao_480p, resolucao_360p, uri) => {
    try {
      await db.runAsync(
        `INSERT INTO videos (id_video, titulo, aula, materia, assunto, resolucao_720p, resolucao_480p, resolucao_360p, uri ) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?);`,
        [id_video, titulo, aula, materia, assunto, resolucao_720p, resolucao_480p, resolucao_360p, uri]
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
      await insertVideo(db, video.id, video.titulo, aula, materia, assunto, video.resolucoes['720p'], video.resolucoes['480p'], video.resolucoes['360p'], uri);

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

  const checkIfWatched = async (videoId) => {
    try {
      const result = await db.getAllAsync('SELECT watched FROM videos WHERE id_video = ?;', [videoId]);
      return result.length > 0 && result[0].watched === 1;
    } catch (error) {
      console.error('Erro ao consultar vídeo assistido:', error);
      return false;
    }
  };

  const markAsWatched = async (video) => {
    try {
      const isWatched = watchedVideos[video.id]; // Verifica se o vídeo já está marcado como assistido

      if (isWatched) {
        // Se já estiver marcado, desmarca
        await db.runAsync('UPDATE videos SET watched = 0 WHERE id_video = ?;', [video.id]);
        setWatchedVideos((prev) => ({ ...prev, [video.id]: false })); // Atualiza o estado local para desmarcado
        // Alert.alert('Aviso', 'Vídeo desmarcado como assistido.');
      } else {
        // Se não estiver marcado, marca como assistido
        await db.runAsync('UPDATE videos SET watched = 1 WHERE id_video = ?;', [video.id]);
        setWatchedVideos((prev) => ({ ...prev, [video.id]: true })); // Atualiza o estado local para marcado
        // Alert.alert('Aviso', 'Vídeo marcado como assistido.');
      }
    } catch (error) {
      console.error('Erro ao marcar vídeo como assistido:', error);
      Alert.alert('Erro', 'Erro ao marcar vídeo como assistido. Por favor, tente novamente.');
    }
  };

  useEffect(() => {
    const checkWatchedVideos = async () => {
      const watchedStatuses = {};
      for (const video of videos) {
        const isWatched = await checkIfWatched(video.id);
        watchedStatuses[video.id] = isWatched;
      }
      setWatchedVideos(watchedStatuses);
    };
    checkWatchedVideos();
  }, [videos]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>Vídeos:</Text>
        {videos.map((video, index) => (
          <View key={index} style={styles.videoContainer}>
            <Text style={styles.videoTitle}>{video.titulo}</Text>
            {downloadedVideos[video.id] ? (
              <>
                <Pressable onPress={() => markAsWatched(video)}>
                  <FontAwesome name={watchedVideos[video.id] ? 'eye' : 'eye-slash'} size={24} color="blue" />
                </Pressable>
                <Pressable onPress={() => handleDelete(video)}>
                  <FontAwesome name="trash" size={24} color="red" />
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => handleDownload(video)} disabled={!!downloading[video.id]}>
                {downloading[video.id] ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                  <FontAwesome name="download" size={24} color="blue" />
                )}
              </Pressable>
            )}
          </View>
        ))}
        {pdf && pdf.map((file, index) => (
          <View key={index} style={styles.pdfContainer}>
            <Text style={styles.pdfTitle}>{file.nome}</Text>
            <Pressable onPress={() => onOpenPdf(file.url)}>
              <FontAwesome name="eye" size={24} color="blue" />
            </Pressable>
            <Pressable onPress={() => onDownloadPdf(file.url, file.nome)}>
              <FontAwesome name="download" size={24} color="blue" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  videoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  pdfTitle: {
    flex: 1,
    fontSize: 16,
  },
});

export default VideoList;
