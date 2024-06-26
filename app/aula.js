import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, Link, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';


const VideoList = ({ videos, aula, assunto, materia }) => {
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

  // useEffect(() => {
  //   checkDownloadedVideos();
  // }, []);

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
        const result = await db.getAllAsync('SELECT COUNT(*) AS count FROM videos WHERE id_video = ?;', [video.id]);
        const count = result[0]?.count || 0;

        if (count > 0) {
          await db.runAsync('UPDATE videos SET watched = 1 WHERE id_video = ?;', [video.id]);
        } else {
          await db.runAsync('INSERT INTO videos (id_video, titulo, watched) VALUES (?,?,?);', [video.id, video.titulo, 1]);
        }

        setWatchedVideos((prev) => ({ ...prev, [video.id]: true })); // Atualiza o estado local para marcado
        // Alert.alert('Aviso', 'Vídeo marcado como assistido.');
      }
    } catch (error) {
      console.error('Erro ao marcar como assistido:', error);
      Alert.alert('Erro', 'Erro ao marcar o vídeo como assistido. Por favor, tente novamente.');
    }
  };

  const updateWatchedStatus = async () => {
    const updatedWatchedVideos = {};
    for (const video of videos) {
      const isWatched = await checkIfWatched(video.id);
      updatedWatchedVideos[video.id] = isWatched;
    }
    setWatchedVideos(updatedWatchedVideos);
  };

  const handleMarkAsWatched = (video) => {
    markAsWatched(video);
  };

  useEffect(() => {
    checkDownloadedVideos();
    updateWatchedStatus();
  }, [videos]);

  return (
    <View>
      
      {videos.map((video, index) => (
        <View key={index}>
          {downloadedVideos[video.id] ? (
            <Pressable
              onPress={() =>
                navigation.navigate('video', {
                  video: `${FileSystem.documentDirectory}${video.id}.mp4`,
                  titulo: video.titulo,
                  id_video: video.id,
                })
              }
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1B1B1B',
                marginTop: 5,
                marginBottom: 5,
                marginLeft: 5,
                marginRight: 5,
                width: '98%',
              })}
            >
              <View style={styles.videoBox}>
                <View style={styles.buttonsContainer}>
                  {!downloading[video.id] && !downloadedVideos[video.id] ? (
                    <>
                      <Pressable
                        style={[styles.actionButton]}
                        onPress={() => handleDownload(video)}
                      >
                        <FontAwesome name="download" size={16} color="#fff" />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          watchedVideos[video.id] ? styles.watchedButton : null,
                        ]}
                        onPress={() => handleMarkAsWatched(video)}
                      >
                        <FontAwesome
                          name={watchedVideos[video.id] ? 'eye' : 'eye-slash'}
                          size={16}
                          color="#fff"
                        />
                      </Pressable>
                    </>
                  ) : downloading[video.id] ? (
                    <Pressable style={[styles.actionButton]}>
                      <Text style={styles.progressText}>{`${downloadProgress[video.id]?.toFixed(
                        0
                      ) || 0}%`}</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.actionButtonRed]}
                        onPress={() => handleDelete(video)}
                      >
                        <FontAwesome name="trash" size={14} color="#fff" />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          watchedVideos[video.id] ? styles.watchedButton : null,
                        ]}
                        onPress={() => handleMarkAsWatched(video)}
                      >
                        <FontAwesome
                          name={watchedVideos[video.id] ? 'eye' : 'eye-slash'}
                          size={16}
                          color="#fff"
                        />
                      </Pressable>
                    </>
                  )}
                </View>
                <Text style={[styles.videoLink, styles.whiteText]}>
                  {video.titulo}
                </Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                navigation.navigate('video', {
                  video: getVideoUrl(video.resolucoes),
                  titulo: video.titulo,
                  id_video: video.id,
                })
              }
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#333333' : '#1B1B1B',
                marginTop: 5,
                marginBottom: 5,
                marginLeft: 5,
                marginRight: 5,
                width: '98%'
              })}
            >
              <View style={styles.videoBox}>
                <View style={styles.buttonsContainer}>
                  {!downloading[video.id] && !downloadedVideos[video.id] ? (
                    <>
                      <Pressable
                        style={[styles.actionButton]}
                        onPress={() => handleDownload(video)}
                      >
                        <FontAwesome name="download" size={16} color="#fff" />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          watchedVideos[video.id] ? styles.watchedButton : null,
                        ]}
                        onPress={() => handleMarkAsWatched(video)}
                      >
                        <FontAwesome
                          name={watchedVideos[video.id] ? 'eye' : 'eye-slash'}
                          size={16}
                          color="#fff"
                        />
                      </Pressable>
                    </>
                  ) : downloading[video.id] ? (
                    <>
                      <Pressable style={[styles.actionButton]}>
                        <Text style={styles.progressText}>{`${downloadProgress[video.id]?.toFixed(
                          0
                        ) || 0}%`}</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          watchedVideos[video.id] ? styles.watchedButton : null,
                        ]}
                        onPress={() => handleMarkAsWatched(video)}
                      >
                        <FontAwesome
                          name={watchedVideos[video.id] ? 'eye' : 'eye-slash'}
                          size={16}
                          color="#fff"
                        />
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.actionButtonRed]}
                        onPress={() => handleDelete(video)}
                      >
                        <FontAwesome name="trash" size={14} color="#fff" />
                      </Pressable>
                      <Pressable
                        style={[
                          styles.actionButton,
                          watchedVideos[video.id] ? styles.watchedButton : null,
                        ]}
                        onPress={() => handleMarkAsWatched(video)}
                      >
                        <FontAwesome
                          name={watchedVideos[video.id] ? 'eye' : 'eye-slash'}
                          size={16}
                          color="#fff"
                        />
                      </Pressable>
                    </>
                  )}
                </View>
                <Text style={[styles.videoLink, styles.whiteText]}>
                  {video.titulo}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );

};

