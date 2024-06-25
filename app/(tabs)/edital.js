import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, ActivityIndicator, Pressable, RefreshControl, Alert } from 'react-native';
import { useNavigation, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Network from 'expo-network';
import { supabase } from '~/lib/supabase';

const EditalVerticalizado = () => {
  const navigation = useNavigation();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pesoFilters, setPesoFilters] = useState([]);
  const [blocoFilters, setBlocoFilters] = useState([]);
  const [currentMateria, setCurrentMateria] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (error) {
        Alert.alert('Error fetching session:', error.message);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription;
    };
  }, []);

  useEffect(() => {
    loadEditais();
  }, []);

  const loadEditais = async () => {
    setRefreshing(true);
    try {
      const { isConnected } = await Network.getNetworkStateAsync();
      if (isConnected) {
        const { data: assuntos, error } = await supabase.from('assuntos').select('*');
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

  const onRefresh = useCallback(() => {
    loadEditais();
  }, []);

  const countLogs = async (assunto_id) => {
    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        const cachedCount = await loadCountFromStorage(assunto_id);
        return cachedCount;
      }

      const { data: logs, error } = await supabase
        .from('estudado')
        .select('count', { count: 'exact' })
        .eq('assunto_id', assunto_id)
        .eq('id_user', session.user.id)
        .single();

      if (error) {
        throw error;
      }

      const logsCount = logs ? logs.count : 0;
      await saveCountToStorage(assunto_id, logsCount);
      return logsCount;
    } catch (error) {
      console.error('Erro ao contar os logs:', error.message);
      return 0;
    }
  };

  const saveCountToStorage = async (assunto_id, count) => {
    try {
      await AsyncStorage.setItem(`count_${assunto_id}`, count.toString());
    } catch (error) {
      console.error('Erro ao salvar contagem no AsyncStorage:', error);
    }
  };

  const loadCountFromStorage = async (assunto_id) => {
    try {
      const storedCount = await AsyncStorage.getItem(`count_${assunto_id}`);
      return storedCount ? parseInt(storedCount, 10) : 0;
    } catch (error) {
      console.error('Erro ao carregar contagem do AsyncStorage:', error);
      return 0;
    }
  };

  const checkInternetConnection = async () => {
    const { isConnected } = await Network.getNetworkStateAsync();
    return isConnected;
  };

  const filterEditais = () => {
    let filtered = [...editais];

    if (pesoFilters.length > 0) {
      filtered = filtered.filter(edital => pesoFilters.includes(edital.peso.toString()));
    }

    if (blocoFilters.length > 0) {
      filtered = filtered.filter(edital => blocoFilters.includes(edital.bloco));
    }

    return filtered;
  };

  const toggleFilter = (value, filterType) => {
    if (filterType === 'peso') {
      if (pesoFilters.includes(value)) {
        setPesoFilters(pesoFilters.filter(item => item !== value));
      } else {
        setPesoFilters([...pesoFilters, value]);
      }
    } else if (filterType === 'bloco') {
      if (blocoFilters.includes(value)) {
        setBlocoFilters(blocoFilters.filter(item => item !== value));
      } else {
        setBlocoFilters([...blocoFilters, value]);
      }
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentMateria(viewableItems[0].section.title);
    }
  }, []);

  const buildSubTree = (items, parentId = 0) => {
    return items
      .filter(item => item.subtree === parentId)
      .map(item => ({
        ...item,
        children: buildSubTree(items, item.id)
      }));
  };

  const renderItem = ({ item, index, section }) => {
    const [logsCount, setLogsCount] = useState(null);

    useEffect(() => {
      async function fetchLogsCount() {
        const count = await countLogs(item.id);
        setLogsCount(count);
      }
      fetchLogsCount();
    }, [item.id]);

    if (item.subtree === 0) {
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
            marginRight: 5
          })}
        >
          <View style={styles.editalBox}>
            <View style={styles.editalInfo}>
              <Text style={styles.editalTitle}>{item.nome}</Text>
            </View>
            {item.children && item.children.length > 0 && (
              <View style={styles.childrenContainer}>
                {item.children.map((child, childIndex) => (
                  <View key={child.id} style={styles.childContainer}>
                    {renderItem({ item: child, index: childIndex, section })}
                  </View>
                ))}
              </View>
            )}
            {logsCount !== null ? (
              <Text style={styles.estudadovezes}>
                Esse assunto foi estudado {logsCount} vez{logsCount >= 1 ? 'es' : ''}
              </Text>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.estudadovezes}>
                  Esse assunto foi estudado 0 vez
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      );
    } else {
      return (
        <View style={styles.childTopicContainer}>
          <Text style={styles.childTopicText}>{`${item.nome}`}</Text>
          {item.children && item.children.length > 0 && (
            <View style={styles.childrenContainer}>
              {item.children.map((child, childIndex) => (
                <View key={child.id} style={styles.childContainer}>
                  {renderItem({ item: child, index: childIndex, section })}
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{
        headerStyle: {
          backgroundColor: '#1B1B1B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        title: 'EDITAL VERTICALIZADO',
        headerTitleAlign: 'center',
      }} />
      <View style={styles.container}>
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>FILTRAR POR PESO:</Text>
          <View style={styles.filterButtonsContainer}>
            {[0, 1, 2, 3, 4].map(peso => (
              <Pressable
                key={peso}
                style={[styles.filterButton, pesoFilters.includes(peso.toString()) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(peso.toString(), 'peso')}
              >
                <Text style={styles.filterButtonText}>{peso}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterTitle}>FILTRAR POR BLOCO:</Text>
          <View style={styles.filterButtonsContainer}>
            {['I', 'II', 'III'].map(bloco => (
              <Pressable
                key={bloco}
                style={[styles.filterButton, blocoFilters.includes(bloco) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(bloco, 'bloco')}
              >
                <Text style={styles.filterButtonText}>{bloco}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.materiaTitleTOP}>{currentMateria}</Text>
        </View>

        {loading ? (
          <>
            <Text style={styles.noEditaisText}>Carregando editais...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
          </>
        ) : (
          <SectionList
            sections={groupByMateria(buildSubTree(filterEditais()))}
            keyExtractor={(item, index) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.materiaTitle}>{title}</Text>
            )}
            ListEmptyComponent={<Text style={styles.noEditaisText}>Nenhum edital disponível.</Text>}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#A5B99C']}
                progressBackgroundColor="#1B1B1B"
              />
            }
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
              minimumViewTime: 1000,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const groupByMateria = (editais) => {
  const grouped = editais.reduce((acc, edital) => {
    const existingIndex = acc.findIndex(item => item.title === edital.materia);
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
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  filtersContainer: {
    marginBottom: 5,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 5,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    margin: 4,
  },
  filterButtonActive: {
    backgroundColor: '#A5B99C',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  materiaTitleTOP: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginTop: 10,
    marginBottom: 5,
    alignItems: 'center',
    textAlign: 'center',
  },
  materiaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 10,
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
    fontWeight: 'bold'
  },
  editalDetails: {
    color: '#ffffff',
    fontSize: 14,
  },
  noEditaisText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  childrenContainer: {
    marginLeft: 20,
  },
  childContainer: {
    marginTop: 5,
  },
  childTopicContainer: {
    flexDirection: 'column',
    marginLeft: 10,
    marginBottom: 5,
  },
  childTopicText: {
    color: '#A5B99C',
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 5,
  },
});

export default EditalVerticalizado;
