import { Stack, useNavigation, Link } from 'expo-router';
import { Slide } from '~/components/Slide';
import React, { useEffect, useState } from 'react';
import { View, Button, Pressable, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FontAwesome } from '@expo/vector-icons';
import * as Network from 'expo-network';

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
      token = await getToken();
    }
    const response = await axios.get(url, { headers: { Authorization: token } });
    await AsyncStorage.setItem(url, JSON.stringify(response.data.data));
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar os dados do curso:', error);
    const cachedData = await AsyncStorage.getItem(url);
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

    // Trava a orientação da tela em horizontal
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };

    lockOrientation();
    // Desbloqueia a orientação da tela ao desmontar o componente
    return () => {
      ScreenOrientation.unlockAsync();
    };

  }, []);

  const initializeData = async () => {
    try {
      // Verificar a conexão com a internet
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        await getToken();  // Garantir que o token esteja obtido antes de buscar os dados
        const courseData = await fetchCourseData();
        setData(courseData);
      } else {
        // Usar dados em cache se não houver conexão
        const cachedData = await AsyncStorage.getItem(url);
        if (cachedData) {
          setData(JSON.parse(cachedData));
        } else {
          throw new Error('Sem conexão e sem dados em cache disponíveis');
        }
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
            title: "ERROR",
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
          title: 'PROJETO RPF',
          headerTitleAlign: 'center',

        }} />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={[styles.whiteText]}>Carregando</Text>

      </View>
    );
  }

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" colors={['#1B1B1B']} />
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
          title: 'PROJETO RPF'
        }} />

        <Slide />

        {data && data.concursos ? (
          data.concursos.map(concurso => (
            <View key={concurso.id} style={styles.stepContainer}>



              <Pressable onPress={() => navigation.navigate('cursos', { concurso: JSON.stringify(concurso) })}>
                <View style={styles.subtitleContainer}>
                  <Text style={styles.subtitle}>
                    {concurso.titulo.toUpperCase()} -

                    <Text style={styles.icon}>
                      ( ver mais )
                    </Text>
                  </Text>
                </View>
              </Pressable>


              <FlatList
                horizontal
                data={concurso.cursos}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => navigation.navigate('curso', { id: item.id })}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#333333' : '#1B1B1B',
                      marginTop: 5,
                      marginBottom: 5,
                      marginLeft: 5,
                      marginRight: 5
                    })}
                  >

                    {/*  <Link href={{ pathname: '/aulas', params: { id: item.id } }}> */}
                    <View style={styles.cursoContainer}>
                      <Text style={styles.cursoNome}>{item.nome.toUpperCase()}</Text>
                      <Text style={styles.cursoInfo}>DATA DE INÍCIO: {item.data_inicio}</Text>
                      <Text style={styles.cursoInfo}>DATA DE RETIRADA: {item.data_retirada}</Text>
                      <Text style={styles.cursoInfo}>TOTAL DE AULAS: {item.total_aulas}</Text>
                      <Text style={styles.cursoInfo}>TOTAL DE AULAS VISUALIZADAS: {item.total_aulas_visualizadas}</Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          ))
        ) : (
          <Text style={styles.errorText}>Não há dados disponíveis.</Text>
        )}


        <View style={styles.stepContainer}>

            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                @ APOSTILAS @
              </Text>
            </View>

          <Pressable
            onPress={() => navigation.navigate('apostilas')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#333333' : '#1B1B1B',
              // marginTop: 5,
              // marginBottom: 5,
              // marginLeft: 5,
              // marginRight: 5
            })}
          >

            <View style={styles.cursoContainer2}>
              <Text style={styles.cursoNome}>Aqui você encontra uma variedade de arquivos essenciais para seus estudos e preparação, incluindo:</Text>
              <Text style={styles.cursoInfo}>Apostilas Bizuradas</Text>
              <Text style={styles.cursoInfo}>Leis</Text>
              <Text style={styles.cursoInfo}>Resoluções</Text>
              <Text style={styles.cursoInfo}>Etc..</Text>

            </View>


          </Pressable>

        </View>


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
    // marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  cursoContainer2: {
    width: '100%',
    height: 180,
    padding: 10,
    // marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  whiteText: {
    color: '#ffffff',
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

  subtitleContainer: {
    // flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#ffffff',

  },
  icon: {
    marginLeft: 5, // Espaço de 2 pixels ao lado do texto
    textAlign: 'center',
    color: '#A5B99C',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
