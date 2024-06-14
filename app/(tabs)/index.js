import { Stack, Link } from 'expo-router';
import { Slide } from '~/components/Slide';
import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

import { useSQLiteContext } from 'expo-sqlite';

// URL da API
const url = 'https://api.estrategiaconcursos.com.br/api/aluno/curso';

// Função para obter o token
const getToken = async () => {
  try {
    // console.log('Obtendo token...');
    const response = await axios.get('https://teal-crostata-aea03c.netlify.app/api/config');
    const token = `${response.data.BEARER_TOKEN}`;
    await AsyncStorage.setItem('BEARER_TOKEN', token);
    // console.log('Token obtido:', token);
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
      // console.log('Token não encontrado no AsyncStorage, obtendo novo token');
      token = await getToken();
    }

    // console.log('Usando token para buscar dados do curso:', token);
    const response = await axios.get(url, { headers: { Authorization: token } });
    // console.log('Dados do curso obtidos:', response.data.data);
    await AsyncStorage.setItem(url, JSON.stringify(response.data.data));
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar os dados do curso:', error);
    const cachedData = await AsyncStorage.getItem(url);
    if (cachedData) {
      // console.log('Usando dados em cache');
      return JSON.parse(cachedData);
    }
    throw error;
  }
};

export default function Home() {

  useEffect(() => {
    // Trava a orientação da tela em horizontal
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT );
    };
    lockOrientation();
    // Desbloqueia a orientação da tela ao desmontar o componente
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);


  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const db = useSQLiteContext();


  const initializeData = async () => {
    try {
      // console.log('Inicializando dados');
      await getToken();  // Garantir que o token esteja obtido antes de buscar os dados
      const courseData = await fetchCourseData();
      setData(courseData);
      // console.log('Dados carregados com sucesso:', courseData);
    } catch (error) {
      console.error('Erro ao inicializar os dados:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const courseData = await fetchCourseData();
      setData(courseData);
      // console.log('Dados atualizados com sucesso:', courseData);
    } catch (error) {
      console.error('Erro ao atualizar os dados:', error);
      setError(error);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      
      <View style={[styles.container, styles.center, { backgroundColor: '#1B1B1B' }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: filename,
          }}
        />
        <Text style={styles.errorText}>Erro ao carregar os dados: {error.message}</Text>
        <Button title="Tentar Novamente" onPress={handleRefresh} color="#1E90FF" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#1B1B1B' }]}>
        <Stack.Screen options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: 'PROJETO RPF 2026'
        }} />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1E90FF']} />
        }
      >
        <Stack.Screen options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: 'PROJETO RPF 2026'
        }} />

        <Slide />

        {data && data.concursos ? (
          data.concursos.map(concurso => (
            <View key={concurso.id} style={styles.stepContainer}>
              <Text style={styles.subtitle}>{concurso.titulo.toUpperCase()}</Text>
              <FlatList
                horizontal
                data={concurso.cursos}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <Link href={{ pathname: '/aulas', params: { id: item.id } }}>
                    <View style={styles.cursoContainer}>
                      <Text style={styles.cursoNome}>{item.nome.toUpperCase()}</Text>
                      <Text style={styles.cursoInfo}>DATA DE INÍCIO: {item.data_inicio}</Text>
                      <Text style={styles.cursoInfo}>DATA DE RETIRADA: {item.data_retirada}</Text>
                      <Text style={styles.cursoInfo}>TOTAL DE AULAS: {item.total_aulas}</Text>
                      <Text style={styles.cursoInfo}>TOTAL DE AULAS VISUALIZADAS: {item.total_aulas_visualizadas}</Text>
                    </View>
                  </Link>
                )}
              />
            </View>
          ))
        ) : (
          <Text style={styles.errorText}>Não há dados disponíveis.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  stepContainer: {
    marginBottom: 20,
  },
  cursoContainer: {
    width: 300,
    height: 180,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
    marginRight: 5,
  },
  cursoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ffffff',
  },
  cursoInfo: {
    textAlign: 'center',
    color: '#A5B99C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
});
