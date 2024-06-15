import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, Link, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';


export default function Logs() {
  const navigation = useNavigation();
  const { aula, materia } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);


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
          title: "LOGS",
        }} />
        <View style={styles.aulaContainer}>
          
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
