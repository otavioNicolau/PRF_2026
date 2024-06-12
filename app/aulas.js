import { Stack, Link, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, ScrollView, Linking, Pressable, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slide } from '~/components/Slide';

export default function Aulas() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const url = `https://api.estrategiaconcursos.com.br/api/aluno/curso/${id}`;
  const headers = {
    Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiMThmMzVlMTYyMDQzM2ZhMzBmYTMzMmM5NTViZjA2MDI4ZjJlOWNkZTc0NWFlYmVkMTdiNDhkZGIxNGM2Nzc3OGY1NmM5MzIyYmQzYmVhZDAiLCJpYXQiOjE3MTY1Nzg5MjAuNjY2ODk5LCJuYmYiOjE3MTY1Nzg5MjAuNjY2OTAxLCJleHAiOjE3MTkxNzA5MjAuNjYzMDY0LCJzdWIiOiIxMjc1MjkxIiwic2NvcGVzIjpbXX0.W5JrkijGjq0YnYjaEgiT3RMePare3GUBCtnS9yNDrnt99t2G6WgT-BfZTnj3DorVFAV6Ae4e12wOcb3BYMlhzGexPOgHpUkH_eAYkvGZqFbPWR9BG50hs20dlBDYFIf9EUe1IVjMbZZ5wwV4XJQD46GS1PQtl2VNoFN8_dIv7L0bGPT1Zm9Gn_SSxCDATKgik7k-MJr-CCSnmTbNMcZol6U1uON8B-3SzBYfI4aC7Tg7XnmA_DGhZEDE_jqSloLM8E5pLJOJ9mQlJ2wqgOHbAzRy0VotRau14eUZPABbv3nLd2IgwtPYCMqU-CQpGw9WO7XSnEEQWoIuCOOBdnBZBIX5uook5x_QwVPQWqx31n4X0yA-ZsBIePTXP4-eYtmqdMVjx_JIfKC5_ImcomoqR5XS1UcvBr4IEDMXRfKl9hHNp8zdZqRpXQfpRT9v9SnMMu38RpHwsIPQtfBN980MGsDXD8RufY8ZkNcHKmeXPm-_JNeJSzgrkHZcNe0IqlTgPF27mlPtfLaHycB4VBdvhBLH7zKG30Dke-i2ZS_ts1LioEVQVOTtALYCjA72AUhAblQc3J7JKn1zQ3RcdmzZ7e8TmVhrp16u-JBrbr3U1dWIhTMkdZZcQ7OYtpiuaxiZoSEP_xVdkxY4A2Mdt9rIBF0VZIn71RiSCb6eB3XH_CI',
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(url, { headers });
      await AsyncStorage.setItem(url, JSON.stringify(response.data.data));
      setData(response.data.data);
      setError(null);
    } catch (err) {
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
              <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula) } }} >
                <Text style={[styles.cursoNome, styles.whiteText]}>{aula.nome.toUpperCase()}</Text>
              </Link>
              <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula) } }} >
                <Text style={styles.whiteText}>{aula.conteudo}</Text>
              </Link>
              <Link style={[styles.aulaContainer]} href={{ pathname: '/aula', params: { aula: JSON.stringify(aula) } }} >
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

              <VideoList videos={aula.videos} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

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
