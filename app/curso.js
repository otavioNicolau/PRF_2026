import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, ScrollView, Pressable, SafeAreaView, RefreshControl, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slide } from '~/components/Slide';
import { Stack, useNavigation, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Network from 'expo-network';  // Importação do módulo de rede

export default function Curso() {

  const navigation = useNavigation();

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
      // console.log(token);
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

  const initializeData = async () => {
    try {
      // Verificar a conexão com a internet
      const networkState = await Network.getNetworkStateAsync();
      if (networkState.isConnected) {
        await getToken();  // Garantir que o token esteja obtido antes de buscar os dados
        await fetchData();
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

  useEffect(() => {
    initializeData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    initializeData();
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
        <Text style={[styles.whiteText]}>Carregando</Text>
      </View>
    );
  }

  const renderProfessor = ({ item }) => (
    <View style={styles.professorContainer}>
      <Image source={{ uri: item.imagem }} style={styles.professorImage} />
      <Text style={styles.professorName}>{item.nome}</Text>
    </View>
  );

  const uniqueProfessores = data.professores
    .filter((professor, index, self) =>
      professor.imagem && index === self.findIndex((p) => p.id === professor.id)
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1B1B1B']}
            tintColor="#fff"
          />
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

        <Text style={[styles.title, styles.whiteText]}>PROFESSORES:</Text>

        <FlatList
          data={uniqueProfessores} // Use a lista de professores sem duplicados e com imagem
          renderItem={renderProfessor}
          keyExtractor={(item) => item.id.toString()}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={styles.flatList}
        />

        <Text style={[styles.title, styles.whiteText]}>{data.nome.toUpperCase()}</Text>
        <Text style={styles.label}>Data de Início: {data.data_inicio}</Text>
        <Text style={styles.label}>Data de Retirada: {data.data_retirada}</Text>
        <Text style={styles.label}>Total de Aulas: {data.total_aulas}</Text>
        <Text style={styles.label}>Total de Aulas Visualizadas: {data.total_aulas_visualizadas}</Text>

        <Text style={[styles.sectionTitle, styles.whiteText]}>AULAS:</Text>

        {data.aulas.map((aula) => (
          <Pressable key={aula.id}
            onPress={() => navigation.navigate('aula', { aula: JSON.stringify(aula), materia: data.nome })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#333333' : '#1B1B1B',
              marginTop: 5,
              marginBottom: 5,
              marginLeft: 5,
              marginRight: 5
            })}
          >
            <View style={styles.aulaContainer}>
              <View style={styles.cursoContainer}>
                <Text style={[styles.cursoNome, styles.label]}>{aula.nome.toUpperCase()}</Text>
                <Text style={styles.whiteText}>{aula.conteudo}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#A5B99C',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
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
    backgroundColor: '#1B1B1B',
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
  cursoContainer: {
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
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
  professorContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
  professorImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  professorName: {
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
  },
  flatList: {
    marginVertical: 20,
  },
});
