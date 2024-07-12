import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, TouchableWithoutFeedback, StatusBar } from 'react-native';
import { VLCPlayer, VlCPlayerView } from 'react-native-vlc-media-player';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSQLiteContext } from 'expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';

const { width, height } = Dimensions.get('window');

export default function Video1() {
  useKeepAwake();
  const { video, titulo, id_video } = useLocalSearchParams();
  const videoRef = useRef(null);
  const db = useSQLiteContext();
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastTap, setLastTap] = useState(null);
  const [tapPosition, setTapPosition] = useState({ x: 0, y: 0 });

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
            videoRef.current.seek(position / 1000);
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
          await db.runAsync(
            'UPDATE videos SET titulo = ?, position = ? WHERE id_video = ?;',
            [titulo, videoPosition, id_video]
          );
        } else {
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

  const handleFullscreenUpdate = async (fullscreen) => {
    if (fullscreen) {
      setIsFullscreen(true);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      setIsFullscreen(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.resume(false);  // Para pausar, chamamos resume(false)
    } else {
      videoRef.current.resume(true);  // Para tocar, chamamos resume(true)
    }
    setIsPlaying(!isPlaying);
    setControlsVisible(true);
    startControlsTimer();
  };

  const handlePlaybackStatusUpdate = (event) => {
    setVideoPosition(event.currentTime * 1000);
    setVideoDuration(event.duration * 1000 || 0);
  };

  const handleSliderValueChange = async (value) => {
    if (videoDuration > 0) {
      const newPosition = value * videoDuration;
      setVideoPosition(newPosition);
      if (videoRef.current) {
        videoRef.current.seek(newPosition / 1000);
      }
    }
  };

  const startControlsTimer = () => {
    setControlsVisible(true);
    clearTimeout(timerId);
    const timerId = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  const handleTouchScreen = (event) => {
    const now = Date.now();
    const touchLocation = event.nativeEvent;
    setTapPosition({ x: touchLocation.locationX, y: touchLocation.locationY });

    if (lastTap && (now - lastTap) < 300) {
      if (tapPosition.x < width / 2) {
        skipBackward();
      } else {
        skipForward();
      }
    } else {
      setLastTap(now);
      setControlsVisible(true);
      startControlsTimer();
    }
  };

  const skipForward = async () => {
    const newPosition = Math.min(videoPosition + 10000, videoDuration);
    setVideoPosition(newPosition);
    if (videoRef.current) {
      videoRef.current.seek(newPosition / 1000);
    }
  };

  const skipBackward = async () => {
    const newPosition = Math.max(videoPosition - 10000, 0);
    setVideoPosition(newPosition);
    if (videoRef.current) {
      videoRef.current.seek(newPosition / 1000);
    }
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
        }}
      />
      <StatusBar hidden={true} />

      <TouchableWithoutFeedback onPress={handleTouchScreen}>
        <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideoContainer]}>
          <VLCPlayer
            ref={videoRef}
            source={{ uri: video }}
            style={styles.video}
            resizeMode="cover"
            rate={videoSpeed}
            paused={!isPlaying}
            
            onProgress={handlePlaybackStatusUpdate}
            onBuffering={(e) => console.log('Buffering:', e)}
            onPaused={(e) => console.log('Paused:', e)}
            onStopped={(e) => console.log('Stopped:', e)}
            onPlaying={(e) => console.log('Playing:', e)}
            onEnd={(e) => console.log('End:', e)}
          />


          {!isFullscreen && controlsVisible && (
            <>
              <View style={styles.controlsContainer2}>
                <Text style={styles.timeDisplay}>{titulo}</Text>
              </View>
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
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideoContainer: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  controlsContainer2: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  controlButton: {
    padding: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeDisplay: {
    color: 'white',
    fontSize: 12,
  },
  controlText: {
    color: 'white',
    fontSize: 14,
  },
});
