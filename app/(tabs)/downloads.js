import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, Pressable, Alert, RefreshControl, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';
import * as VideoThumbnails from 'expo-video-thumbnails';

const DownloadedVideosScreen = () => {
  const db = useSQLiteContext();
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
    lockOrientation();

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

      for (const row of allVideos) {
        const videoPath = `${FileSystem.documentDirectory}${row.id_video}.mp4`;
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoPath);
          const video = {
            id: row.id_video,
            uri: row.uri,
            filename: row.id_video + '.mp4',
            titulo: row.titulo,
            id_video: row.id_video,
            position: row.position,
            thumbnailUri: uri,
            aula: row.aula,
            materia: row.materia,
            assunto: row.assunto,
          };
          if (!uniqueVideos[video.id]) {
            uniqueVideos[video.id] = video;
          }
        } catch (error) {
          console.error(`Erro ao gerar thumbnail para o vídeo ${videoPath}:`, error);
        }
      }

      setDownloadedVideos(Object.values(uniqueVideos));
    } catch (error) {
      console.error('Erro ao carregar vídeos baixados:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (videoId) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${videoId}.mp4`;
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

              await Promise.all(videosToDelete.map(file => FileSystem.deleteAsync(`${FileSystem.documentDirectory}${file}`)));
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

  const getSections = () => {
    const sections = downloadedVideos.reduce((acc, video) => {
      let materiaSection = acc.find(sec => sec.title === video.materia);
      if (!materiaSection) {
        materiaSection = { title: video.materia, data: [] };
        acc.push(materiaSection);
      }
      let aulaSection = materiaSection.data.find(sec => sec.title === video.aula);
      if (!aulaSection) {
        aulaSection = { title: video.aula, data: [] };
        materiaSection.data.push(aulaSection);
      }
      aulaSection.data.push(video);
      return acc;
    }, []);
    return sections;
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: "Downloads",
        }}
      />

      <SectionList
        sections={getSections()}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          item.data ? (
            <View>
              <Text style={styles.subSectionHeader}>{item.title.toUpperCase()}</Text>
              {item.data.map(video => (
                <View key={video.id} style={styles.videoBox}>
                  {/* <Image source={{ uri: video.thumbnailUri }} style={styles.thumbnail} resizeMode="cover" /> */}
                  <View style={styles.videoInfo}>
                    <Link
                      style={[styles.videoLink, styles.videoText, styles.whiteText]}
                      href={{ pathname: '/video', params: { video: `${FileSystem.documentDirectory}${video.id}.mp4`, titulo: video.titulo, id_video: video.id } }}
                    >
                      <Text style={styles.videoTitle}>{video.titulo}</Text>
                    </Link>
                    <Link
                      style={[styles.videoLink, styles.videoText, styles.whiteText]}
                      href={{ pathname: '/video', params: { video: `${FileSystem.documentDirectory}${video.id}.mp4`, titulo: video.titulo, id_video: video.id } }}
                    >
                      <Text style={styles.videoText}>{video.assunto}</Text>
                    </Link>
                  </View>
                  <Pressable style={styles.actionButton} onPress={() => handleDelete(video.id)}>
                    <FontAwesome name="trash" size={24} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
        ListEmptyComponent={<Text style={styles.noVideosText}>Nenhum vídeo baixado.</Text>}
        ListFooterComponent={
          <Pressable style={styles.deleteAllButton} onPress={handleDeleteAll}>
            <Text style={styles.deleteAllButtonText}>Deletar Todos os Vídeos</Text>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  container: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  videoList: {
    marginBottom: 20,
  },
  videoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 5,
    padding: 5,

  },
  videoInfo: {
    flex: 1,
    marginLeft: 10,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoText: {
    color: '#ffffff',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideosText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteAllButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  deleteAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  videoLink: {
    color: '#FF0000',
  },
  whiteText: {
    color: '#ffffff',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#1B1B1B',
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  subSectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#2C2C2C',
    color: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 0,
    paddingLeft: 15,
  },
});

export default DownloadedVideosScreen;
