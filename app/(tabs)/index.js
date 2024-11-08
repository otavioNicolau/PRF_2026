import { Stack, useNavigation } from 'expo-router';
import { Slide } from '~/components/Slide';
import React, { useEffect, useState } from 'react';
import { View, Button, Pressable, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Network from 'expo-network';

// URL da API
const API_URL = 'https://api.estrategiaconcursos.com.br/api/aluno/curso';

// Função para obter o token
const getToken = async () => {
  try {
    const response = await axios.get('https://teal-crostata-aea03c.netlify.app/api/config');
    const token = response.data.BEARER_TOKEN;
    await AsyncStorage.setItem('BEARER_TOKEN', token);
    return token;
  } catch (error) {
    console.error('Erro ao obter o token:', error);
    throw error;
  }
};

// Função para buscar os dados do curso
const fetchCourseData = async () => {
  try {
    let token = await AsyncStorage.getItem('BEARER_TOKEN');
    if (!token) {
      token = await getToken();
    }
    const response = await axios.get(API_URL, { headers: { Authorization: token } });
    await AsyncStorage.setItem(API_URL, JSON.stringify(response.data.data));
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar os dados do curso:', error);
    const cachedData = await AsyncStorage.getItem(API_URL);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    throw error;
  }
};

export default function Home() {

  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeData();

    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };

    lockOrientation();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const initializeData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(API_URL);
      
      // Se houver dados em cache, usa-os, senão busca da API se conectado
      if (cachedData) {
        setData(JSON.parse(cachedData));
      } else if ((await Network.getNetworkStateAsync()).isConnected) {
        setData(await fetchCourseData());
      } else {
        throw new Error('Sem conexão e sem dados em cache disponíveis');
      }
    } catch (error) {
      console.error('Erro ao inicializar os dados:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const courseData = await fetchCourseData();
      setData(courseData);
    } catch (error) {
      console.error('Erro ao atualizar os dados:', error);
      setError(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={screenOptions('ERROR')} />
        <Text style={styles.errorText}>Erro ao carregar os dados: {error.message}</Text>
        <Button title="Tentar Novamente" onPress={handleRefresh} color="#1E90FF" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={screenOptions('PROJETO PRF')} />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.whiteText}>Carregando</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" colors={['#1B1B1B']} />}
      >
        <Stack.Screen options={screenOptions('PROJETO PRF')} />
        <Slide />
        {data && data.concursos ? (
          data.concursos.map(concurso => (
            <View key={concurso.id} style={styles.stepContainer}>
              <Pressable onPress={() => navigation.navigate('cursos', { concurso: JSON.stringify(concurso) })}>
                <View style={styles.subtitleContainer}>
                  <Text style={styles.subtitle}>{concurso.titulo.toUpperCase()}</Text>
                </View>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.errorText}>Não há dados disponíveis.</Text>
        )}
        <View style={styles.stepContainer}>
          <Pressable onPress={() => navigation.navigate('apostilas')}>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>APOSTILAS</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const screenOptions = (title) => ({
  headerStyle: { backgroundColor: '#1B1B1B' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
  title,
  headerTitleAlign: 'center',
});

const styles = StyleSheet.create({
  containerArea: { flex: 1, backgroundColor: '#1B1B1B' },
  scrollView: { flex: 1 },
  container: { flex: 1, backgroundColor: '#1B1B1B', justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: 'red' },
  stepContainer: { margin: 10 },
  whiteText: { color: '#ffffff' },
  subtitleContainer: { alignItems: 'center', marginBottom: 1, borderWidth: 0.5, borderColor: '#ccc', padding: 5 },
  subtitle: { fontSize: 15, padding: 5, fontWeight: 'bold', textTransform: 'uppercase', color: '#ffffff' },
});
