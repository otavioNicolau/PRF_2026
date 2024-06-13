import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';


const EditalVerticalizado = () => {
  const [editais, setEditais] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


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



  // Função para carregar os editais ao montar o componente
  useEffect(() => {
    loadEditais();
  }, []);

  // Função para carregar os editais da API
  const loadEditais = async () => {
    setRefreshing(true);
    try {
      // Verifica se há dados salvos localmente
      const localEditais = await AsyncStorage.getItem('editais');
      if (localEditais) {
        setEditais(JSON.parse(localEditais));
      }

      const response = await fetch('https://teal-crostata-aea03c.netlify.app/api/edital_prf');
      const data = await response.json();

      if (data && data.EDITAL) {
        const groupedEditais = groupBy(data.EDITAL, 'materia');
        setEditais(groupedEditais);
        // Salva os editais no AsyncStorage
        await AsyncStorage.setItem('editais', JSON.stringify(groupedEditais));
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os editais.');
      }
    } catch (error) {
      console.error('Erro ao carregar os editais:', error);
      Alert.alert('Erro', 'Erro ao carregar os editais. Por favor, tente novamente.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Função para agrupar um array de objetos por uma chave específica
  const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
      return result;
    }, {});
  };

  // Função para lidar com o evento de atualização manual (puxar para baixo)
  const onRefresh = () => {
    loadEditais();
  };

  // Função para lidar com a exclusão de um edital
  const handleDeleteEdital = async (editalId) => {
    Alert.alert('Aviso', 'Esta funcionalidade não está implementada.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#A5B99C']}
            progressBackgroundColor="#1B1B1B"
          />
        }
      >
        <Stack.Screen
          options={{
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: 'EDITAL VERTICALIZADO PRF'
          }}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A5B99C" />
            <Text style={styles.loadingText}>Carregando editais...</Text>
          </View>
        ) : (
          Object.keys(editais).map(materia => (
            <View key={materia} style={styles.materiaContainer}>
              <Text style={styles.materiaTitle}>{materia}</Text>
              <View style={styles.editalList}>
                {editais[materia].map(edital => (
                  <View key={edital.id} style={styles.editalBox}>
                    <View style={styles.editalInfo}>
                      <Text style={styles.editalTitle}>{edital.nome}</Text>
                      <Text style={styles.editalDetails}>ID: {edital.id}</Text>
                      <Text style={styles.editalDetails}>Peso: {edital.peso}</Text>
                    </View>
                    {/* 
                    <View style={styles.buttonsContainer}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={() => handleDeleteEdital(edital.id)}
                      >
                        <FontAwesome name="trash" size={24} color="#fff" />
                      </Pressable>
                    </View> 
                    */}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        {!loading && Object.keys(editais).length === 0 && (
          <Text style={styles.noEditaisText}>Nenhum edital disponível.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  container: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1B',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#A5B99C',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  materiaContainer: {
    marginBottom: 20,
  },
  materiaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 10,
  },
  editalList: {
    marginBottom: 10,
  },
  editalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 10,
    padding: 10,
  },
  editalInfo: {
    flex: 1,
  },
  editalTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  editalDetails: {
    color: '#ffffff',
    fontSize: 14,
  },
  buttonsContainer: {
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#A5B99C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEditaisText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EditalVerticalizado;