export default function Aula() {
  const navigation = useNavigation();

  const { aula, materia } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const aulaJson = JSON.parse(aula);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulação de carregamento de dados (você pode substituir por sua lógica de carregamento)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: 'AULA',
        }} />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={[styles.whiteText]}>Carregando</Text>
      </View>
    );
  }

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
            <Text style={[styles.materia, styles.whiteText]}>{materia.toUpperCase()}</Text>
            <Text style={[styles.aula, styles.whiteText]}>{aulaJson.nome.toUpperCase()}</Text>

            <Text style={styles.whiteText}>{aulaJson.conteudo}</Text>
            <Text style={[styles.videoTitle, styles.whiteText]}>ARQUIVOS:</Text>
            {!aulaJson.pdf && !aulaJson.pdf_grifado && !aulaJson.pdf_simplificado ? (
              <Text style={styles.whiteText}>NENHUM PDF DISPONÍVEL</Text>
            ) : (
              <>
                {aulaJson.pdf && (
                  <Pressable
                    onPress={() => Linking.openURL(aulaJson.pdf)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#333333' : '#1B1B1B',
                      marginBottom:10,
                    })}
                  >
                    <Text style={[styles.linkText, styles.A5B99CText]}>PDF NORMAL</Text>
                  </Pressable>
                )}
                {aulaJson.pdf_grifado && (
                  <Pressable
                    onPress={() => Linking.openURL(aulaJson.pdf_grifado)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#333333' : '#1B1B1B',
                      marginBottom:10,

                    })}
                  >
                    <Text style={[styles.linkText, styles.A5B99CText]}>PDF GRIFADO</Text>
                  </Pressable>
                )}
                {aulaJson.pdf_simplificado && (
                  <Pressable
                    onPress={() => Linking.openURL(aulaJson.pdf_simplificado)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#333333' : '#1B1B1B',
                      marginBottom:10,

                    })}
                  >
                    <Text style={[styles.A5B99CText]}>PDF SIMPLIFICADO</Text>
                  </Pressable>
                )}
              </>
            )}
            <Text style={[styles.videoTitle, styles.whiteText]}>VIDEOS:</Text>
            <VideoList materia={materia} aula={aulaJson.nome} assunto={aulaJson.conteudo} videos={aulaJson.videos} />
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
});