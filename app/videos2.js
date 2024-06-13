import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideosD() {
  const { video, filename } = useLocalSearchParams();
  const videoRef = useRef(null);
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

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
        const savedPosition = await AsyncStorage.getItem(`videoPosition-${filename}`);
        if (savedPosition !== null) {
          const position = parseInt(savedPosition, 10);
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
  }, [filename]);

  useEffect(() => {
    const saveVideoPosition = async () => {
      try {
        await AsyncStorage.setItem(`videoPosition-${filename}`, videoPosition.toString());
      } catch (e) {
        console.error(e);
      }
    };

    saveVideoPosition();
  }, [videoPosition, filename]);

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

  return (
    <SafeAreaView style={styles.containerArea}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: filename,
        }}
      />
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
        {!isFullscreen && (
          <View style={styles.controlsContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={videoPosition / videoDuration}
              onValueChange={handleSliderValueChange}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.controlsOverlay}>
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
        )}
      </View>
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
  },
  controlsOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  slider: {
    width: '100%',
    height: 40,
  },
});
