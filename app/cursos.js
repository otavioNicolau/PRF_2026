import { Stack, useNavigation, Link, useLocalSearchParams } from 'expo-router';
import { Slide } from '~/components/Slide';
import React, { useEffect, useState } from 'react';
import { View, Button, Pressable, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FontAwesome } from '@expo/vector-icons';

export default function Cursos() {
  const { concurso } = useLocalSearchParams();
  const navigation = useNavigation();
  const concursoJson = JSON.parse(concurso);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento dos dados
    setTimeout(() => {
      setIsLoading(false);
    }, 500); // Simula um carregamento de 2 segundos

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: concursoJson.titulo
          }}
        />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView style={styles.scrollView}>
        <Stack.Screen
          options={{
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: concursoJson.titulo
          }}
        />

        <Slide />

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            {concursoJson.titulo} -
          </Text>
        </View>

        {concursoJson.cursos ? (
          concursoJson.cursos.map(curso => (
            <View key={curso.id} style={styles.stepContainer}>
              <Pressable
                onPress={() => navigation.navigate('curso', { id: curso.id })}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#333333' : '#1B1B1B',
                  marginTop: 5,
                  marginBottom: 5,
                  marginLeft: 5,
                  marginRight: 5
                })}
              >
                <View style={styles.cursoContainer}>
                  <Text style={styles.cursoNome}>{curso.nome}</Text>
                  <Text style={styles.cursoInfo}>DATA DE INÍCIO: {curso.data_inicio}</Text>
                  <Text style={styles.cursoInfo}>DATA DE RETIRADA: {curso.data_retirada}</Text>
                  <Text style={styles.cursoInfo}>TOTAL DE AULAS: {curso.total_aulas}</Text>
                  <Text style={styles.cursoInfo}>TOTAL DE AULAS VISUALIZADAS: {curso.total_aulas_visualizadas}</Text>
                </View>
              </Pressable>
            </View>
          ))
        ) : (
          <View>
            <Text style={styles.errorText}>Não há dados disponíveis.</Text>
          </View>
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
    width: "99%",
    padding: 10,
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
    marginLeft: 5,
    textAlign: 'center',
    color: '#A5B99C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 16,
  },
});
