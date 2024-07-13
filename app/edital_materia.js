import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, ActivityIndicator, Pressable, RefreshControl, Alert, FlatList } from 'react-native';
import 'react-native-url-polyfill/auto';
import { useNavigation, Stack, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '~/lib/supabase';
import * as Network from 'expo-network';
import { FontAwesome } from '@expo/vector-icons';
import { Auth } from '~/components/Auth';

const EditalVerticalizado = () => {
  const navigation = useNavigation();
  const { materia } = useLocalSearchParams();

  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  const loadEditais = async () => {
    setRefreshing(true);
    try {
      const { isConnected } = await Network.getNetworkStateAsync();
      if (isConnected) {
        const userId = session?.user?.id; // Obtém o ID do usuário logado
        if (!userId) throw new Error('User not logged in');

        const { data: assuntos, error } = await supabase
          .from('assuntos')
          .select(`
            *,
            estudado:estudado(count)
          `)
          .eq('estudado.id_user', userId) // Adiciona a condição para o usuário logado
          .order('id', { ascending: true })
          .eq('materia', materia); // Filtra pela matéria

        if (error) {
          throw error;
        }
        if (assuntos && assuntos.length > 0) {
          setEditais(assuntos);
          await AsyncStorage.setItem('editais', JSON.stringify(assuntos));
        } else {
          setEditais([]);
        }
      } else {
        console.warn('Sem conexão com a internet. Carregando dados em cache.');
        const cachedData = await AsyncStorage.getItem('editais');
        if (cachedData) {
          setEditais(JSON.parse(cachedData));
        } else {
          console.error('Sem dados em cache disponíveis');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar os assuntos:', error.message);
      const cachedData = await AsyncStorage.getItem('editais');
      if (cachedData) {
        setEditais(JSON.parse(cachedData));
      } else {
        console.error('Sem dados em cache disponíveis');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadEditais();
    }
  }, [session]);

  const onRefresh = useCallback(() => {
    if (session) {
      loadEditais();
    }
  }, [session]);

  const RenderItem = memo(({ item, index }) => {
    const getTitleColor = (peso) => {
      switch (peso) {
        case 0:
          return '#006400'; // Verde escuro
        case 1:
          return '#00FF00'; // Verde claro
        case 2:
          return '#FFFF00'; // Amarelo
        case 3:
          return '#FFA500'; // Laranja
        case 4:
          return '#FF0000'; // Vermelho
        default:
          return '#FFFFFF'; // Cor padrão
      }
    };

    return (
      <Pressable
        onPress={() => {
          navigation.navigate('logs', { assunto: JSON.stringify(item) });
        }}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#333333' : '#1B1B1B',
          marginTop: 5,
          marginBottom: 5,
          marginLeft: 5,
          marginRight: 5,
        })}
      >
        <View style={styles.editalBox}>
          <View style={styles.editalInfo}>
            <Text style={[styles.editalTitle, { color: getTitleColor(item.peso) }]}>{item.nome}</Text>
          </View>
          <Text style={styles.estudadovezes}>
            Esse assunto foi estudado {item.estudado[0].count} vez{item.estudado[0].count !== 1 ? 'es' : ''}
          </Text>
        </View>
      </Pressable>
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: materia
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <>
            <Text style={styles.noEditaisText}>Carregando editais...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
          </>
        ) : (
          <>
            <View style={styles.legendaContainer}>
              <Text style={[styles.legendaItem, { color: '#006400' }]}>Peso 0</Text>
              <Text style={[styles.legendaItem, { color: '#00FF00' }]}>Peso 1</Text>
              <Text style={[styles.legendaItem, { color: '#FFFF00' }]}>Peso 2</Text>
              <Text style={[styles.legendaItem, { color: '#FFA500' }]}>Peso 3</Text>
              <Text style={[styles.legendaItem, { color: '#FF0000' }]}>Peso 4</Text>
            </View>

            <FlatList
              data={editais}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => <RenderItem item={item} index={index} />}
              ListEmptyComponent={<Text style={styles.noEditaisText}>Nenhum edital encontrado.</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const groupByMateria = (editais) => {
  const grouped = editais.reduce((acc, edital) => {
    const existingIndex = acc.findIndex((item) => item.title === edital.materia);
    if (existingIndex !== -1) {
      acc[existingIndex].data.push(edital);
    } else {
      acc.push({ title: edital.materia, data: [edital] });
    }
    return acc;
  }, []);
  return grouped;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  estudadovezes: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  editalBox: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#ffffff',
    padding: 10,
  },
  editalInfo: {
    flex: 1,
  },
  editalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },


  noEditaisText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 5,
  },
  materiaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 10,
  },

  legendaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  legendaItem: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default EditalVerticalizado;
