import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, ScrollView, Linking, Pressable, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slide } from '~/components/Slide';
import { Stack, Link, useLocalSearchParams } from 'expo-router';  // Importando os componentes necessários
import * as ScreenOrientation from 'expo-screen-orientation';


const Aulas = () => {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const url = `https://api.estrategiaconcursos.com.br/api/aluno/curso/${id}`;


  useEffect(() => {
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



  // Função para obter o token da API
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

  // Função para buscar os dados da API
  const fetchData = async () => {
    try {
      let token = await AsyncStorage.getItem('BEARER_TOKEN');
      if (!token) {
        token = await getToken(); // Obtém um novo token se não estiver armazenado
      }

      const headers = {
        Authorization: `${token}`,
      };

      const response = await axios.get(url, { headers });
      await AsyncStorage.setItem(url, JSON.stringify(response.data.data));
      setData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar os dados:', err);
      const cachedData = await AsyncStorage.getItem(url);
      if (cachedData) {
        setData(JSON.parse(cachedData));
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };




  if (error) {
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
          title: 'AULA'
        }} />
        <Text style={[styles.errorText, styles.whiteText]}>Erro ao carregar os dados do curso.</Text>
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
          title: 'AULA'
        }} />
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
          title: data.nome,
        }} />
        <Slide />
        <Text style={[styles.title, styles.whiteText]}>{data.nome.toUpperCase()}</Text>
        <Text style={styles.whiteText}>Data de Início: {data.data_inicio}</Text>
        <Text style={styles.whiteText}>Data de Retirada: {data.data_retirada}</Text>
        <Text style={styles.whiteText}>Total de Aulas: {data.total_aulas}</Text>
        <Text style={styles.whiteText}>Total de Aulas Visualizadas: {data.total_aulas_visualizadas}</Text>

        <Text style={[styles.sectionTitle, styles.whiteText]}>AULAS:</Text>

        {data.aulas.map((aula) => (
          <View key={aula.id} style={styles.aulaContainer}>
            <View style={styles.cursoContainer}>
              <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula), materia: data.nome } }} >
                <Text style={[styles.cursoNome, styles.whiteText]}>{aula.nome.toUpperCase()}</Text>
              </Link>
              <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula), materia: data.nome } }} >
                <Text style={styles.whiteText}>{aula.conteudo}</Text>
              </Link>
              {/* <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula) } }} >
                <Text style={[styles.videoTitle, styles.whiteText]}>ARQUIVOS:</Text>
              </Link>

              {!aula.pdf && !aula.pdf_grifado && !aula.pdf_simplificado ? (
                <Text style={styles.whiteText}>NENHUM PDF DISPONÍVEL</Text>
              ) : (
                <>
                  {aula.pdf && (
                    <Pressable onPress={() => Linking.openURL(aula.pdf)} style={styles.link}>
                      <Text style={[styles.linkText, styles.A5B99CText]}>PDF NORMAL</Text>
                    </Pressable>
                  )}
                  {aula.pdf_grifado && (
                    <Pressable onPress={() => Linking.openURL(aula.pdf_grifado)} style={styles.link}>
                      <Text style={[styles.linkText, styles.A5B99CText]}>PDF GRIFADO</Text>
                    </Pressable>
                  )}
                  {aula.pdf_simplificado && (
                    <Pressable onPress={() => Linking.openURL(aula.pdf_simplificado)} style={styles.link}>
                      <Text style={[styles.linkText, styles.A5B99CText]}>PDF SIMPLIFICADO</Text>
                    </Pressable>
                  )}
                </>
              )}

              <VideoList videos={aula.videos} /> */}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const VideoList = ({ videos }) => {
  return (
    <View>
      <FlatList
        horizontal
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Link style={[styles.videoLink, styles.videoText, styles.whiteText]}
            href={{
              pathname: '/videos',
              params: { video: JSON.stringify(item) },
            }}
          >
            <Text>{item.titulo}</Text>
          </Link>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  scrollView: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  videoLink: {
    margin: 8,
    padding: 8,
  },
  container: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  whiteText: {
    color: '#ffffff',
  },
  A5B99CText: {
    color: '#A5B99C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  aulaContainer: {
    marginBottom: 16,
  },
  cursoContainer: {
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
    backgroundColor: '#1B1B1B',
  },
  cursoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ffffff',
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: '#A5B99C',
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
  },
  videoText: {
    marginTop: 20,
    color: '#ffffff',
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#1B1B1B',
    height: 45,
  },
});

export default Aulas;
