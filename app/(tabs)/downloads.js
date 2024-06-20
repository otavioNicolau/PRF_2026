import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, Pressable, Alert, RefreshControl, Image, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useNavigation, Link } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';
import * as VideoThumbnails from 'expo-video-thumbnails';

const DownloadedVideosScreen = () => {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // Adiciona o estado de carregamento

  const lockOrientation = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  };

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
      setLoading(false); // Define o estado de carregamento como falso quando terminar
    }
  };

  useEffect(() => {
    loadDownloadedVideos();
    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

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
      <Stack.Screen options={{
        headerStyle: {
          backgroundColor: '#1B1B1B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        title: 'DOWNLOADS',
        headerTitleAlign: 'center',
      }} />
      <View style={styles.container}>
        {loading ? (

          <>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={[styles.whiteText]}>Carregando</Text>
          </>

        ) : (
          <SectionList
            sections={getSections()}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              item.data ? (
                <View>
                  <Text style={styles.subSectionHeader}>{item.title.toUpperCase()}</Text>
                  {item.data.map(video => (
                    <Pressable
                      key={video.id}
                      onPress={() => navigation.navigate('video', { video: `${FileSystem.documentDirectory}${video.id}.mp4`, titulo: video.titulo, id_video: video.id })}
                      onLongPress={() =>
                        Alert.alert(
                          `Excluir vídeo: ${video.titulo}`,
                          'Tem certeza que deseja excluir este vídeo?',
                          [
                            {
                              text: 'Cancelar',
                              style: 'cancel'
                            },
                            {
                              text: 'Confirmar',
                              onPress: () => handleDelete(video.id)
                            }
                          ],
                          { cancelable: true }
                        )
                      }
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? '#333333' : '#1B1B1B',
                        marginTop: 5,
                        marginBottom: 5,
                        marginLeft: 5,
                        marginRight: 5
                      })}
                    >
                      <View style={styles.videoBox}>
                        <View style={styles.videoInfo}>
                          <Text style={styles.videoTitle}>{video.titulo}</Text>
                          <Text style={styles.videoText}>{video.assunto}</Text>
                        </View>
                      </View>
                    </Pressable>
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
                colors={['#1B1B1B']}
                tintColor="#fff"
              />
            }
            ListEmptyComponent={<Text style={styles.noVideosText}>Nenhum vídeo baixado.</Text>}
            ListFooterComponent={
              <Pressable style={styles.deleteAllButton} onPress={handleDeleteAll}>
                <Text style={styles.deleteAllButtonText}>Deletar Todos os Vídeos</Text>
              </Pressable>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  whiteText: {
    color: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#1B1B1B',
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
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
});

export default DownloadedVideosScreen;
