import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

const VideoPlayer = () => {
  
  const openVLC = async () => {
    const vlcPackage = 'org.videolan.vlc';
    const vlcURL = 'vlc://https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';


    const isInstalled = await Linking.canOpenURL(vlcURL);
    if (isInstalled) {
      await Linking.openURL(vlcURL);
    } else {
      alert('VLC não está instalado no dispositivo.');
      Linking.openURL(`market://details?id=${vlcPackage}`);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openVLC} style={styles.button}>
        <Text style={styles.buttonText}>Abrir Vídeo no VLC</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VideoPlayer;
