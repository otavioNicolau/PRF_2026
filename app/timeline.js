import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '~/lib/supabase';
import * as Network from 'expo-network';
import { useNavigation, Stack } from 'expo-router';

const TimelineScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
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
    const loadTimeline = async () => {
      setLoading(true);
      try {
        const { isConnected } = await Network.getNetworkStateAsync();
        if (isConnected && session) {
          const userId = session.user.id;
          const { data, error } = await supabase
            .from('estudado')
            .select(`
              id,
              created_at,
              assunto:assuntos (materia,nome, bloco, peso),
              observacao
            `)
            .eq('id_user', userId)
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          setTimelineData(data || []);
        } else {
          console.warn('Sem conexão com a internet. Carregando dados em cache.');
          // Carregar dados do cache se necessário
        }
      } catch (error) {
        console.error('Erro ao carregar a timeline:', error.message);
        // Carregar dados do cache se disponível
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      loadTimeline();
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
            title: 'TIME LINE',
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
          title: 'TIME LINE',
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={timelineData}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Data desconhecida'}</Text>
              <Text style={styles.materiaText}>{item.assunto?.materia || 'Matéria desconhecida'}</Text>
              <Text style={styles.assuntoText}>{item.assunto?.nome || 'Assunto desconhecido'}</Text>
              <Text style={styles.observacaoText}>{item.observacao || 'Observação não disponível'}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noDataText}>Nenhum dado encontrado.</Text>}
        />
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
    padding: 16,
  },
  itemContainer: {
    marginBottom: 12,
    padding: 12,
    // backgroundColor: '#2C2C2C',
    // borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    fontSize: 14,
    color: '#A5B99C',
    fontWeight: 'bold',
  },
  materiaText: {
    fontSize: 20,
    color: '#ffffff',
    paddingTop: 10,
  },
  observacaoText: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 10,
    borderTopColor: '#ccc',
    borderLeftColor: '#1B1B1B',
    borderBottomColor: '#1B1B1B',
    borderRightColor: '#1B1B1B',
    borderWidth: 1,
    padding: 5,

  },
  assuntoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A5B99C',
    marginTop: 4,
  },
  noDataText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TimelineScreen;
