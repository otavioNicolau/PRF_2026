import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';

export default function VideosD() {
  const { video, titulo, id_video } = useLocalSearchParams();
  const videoRef = useRef(null);
  const db = useSQLiteContext();
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };

    lockOrientation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    const loadVideoPosition = async () => {
      try {
        const result = await db.getFirstAsync('SELECT position FROM videos WHERE id_video = ?;', [id_video]);
        if (result) {
          const position = result.position;
          setVideoPosition(position);
          if (videoRef.current) {
            await videoRef.current.setPositionAsync(position);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadVideoPosition();
  }, [id_video]);

  useEffect(() => {

    const saveVideoPosition = async () => {
      try {
        const result = await db.getAllAsync('SELECT COUNT(*) AS count FROM videos WHERE id_video = ?;', [id_video]);
        const count = result[0]?.count || 0;

        if (count > 0) {
          // Update if record exists
          await db.runAsync(
            'UPDATE videos SET titulo = ?, position = ? WHERE id_video = ?;',
            [titulo, videoPosition, id_video]
          );
        } else {
          // Insert if record does not exist
          await db.runAsync(
            'INSERT INTO videos (id_video, titulo, position) VALUES (?,?,?);',
            [id_video, titulo, videoPosition]
          );
        }
      } catch (e) {
        console.error(e);
      }
    };


    saveVideoPosition();
  }, [id_video, titulo, videoPosition]);

  const increaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.min(prevSpeed + 0.25, 2.0));
  }, []);

  const decreaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.max(prevSpeed - 0.25, 0.5));
  }, []);

  const handleFullscreenUpdate = async ({ fullscreenUpdate }) => {
    if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT) {
      setIsFullscreen(true);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS) {
      setIsFullscreen(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
    setControlsVisible(true); // Mostra os controles ao clicar no vídeo
    startControlsTimer(); // Reinicia o temporizador ao clicar no vídeo
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setVideoPosition(status.positionMillis);
      setVideoDuration(status.durationMillis || 0);
    }
  };

  const handleSliderValueChange = async (value) => {
    if (videoDuration > 0) {
      const newPosition = value * videoDuration;
      setVideoPosition(newPosition);
      if (videoRef.current) {
        await videoRef.current.setPositionAsync(newPosition);
      }
    }
  };

  const startControlsTimer = () => {
    setControlsVisible(true); // Mostra os controles ao iniciar o temporizador
    clearTimeout(timerId); // Limpa o temporizador existente
    const timerId = setTimeout(() => {
      setControlsVisible(false); // Oculta os controles após 3 segundos de inatividade
    }, 3000);
  };

  const handleTouchScreen = () => {
    setControlsVisible(true); // Mostra os controles ao tocar na tela
    startControlsTimer(); // Reinicia o temporizador ao tocar na tela
  };

  const formatTime = (timeInMillis) => {
    if (!timeInMillis) return '00:00';
    const totalSeconds = timeInMillis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  return (
    <SafeAreaView style={styles.containerArea}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: titulo,
        }}
      />
      <TouchableWithoutFeedback onPress={handleTouchScreen}>
        <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideoContainer]}>
          <Video
            ref={videoRef}
            source={{ uri: video }}
            style={styles.video}
            resizeMode="contain"
            rate={videoSpeed}
            onFullscreenUpdate={handleFullscreenUpdate}
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            useNativeControls={isFullscreen}
          />
          {!isFullscreen && controlsVisible && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
                <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color="white" />
              </TouchableOpacity>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={videoDuration > 0 ? videoPosition / videoDuration : 0}
                onValueChange={handleSliderValueChange}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
                thumbTintColor="#FFFFFF"
              />
              <Text style={styles.timeDisplay}>
                {formatTime(videoPosition)} / {formatTime(videoDuration)}
              </Text>
              <TouchableOpacity onPress={decreaseSpeed} style={styles.controlButton}>
                <MaterialIcons name="remove" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.controlText}>{videoSpeed.toFixed(2)}x</Text>
              <TouchableOpacity onPress={increaseSpeed} style={styles.controlButton}>
                <MaterialIcons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideoContainer: {
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  timeDisplay: {
    color: '#FFF',
    fontSize: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
});
