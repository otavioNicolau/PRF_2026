import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, SectionList, Pressable, RefreshControl } from 'react-native';
import { Stack, useNavigation, Link } from 'expo-router';

const EditalVerticalizado = () => {
  const navigation = useNavigation();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pesoFilters, setPesoFilters] = useState([]);
  const [blocoFilters, setBlocoFilters] = useState([]);

  useEffect(() => {
    loadEditais();
  }, []);

  const loadEditais = async () => {
    setRefreshing(true);
    try {
      // Substitua pela URL correta da sua API
      const response = await fetch('https://teal-crostata-aea03c.netlify.app/api/edital_prf');
      const data = await response.json();
      console.log('Editais carregados:', data);
      if (data && data.EDITAL) {
        setEditais(data.EDITAL);
      } else {
        setEditais([]);
      }
    } catch (error) {
      console.error('Erro ao carregar os editais:', error);
      // Aqui você pode exibir um alerta ou mensagem de erro para o usuário
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadEditais();
  };

  const filterEditais = () => {
    let filtered = [...editais];

    // Aplicar filtro por peso
    if (pesoFilters.length > 0) {
      filtered = filtered.filter(edital => pesoFilters.includes(edital.peso));
    }

    // Aplicar filtro por bloco
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>FILTRAR POR PESO:</Text>
          <View style={styles.filterButtonsContainer}>
            {['0', '1', '2', '3', '4'].map(peso => (
              <Pressable
                key={peso}
                style={[styles.filterButton, pesoFilters.includes(peso) ? styles.filterButtonActive : null]}
                onPress={() => toggleFilter(peso, 'peso')}
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
        </View>

        {loading ? (
          <Text style={styles.noEditaisText}>Carregando editais...</Text>
        ) : (
          <SectionList
            sections={groupByMateria(filterEditais())}
            keyExtractor={(item, index) => item.id.toString()}
            renderItem={({ item }) => (

              <Pressable
                onPress={() => navigation.navigate('logs', { id: 1 })}
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
                </View>
              </Pressable>
            )}
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
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 10,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    margin: 5,
  },
  filterButtonActive: {
    backgroundColor: '#A5B99C',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  materiaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginBottom: 10,
  },
  editalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});

export default EditalVerticalizado;
