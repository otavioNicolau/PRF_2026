import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';

const DownloadedVideosScreen = () => {
  const db = useSQLiteContext();
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Trava a orientação da tela em horizontal
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
    lockOrientation();
    // Desbloqueia a orientação da tela ao desmontar o componente
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    loadDownloadedVideos();
  }, []);

  const loadDownloadedVideos = async () => {
    try {
      const allVideos = await db.getAllAsync('SELECT * FROM videos WHERE uri IS NOT NULL;');
      const uniqueVideos = {};
      allVideos.forEach(row => {
        const video = {
          id: row.id_video,
          uri: row.uri,
          filename: row.id_video + '.mp4',
          titulo: row.titulo,
          id_video: row.id_video,
          position: row.position

        };
        if (!uniqueVideos[video.id]) {
          uniqueVideos[video.id] = video;
        }
      });
      const videos = Object.values(uniqueVideos);
      setDownloadedVideos(videos);
    } catch (error) {
      console.error('Erro ao carregar vídeos baixados:', error);
    } finally {
      setRefreshing(false);
    }
  };
  

  const handleDelete = async (videoId) => {
    try {
      const fileUri = FileSystem.documentDirectory + `${videoId}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Vídeo não encontrado para exclusão.');
        return;
      }

      await FileSystem.deleteAsync(fileUri);
      await db.runAsync('DELETE FROM videos WHERE id_video = ?', [videoId]);
      Alert.alert('Sucesso', 'Vídeo excluído com sucesso!');
      loadDownloadedVideos();
    } catch (error) {
      console.error('Erro ao excluir o vídeo:', error);
      Alert.alert('Erro', 'Erro ao excluir o vídeo. Por favor, tente novamente.');
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir todos os vídeos baixados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const allFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
              const videosToDelete = allFiles.filter(file => file.endsWith('.mp4'));

              if (videosToDelete.length === 0) {
                Alert.alert('Info', 'Não há vídeos para deletar.');
                return;
              }

              const deletePromises = videosToDelete.map(file => FileSystem.deleteAsync(FileSystem.documentDirectory + file));
              await Promise.all(deletePromises);
              await db.runAsync('DELETE FROM videos');
              Alert.alert('Sucesso', 'Todos os vídeos foram deletados com sucesso!');
              loadDownloadedVideos();
            } catch (error) {
              console.error('Erro ao excluir os vídeos:', error);
              Alert.alert('Erro', 'Erro ao excluir os vídeos. Por favor, tente novamente.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDownloadedVideos();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#A5B99C']}
            tintColor="#A5B99C"
          />
        }
      >
        <Stack.Screen
          options={{
            headerStyle: { backgroundColor: '#1B1B1B' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            title: 'Downloads'
          }}
        />

        <View style={styles.videoList}>
          {downloadedVideos.map(video => (
            <View key={video.id} style={styles.videoBox}>
              <View style={styles.videoInfo}>
                <Link
                  style={[styles.videoLink, styles.videoText, styles.whiteText]}
                  href={{ pathname: '/videos2', params: { video: `${FileSystem.documentDirectory}${video.id}.mp4`, titulo: video.titulo, id_video: video.id   } }}
                  >
                  <Text style={styles.videoTitle}>{video.titulo}</Text>
                  <Text style={styles.videoTitle}> position: {video.position}</Text>
                  <Text style={styles.videoTitle}> ID: {video.id_video}</Text>

                </Link>
                <Link
                  style={[styles.videoLink, styles.videoText, styles.whiteText]}
                  href={{ pathname: '/videos2', params: { video: `${FileSystem.documentDirectory}${video.id}.mp4`, titulo: video.titulo, id_video: video.id   } }}
                  >
                  {video.filename && <Text style={styles.filenameText}>Nome do Arquivo {video.filename}</Text>}
                </Link>
              </View>
              <View style={styles.buttonsContainer}>
                <Pressable style={styles.actionButton} onPress={() => handleDelete(video.id)}>
                  <FontAwesome name="trash" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
          {downloadedVideos.length === 0 && <Text style={styles.noVideosText}>Nenhum vídeo baixado.</Text>}
        </View>
        <Pressable style={styles.deleteAllButton} onPress={handleDeleteAll}>
          <Text style={styles.deleteAllButtonText}>Deletar Todos os Vídeos</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1B1B1B' },
  container: { backgroundColor: '#1B1B1B', paddingVertical: 20, paddingHorizontal: 16 },
  videoList: { marginBottom: 20 },
  videoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ffffff', marginBottom: 10, padding: 10 },
  videoInfo: { flex: 1, marginLeft: 10 },
  videoTitle: { color: '#ffffff', fontSize: 16 },
  filenameText: { color: '#A5B99C', fontSize: 14, marginTop: 5 },
  buttonsContainer: { marginLeft: 10 },
  actionButton: { backgroundColor: '#A5B99C', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  noVideosText: { color: '#ffffff', fontSize: 16, textAlign: 'center' },
  deleteAllButton: { backgroundColor: '#A5B99C', paddingVertical: 12, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  deleteAllButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default DownloadedVideosScreen;
