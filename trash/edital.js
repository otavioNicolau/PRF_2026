import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, SectionList, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '~/trash/lib/supabase';
import * as Network from 'expo-network';
import { useNavigation, Stack, useRouter } from 'expo-router';


const EditalVerticalizado = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [materiasPorBloco, setMateriasPorBloco] = useState([]);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Erro ao obter a sessão:', error.message);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const loadMaterias = async () => {
      setLoading(true);
      try {
        const { isConnected } = await Network.getNetworkStateAsync();
        if (isConnected && session) {
          const userId = session.user.id;
          const { data: assuntos, error } = await supabase
            .from('assuntos')
            .select('materia, bloco')

          if (error) {
            throw error;
          }

          if (assuntos && assuntos.length > 0) {
            // Organiza as matérias por bloco
            const materiasOrganizadas = assuntos.reduce((acc, item) => {
              if (!acc[item.bloco]) {
                acc[item.bloco] = [];
              }
              if (!acc[item.bloco].includes(item.materia)) {
                acc[item.bloco].push(item.materia);
              }
              return acc;
            }, {});

            // Ordena as chaves (blocos) alfabeticamente
            const sortedKeys = Object.keys(materiasOrganizadas).sort();
            const sections = sortedKeys.map((bloco, index) => ({
              title: `${index + 1}`, // Transforma em I, II, III, etc.
              data: materiasOrganizadas[bloco],
            }));

            setMateriasPorBloco(sections);

            // Salva em cache todas as matérias para acessar offline
            const todasMaterias = assuntos.map(item => item.materia);
            const materiasUnicas = [...new Set(todasMaterias)];
            await AsyncStorage.setItem('materias', JSON.stringify(materiasUnicas));
          } else {
            setMateriasPorBloco([]);
          }
        } else {
          console.warn('Sem conexão com a internet. Carregando dados em cache.');
          const cachedMaterias = await AsyncStorage.getItem('materias');
          if (cachedMaterias) {
            const cachedSections = [{ title: 'Cache', data: JSON.parse(cachedMaterias) }];
            setMateriasPorBloco(cachedSections);
          } else {
            console.error('Sem dados de matérias em cache disponíveis');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar as matérias:', error.message);
        const cachedMaterias = await AsyncStorage.getItem('materias');
        if (cachedMaterias) {
          const cachedSections = [{ title: 'Cache', data: JSON.parse(cachedMaterias) }];
          setMateriasPorBloco(cachedSections);
        } else {
          console.error('Sem dados de matérias em cache disponíveis');
        }
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      loadMaterias();
    }
  }, [session]);

  if (loading) {
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
          }}
        />
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

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
        }}
      />


      <View style={styles.container}>

        <Pressable
          onPress={() => {
            navigation.navigate('timeline');
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#333333' : '#1B1B1B',
            marginTop: 5,
            marginBottom: 5,
            marginLeft: 5,
            marginRight: 5,
            padding:10,
            borderWidth: 1,
            borderColor: '#ccc',
          })}
        >
          <Text style={styles.buttonTimeLine}>TIME LINE</Text>
        </Pressable>
        {materiasPorBloco.length > 0 ? (
          <SectionList
            sections={materiasPorBloco}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  navigation.navigate('edital_materia', { materia: item, assunto: JSON.stringify(item) });
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#333333' : '#1B1B1B',
                  marginTop: 5,
                  marginBottom: 5,
                  marginLeft: 5,
                  marginRight: 5,

                })}
              >

                <View style={styles.materiaContainer}>
                  <Text style={styles.materiaText}>{index} - {item}</Text>
                </View>
              </Pressable>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.blocoTitle}> 0{title} - BLOCO</Text>
            )}
            ListEmptyComponent={<Text style={styles.noMateriasText}>Nenhuma matéria encontrada.</Text>}
          />
        ) : (
          <Text style={styles.noMateriasText}>Nenhuma matéria encontrada.</Text>
        )}
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
    backgroundColor: '#1B1B1B',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  blocoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
    padding: 15,
    color: '#A5B99C',
    marginBottom: 10,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#1B1B1B',
    textAlign: 'center',
    backgroundColor: '#2C2C2C',

  },
  buttonTimeLine: {
    fontSize: 20,
    fontWeight: 'bold',
    // marginBottom: 10,
    // marginTop: 10,
    color: '#A5B99C',
    // marginBottom: 10,
    fontWeight: 'bold',

    textAlign: 'center',

  },
  materiaContainer: {
    // paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#444444',
  },
  materiaText: {
    fontSize: 15,
    color: '#ffffff',
    // fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#1B1B1B',
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  noMateriasText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default EditalVerticalizado;
