import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Video } from 'expo-av'; // Importa o componente Video do expo-av
import { Stack, Link } from 'expo-router';

const DownloadedVideosScreen = () => {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Carrega a lista de vídeos baixados ao montar o componente
  useEffect(() => {
    loadDownloadedVideos();
  }, []);

  // Função para limpar o título do vídeo removendo acentos e caracteres especiais
  const cleanVideoTitle = (title) => {
    return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Função para carregar a lista de vídeos baixados
  const loadDownloadedVideos = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const videos = files
        .filter(file => file.endsWith('.mp4')) // Filtra apenas os arquivos .mp4
        .map(file => {
          const title = cleanVideoTitle(file.split('.').slice(0, -1).join('.'));
          return {
            id: title,
            uri: FileSystem.documentDirectory + file,
            filename: file, // Adiciona o nome do arquivo original
          };
        });
      setDownloadedVideos(videos);
    } catch (error) {
      console.error('Erro ao carregar vídeos baixados:', error);
    } finally {
      setRefreshing(false); // Define refreshing como false para parar o indicador de carregamento
    }
  };

  // Função para lidar com a exclusão de um vídeo baixado
  const handleDelete = async (videoId) => {
    try {
      const fileUri = FileSystem.documentDirectory + `${videoId}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Vídeo não encontrado para exclusão.');
        return;
      }

      await FileSystem.deleteAsync(fileUri);
      Alert.alert('Sucesso', 'Vídeo excluído com sucesso!');
      // Atualiza a lista de vídeos baixados após a exclusão
      loadDownloadedVideos();
    } catch (error) {
      console.error('Erro ao excluir o vídeo:', error);
      Alert.alert('Erro', 'Erro ao excluir o vídeo. Por favor, tente novamente.');
    }
  };

  // Função para lidar com a exclusão de todos os vídeos baixados
  const handleDeleteAll = async () => {
    // Pergunta de confirmação antes de deletar todos os vídeos
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir todos os vídeos baixados?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
              const videosToDelete = files.filter(file => file.endsWith('.mp4'));

              if (videosToDelete.length === 0) {
                Alert.alert('Info', 'Não há vídeos para deletar.');
                return;
              }

              const deletePromises = videosToDelete.map(file => {
                const fileUri = FileSystem.documentDirectory + file;
                return FileSystem.deleteAsync(fileUri);
              });

              await Promise.all(deletePromises);
              Alert.alert('Sucesso', 'Todos os vídeos foram deletados com sucesso!');
              // Atualiza a lista de vídeos baixados após a exclusão
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

  // Função para atualizar a lista de vídeos baixados ao puxar para baixo
  const onRefresh = () => {
    setRefreshing(true); // Define refreshing como true para mostrar o indicador de carregamento
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
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: 'Downloads'
          }}
        />

        <View style={styles.videoList}>
          {downloadedVideos.map(video => (

            <View key={video.id} style={styles.videoBox}>
              {/* <Video
                source={{ uri: video.uri }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
              /> */}


              <View style={styles.videoInfo}>

                <Link style={[styles.videoLink, styles.videoText, styles.whiteText]}
                  href={{
                    pathname: '/videos2',
                    params: { video: video.uri, filename: video.filename },
                  }}
                >
                  <Text style={styles.videoTitle}>{video.id}</Text>

                </Link>
                <Link style={[styles.videoLink, styles.videoText, styles.whiteText]}
                  href={{
                    pathname: '/videos2',
                    params: { video: video.uri, filename: video.filename },
                  }}
                >
                  {video.filename && (
                    <Text style={styles.filenameText}>Nome do Arquivo {video.filename}</Text>
                  )}
                </Link>
              </View>
              <View style={styles.buttonsContainer}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleDelete(video.id)}
                >
                  <FontAwesome name="trash" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
          {downloadedVideos.length === 0 && (
            <Text style={styles.noVideosText}>Nenhum vídeo baixado.</Text>
          )}
        </View>
        <Pressable style={styles.deleteAllButton} onPress={handleDeleteAll}>
          <Text style={styles.deleteAllButtonText}>Deletar Todos os Vídeos</Text>
        </Pressable>
      </ScrollView>
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
    borderColor: '#ffffff',
    marginBottom: 10,
    padding: 10,
  },
  video: {
    width: 100,
    height: 80,
    backgroundColor: 'black',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 10,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  filenameText: {
    color: '#A5B99C',
    fontSize: 14,
    marginTop: 5,
  },
  buttonsContainer: {
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#A5B99C',
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
    backgroundColor: '#A5B99C',
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
