import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, Stack, Link, useNavigation } from 'expo-router';

const WebViewScreen = () => {
  const navigation = useNavigation();

  const { url} = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
});

export default WebViewScreen;
