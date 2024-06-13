import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideosD() {
  const { video, filename } = useLocalSearchParams();
  const videoRef = useRef(null);
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    if (videoRef.current) {
      videoRef.current.presentFullscreenPlayer();
    }
  }, []);

  const increaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.min(prevSpeed + 0.25, 2.0));
  }, []);

  const decreaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.max(prevSpeed - 0.25, 0.5));
  }, []);

  const handleFullscreenUpdate = async ({ fullscreenUpdate }) => {
    if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT) {
      setIsFullscreen(true);
    } else if (fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS) {
      setIsFullscreen(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pauseAsync();
    } else {
      videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView style={styles.containerArea}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: filename,
        }}
      />
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: video }}
          style={styles.video}
          resizeMode={isFullscreen ? "cover" : "contain"}
          rate={videoSpeed}
          // useNativeControls={false} // Desativa os controles nativos do vídeo
          onFullscreenUpdate={handleFullscreenUpdate}
          shouldPlay
        />
        <View style={[styles.controlsOverlay, isFullscreen && styles.fullscreenControls]}>
          <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={decreaseSpeed} style={styles.controlButton}>
            <MaterialIcons name="remove" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.controlText}>{videoSpeed.toFixed(2)}x</Text>
          <TouchableOpacity onPress={increaseSpeed} style={styles.controlButton}>
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{filename}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  videoContainer: {
    width: '100%',
    height: screenHeight,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullscreenControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: '#666',
    padding: 10,
    marginHorizontal: 10,
  },
  controlText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
