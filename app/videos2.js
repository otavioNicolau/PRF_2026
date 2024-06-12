import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView, Linking } from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideosD() {
  useEffect(() => {
    // Desbloqueia todas as orientações
    ScreenOrientation.unlockAsync();
  }, []);

  const { video, filename } = useLocalSearchParams();

  // // Desserializar o objeto video
  // const parsedVideo = JSON.parse(video);

  // const [selectedResolution, setSelectedResolution] = useState('360p');
  const [videoSpeed, setVideoSpeed] = useState(1.0);
  // const videoRef = useRef(null);

  // const videoUri = parsedVideo.resolucoes[selectedResolution];

  const increaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.min(prevSpeed + 0.25, 2.0));
  }, []);

  const decreaseSpeed = useCallback(() => {
    setVideoSpeed(prevSpeed => Math.max(prevSpeed - 0.25, 0.5));
  }, []);

  // const handleResolutionChange = useCallback((resolution) => {
  //   setSelectedResolution(resolution);
  //   if (videoRef.current !== null) {
  //     videoRef.current.pauseAsync().then(() => {
  //       videoRef.current.loadAsync({ uri: parsedVideo.resolucoes[resolution] }, { shouldPlay: true });
  //     });
  //   }
  // }, [parsedVideo.resolucoes]);

  // const openVideoInBrowser = () => {
  //   Linking.openURL(videoUri)
  //     .then(() => console.log(`Opened URL: ${videoUri}`))
  //     .catch((err) => console.error('Failed to open URL:', err));
  // };

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Stack.Screen options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: filename,
        }} />
        <View style={styles.videoContainer}>
          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: video }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              allowsFullscreen
              allowsPictureInPicture
            rate={videoSpeed}
            />
          </View>
        </View>
        <Text style={[styles.title]}>{filename}:</Text>
        
        <View>
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={decreaseSpeed} style={styles.controlButton}>
              <MaterialIcons name="remove" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.controlText}>{videoSpeed.toFixed(2)}x</Text>
            <TouchableOpacity onPress={increaseSpeed} style={styles.controlButton}>
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
      </View>

    </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    paddingHorizontal: 10,
    textAlign: 'center',
  },

  containerArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#1B1B1B',
    marginBottom: 20,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlButton: {
    backgroundColor: '#666',
    padding: 10,
    // borderRadius: 5,
    marginHorizontal: 10,
  },
  controlText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resolutionButton: {
    backgroundColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 20,
    // borderRadius: 5,
    marginHorizontal: 5,
  },
  resolutionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    // borderRadius: 5,
    marginHorizontal: 5,
    marginTop: 10,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },

});
