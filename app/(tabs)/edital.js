import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, ActivityIndicator, Pressable, RefreshControl, Alert, FlatList } from 'react-native';
import { useNavigation, Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '~/lib/supabase';
import * as Network from 'expo-network';
import { FontAwesome } from '@expo/vector-icons';


const EditalVerticalizado = () => {
  const navigation = useNavigation();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pesoFilters, setPesoFilters] = useState([]);
  const [blocoFilters, setBlocoFilters] = useState([]);
  const [materiaFilters, setMateriaFilters] = useState([]);
  const [availableMaterias, setAvailableMaterias] = useState([]);
  const [session, setSession] = useState(null);
  const [maisEdtudado, setmaisEdtudado] = useState(null);
  const [menosEdtudado, setmenosEdtudado] = useState(null);

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

 
  const loadEditais = async () => {
    setRefreshing(true);
    try {
      const { isConnected } = await Network.getNetworkStateAsync();
      if (isConnected) {

        const userId = session?.user?.id; // Obtém o ID do usuário logado
        // if (!userId) throw new Error('User not logged in');

        const { data: assuntos, error } = await supabase
          .from('assuntos')
          .select(`
            *,
            estudado:estudado(count)
          `)
          .eq('estudado.id_user', userId); // Adiciona a condição para o usuário logado

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
    loadEditais();
  }, []);

  useEffect(() => {
    filterAvailableMaterias();
  }, [blocoFilters]);



  const onRefresh = useCallback(() => {
    loadEditais();
  }, [session]);


  const filterEditais = () => {
    let filtered = [...editais];

    if (pesoFilters.length > 0) {
      filtered = filtered.filter(edital => pesoFilters.includes(edital.peso.toString()));
    }

    if (blocoFilters.length > 0) {
      filtered = filtered.filter(edital => blocoFilters.includes(edital.bloco));
    }

    if (materiaFilters.length > 0) {
      filtered = filtered.filter(edital => materiaFilters.includes(edital.materia));
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
    } else if (filterType === 'materia') {
      if (materiaFilters.includes(value)) {
        setMateriaFilters(materiaFilters.filter(item => item !== value));
      } else {
        setMateriaFilters([...materiaFilters, value]);
      }
    }
  };

  const filterAvailableMaterias = () => {
    let filtered = [...editais];

    if (blocoFilters.length > 0) {
      filtered = filtered.filter(edital => blocoFilters.includes(edital.bloco));
    }

    const materias = [...new Set(filtered.map(edital => edital.materia))];
    setAvailableMaterias(materias);
  };


  const RenderItem = memo(({ item, index, section }) => {
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
            <Text style={styles.editalTitle}>{item.nome}</Text>
            <Text style={styles.estudadovezes}>Esse assunto tem peso: {item.peso}</Text>

          </View>
          <Text style={styles.estudadovezes}>
            Esse assunto foi estudado {item.estudado[0].count} vez{item.estudado[0].count !== 1 ? 'es' : ''}
          </Text>
        </View>
      </Pressable>
    );
  });

  const handleMostStudied = () => {
    const sortedEditais = [...editais].sort((a, b) => b.estudado[0].count - a.estudado[0].count);
    setEditais(sortedEditais);
    setmenosEdtudado(0)
    setmaisEdtudado(1)
  };

  const handleLeastStudied = () => {
    const sortedEditais = [...editais].sort((a, b) => a.estudado[0].count - b.estudado[0].count);
    setEditais(sortedEditais);
    setmenosEdtudado(1)
    setmaisEdtudado(0)
  };

  const clearFilters = () => {
    setLoading(true)
    setPesoFilters([]);
    setBlocoFilters([]);
    setMateriaFilters([]);
    setLoading(false);
  };

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
          title: 'EDITAL VERTICALIZADO',

          headerRight: () => (
            <Pressable style={{ marginRight: 30, padding: 2 }} onPress={clearFilters}>
              <FontAwesome name="refresh" size={16} color="#fff" />
            </Pressable>


          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>FILTRAR POR BLOCO:</Text>
          <View style={styles.filterButtonsContainer}>
            {['I', 'II', 'III'].map((bloco) => (
              <Pressable
                key={bloco}
                style={[styles.filterButton, blocoFilters.includes(bloco) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(bloco, 'bloco')}
              >
                <Text style={styles.filterButtonText}>{bloco}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.filterTitle}>FILTRAR POR PESO:</Text>
          <View style={styles.filterButtonsContainer}>
            {[0, 1, 2, 3, 4].map((peso) => (
              <Pressable
                key={peso}
                style={[styles.filterButton, pesoFilters.includes(peso.toString()) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(peso.toString(), 'peso')}
              >
                <Text style={styles.filterButtonText}>{peso}</Text>
              </Pressable>
            ))}
          </View>


          <Text style={styles.filterTitle}>FILTRAR POR MATÉRIA:</Text>
          <FlatList
            horizontal
            data={availableMaterias}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.filterButton, materiaFilters.includes(item) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(item, 'materia')}
              >
                <Text style={styles.filterButtonText}>{item}</Text>
              </Pressable>
            )}
          />

          {/* <Text style={styles.materiaTitleTOP}>{currentMateria}</Text> */}

          <View style={styles.buttonContainer}>

            <Pressable
              style={[styles.filterButton, maisEdtudado > 0 ? styles.filterButtonActive : null]}
              onPress={handleMostStudied}
            >
              <Text style={styles.filterButtonText}>Mais Estudado</Text>
            </Pressable>

            <Pressable
              style={[styles.filterButton, menosEdtudado > 0 ? styles.filterButtonActive : null]}
              onPress={handleLeastStudied}
            >
              <Text style={styles.filterButtonText}>Menos Estudado</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <>
            <Text style={styles.noEditaisText}>Carregando editais...</Text>
            <ActivityIndicator size="large" color="#ffffff" />
          </>
        ) : (
          <SectionList
            sections={groupByMateria(filterEditais())}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index, section }) => <RenderItem item={item} index={index} section={section} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.materiaTitle}>{title}</Text>
            )}
            ListEmptyComponent={<Text style={styles.noEditaisText}>Nenhum edital encontrado.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            // onViewableItemsChanged={onViewableItemsChanged}
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
  filtersContainer: {
    marginBottom: 5,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 2,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 6,
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
    fontWeight: 'bold',
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
  loadingContainer: {
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#A5B99C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});

export default EditalVerticalizado;
