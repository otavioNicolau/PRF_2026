import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack } from 'expo-router';

const UpdateScreen = () => {
  const [loadingToken, setLoadingToken] = useState(false);
  const [loadingCurso, setLoadingCurso] = useState(false);
  const [loadingCache, setLoadingCache] = useState(false); // Adiciona estado de carregamento para a função cache

  const [status, setStatus] = useState({
    token: 'PENDENTE',
    curso: 'PENDENTE',
    cache: 'PENDENTE', // Adiciona o status para os dados do cache
  });

  // Função para bloquear a orientação
  const lockOrientation = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  };

  // Função para obter o token
  const getToken = async () => {
    try {
      setLoadingToken(true);
      setStatus((prev) => ({ ...prev, token: 'CARREGANDO...' }));
      const response = await axios.get('https://teal-crostata-aea03c.netlify.app/api/config');
      const token = `${response.data.BEARER_TOKEN}`;
      await AsyncStorage.setItem('BEARER_TOKEN', token);
      setStatus((prev) => ({ ...prev, token: 'COMPLETO' }));
      Alert.alert('Sucesso', 'Token atualizado com sucesso!');
      return token;
    } catch (error) {
      console.error('Erro ao obter o token:', error);
      Alert.alert('Erro', 'Falha ao atualizar o token.');
    } finally {
      setLoadingToken(false);
    }
  };

  // Função para buscar os dados do curso
  const fetchCursosData = async () => {
    const url = 'https://api.estrategiaconcursos.com.br/api/aluno/curso';
    try {
      setLoadingCurso(true);
      setStatus((prev) => ({ ...prev, curso: 'CARREGANDO...' }));

      let token = await AsyncStorage.getItem('BEARER_TOKEN');
      if (!token) {
        token = await getToken();
      }

      const response = await axios.get(url, { headers: { Authorization: token } });
      await AsyncStorage.setItem(url, JSON.stringify(response.data.data));

      setStatus((prev) => ({ ...prev, curso: 'COMPLETO' }));
      Alert.alert('Sucesso', 'Dados do curso atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao buscar os dados do curso:', error);
      Alert.alert('Erro', 'Falha ao atualizar os dados do curso.');
    } finally {
      setLoadingCurso(false);
    }
  };

  // Função para buscar os dados do cache
  const fetchCursoData = async () => {
    const url = 'https://api.estrategiaconcursos.com.br/api/aluno/curso';
    try {
      setLoadingCache(true); // Indica que está carregando os dados do cache
      setStatus((prev) => ({ ...prev, cache: 'CARREGANDO...' }));

      const cachedData = await AsyncStorage.getItem(url);

      if (cachedData) {
        const data = JSON.parse(cachedData);

        let token = await AsyncStorage.getItem('BEARER_TOKEN');
        if (!token) {
          token = await getToken(); // Obtém um novo token se não estiver armazenado
        }

        if (data.concursos && Array.isArray(data.concursos)) {
          for (const concurso of data.concursos) {

            for (const curso of concurso.cursos) {

              // Verifica se o ID é válido antes de fazer a requisição
              if (curso.id && typeof curso.id === 'number') {
                const url2 = `https://api.estrategiaconcursos.com.br/api/aluno/curso/${curso.id}`;

                console.log(`Fetching data for concurso ID: ${curso.id}`);

                try {
                  const headers = {
                    Authorization: `${token}`,
                  };
                  const response = await axios.get(url2, { headers });
                  await AsyncStorage.setItem(url2, JSON.stringify(response.data.data));
                } catch (innerError) {
                  console.error(`Erro ao buscar dados do concurso ${curso.id}:`, innerError);
                  Alert.alert('Erro', `Falha ao atualizar dados do concurso ${curso.id}.`);
                }
              } else {
                console.error(`ID do concurso inválido: ${curso.id}`);
              }
            }
          }
          setStatus((prev) => ({ ...prev, cache: 'COMPLETO' }));
        } else {
          console.error('Dados de concursos não encontrados ou inválidos.');
          setStatus((prev) => ({ ...prev, cache: 'ERRO' }));
        }
      } else {
        console.error('Nenhum dado em cache encontrado.');
        setStatus((prev) => ({ ...prev, cache: 'ERRO' }));
      }
    } catch (error) {
      console.error('Erro ao buscar os dados do cache:', error);
      setStatus((prev) => ({ ...prev, cache: 'ERRO' }));
    } finally {
      setLoadingCache(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{
        headerStyle: { backgroundColor: '#1B1B1B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        title: 'ATUALIZAR',
        headerTitleAlign: 'center',
      }} />
      <View style={styles.container}>
        {/* Atualização do Token */}
        <View style={styles.updateItem}>
          <Text style={styles.progressText}>TOKEN: {status.token}</Text>
          <Pressable style={styles.updateButton} onPress={getToken} disabled={loadingToken}>
            {loadingToken ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>Atualizar Token</Text>
            )}
          </Pressable>
        </View>

        {/* Atualização do Curso */}
        <View style={styles.updateItem}>
          <Text style={styles.progressText}>CURSO: {status.curso}</Text>
          <Pressable style={styles.updateButton} onPress={fetchCursosData} disabled={loadingCurso}>
            {loadingCurso ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>Atualizar Curso</Text>
            )}
          </Pressable>
        </View>

        {/* Fetch Curso Data (Cache) */}
        <View style={styles.updateItem}>
          <Text style={styles.progressText}>CACHE: {status.cache}</Text>
          <Pressable style={styles.updateButton} onPress={fetchCursoData} disabled={loadingCache}>
            {loadingCache ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>Buscar do Cache</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1B1B1B',
  },
  updateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 18,
  },
  updateButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  updateButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default UpdateScreen;
