import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '~/lib/supabase';

export default function Logs() {
  const navigation = useNavigation();
  const { assunto } = useLocalSearchParams();
  const [observacao, setObservacao] = useState('ESTUDADO! CAVEIRA!');
  const [logs, setLogs] = useState([]);
  const [numLogs, setNumLogs] = useState(0);
  const assuntoJson = JSON.parse(assunto);
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
      authListener?.unsubscribe;
    };
  }, []);

  useEffect(() => {
    if (session) {
      loadLogs(assuntoJson.id, session.user.id);
      countLogs(assuntoJson.id, session.user.id);
    }
  }, [session]);

  const checkInternetConnection = async () => {
    const { isConnected } = await Network.getNetworkStateAsync();
    return isConnected;
  };

  const saveLogsToStorage = async (logs) => {
    try {
      await AsyncStorage.setItem(`logs_${assuntoJson.id}`, JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar logs no AsyncStorage:', error);
    }
  };

  const loadLogsFromStorage = async () => {
    try {
      const storedLogs = await AsyncStorage.getItem(`logs_${assuntoJson.id}`);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error('Erro ao carregar logs do AsyncStorage:', error);
    }
  };

  const saveCountToStorage = async (count) => {
    try {
      await AsyncStorage.setItem(`count_${assuntoJson.id}`, count.toString());
    } catch (error) {
      console.error('Erro ao salvar contagem no AsyncStorage:', error);
    }
  };

  const loadCountFromStorage = async () => {
    try {
      const storedCount = await AsyncStorage.getItem(`count_${assuntoJson.id}`);
      if (storedCount) {
        setNumLogs(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('Erro ao carregar contagem do AsyncStorage:', error);
    }
  };

  const countLogs = async (assunto_id, user_id) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      loadCountFromStorage();
      return;
    }
    try {
      const { count, error } = await supabase
        .from('estudado')
        .select('id', { count: 'exact' })
        .eq('assunto_id', assunto_id)
        .eq('id_user', user_id); // Filtra pelo id do usuário

      if (error) {
        throw error;
      }

      setNumLogs(count);
      saveCountToStorage(count);
    } catch (error) {
      console.error('Erro ao contar os logs:', error.message);
    }
  };

  const loadLogs = async (assunto_id, user_id) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      loadLogsFromStorage();
      return;
    }
    try {
      const { data, error } = await supabase
        .from('estudado')
        .select('*')
        .eq('assunto_id', assunto_id)
        .eq('id_user', user_id) // Filtra pelo id do usuário
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLogs(data || []);
      saveLogsToStorage(data || []);
    } catch (error) {
      console.error('Erro ao carregar os logs:', error.message);
    }
  };

  const insertLog = async (assunto_id, observacao, user_id) => {
    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        Alert.alert('Erro', 'Sem conexão com a internet. Não é possível salvar o log.');
        return;
      }

      const { data, error } = await supabase
        .from('estudado')
        .insert([
          {
            assunto_id,
            observacao,
            created_at: new Date().toISOString(),
            id_user: user_id, // Inclui o id do usuário
          },
        ]);

      if (error) {
        throw error;
      }

      Alert.alert('Sucesso', 'Registro salvo com sucesso!');
      loadLogs(assunto_id, user_id);
      countLogs(assunto_id, user_id);
      setObservacao('ESTUDADO! CAVEIRA!');
    } catch (error) {
      console.error('Erro ao inserir o log de estudo:', error);
    }
  };

  const deleteLog = async (logId, user_id) => {
    try {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        Alert.alert('Erro', 'Sem conexão com a internet. Não é possível excluir o log.');
        return;
      }

      const { error } = await supabase
        .from('estudado')
        .delete()
        .eq('id', logId)
        .eq('id_user', user_id); // Filtra pelo id do usuário

      if (error) {
        throw error;
      }

      loadLogs(assuntoJson.id, user_id);
      countLogs(assuntoJson.id, user_id);
    } catch (error) {
      console.error('Erro ao excluir o log de estudo:', error);
    }
  };

  const handleSave = async () => {
    await insertLog(assuntoJson.id, observacao, session.user.id);
  };

  const confirmDelete = (logId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este log?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => deleteLog(logId, session.user.id) },
      ]
    );
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
        title: assuntoJson.nome,
      }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.assuntoContainer}>
          <Text style={styles.label}>Matéria:</Text>
          <Text style={styles.value}>{assuntoJson.materia}</Text>

          <Text style={styles.label}>Assunto:</Text>
          <Text style={styles.valueTitle}>{assuntoJson.nome}</Text>

          {/* {assuntoJson.children && assuntoJson.children.length > 0 && (
            <View style={styles.childrenContainer}>
              {assuntoJson.children.map((child, index) => (
                <View key={child.id} style={styles.childContainer}>
                  <Pressable
                    onPress={() => {
                      navigation.navigate('logs', { assunto: JSON.stringify(child) });
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#333333' : '#1B1B1B',
                      marginTop: 5,
                      marginBottom: 5,
                      marginLeft: 5,
                      marginRight: 5
                    })}
                  >
                    <Text style={styles.value1}>{child.nome}</Text>
                  </Pressable>
                  {child.children && child.children.length > 0 && (
                    <View style={styles.childrenContainer}>
                      {child.children.map((child2, childIndex) => (
                        <View key={child2.id} style={styles.childContainer}>
                          <Pressable
                            onPress={() => {
                              navigation.navigate('logs', { assunto: JSON.stringify(child2) });
                            }}
                            style={({ pressed }) => ({
                              backgroundColor: pressed ? '#333333' : '#1B1B1B',
                              marginTop: 5,
                              marginBottom: 5,
                              marginLeft: 5,
                              marginRight: 5
                            })}
                          >
                            <Text style={styles.value2}>{child2.nome}</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )} */}

          <Text style={styles.label}>Bloco:</Text>
          <Text style={styles.value}>{assuntoJson.bloco}</Text>

          <Text style={styles.label}>Peso:</Text>
          <Text style={styles.value}>{assuntoJson.peso}</Text>

          <View style={styles.logsCountContainer}>
            <Text style={styles.logsCountText}>
              TOTAL DE VEZES ESTUDADO: {numLogs}
            </Text>
          </View>
        </View>

        <Text style={styles.logsTitle}>CONTROLE DE ESTUDO</Text>
        <Text style={styles.value}>Registre abaixo as informações relevantes sobre o estudo do tópico acima.</Text>

        <View style={styles.observacaoContainer}>
          <Text style={styles.label}>Observação:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Escreva sua observação aqui"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            value={observacao}
            onChangeText={setObservacao}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable style={styles.actionButton} onPress={handleSave}>
            <FontAwesome name="save" size={20} color="#fff" />
            <Text style={styles.buttonText}>Salvar Estudo</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => navigation.goBack()}>
            <FontAwesome name="times" size={20} color="#fff" />
            <Text style={styles.buttonText}>Cancelar</Text>
          </Pressable>
        </View>

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Logs de Estudo:</Text>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>Nenhum log disponível.</Text>
          ) : (
            logs.map((log) => (
              <Pressable
                key={log.id}
                style={styles.logItem}
                onLongPress={() => confirmDelete(log.id)}
              >
                <View>
                  <Text style={styles.logText}>{log.observacao}</Text>
                  <Text style={styles.logDateTime}>{new Date(log.created_at).toLocaleString()}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1B1B1B',
  },
  assuntoContainer: {
    backgroundColor: '#1B1B1B',
    padding: 15,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  label: {
    color: '#A5B99C',
    fontSize: 18,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  value1: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    padding:5,

  },
  value2: {
    color: '#fff',
    fontSize: 14,
    padding:5,
    marginLeft: 20,
  },
  valueTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    padding:5,
  },
  observacaoContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A5B99C',
    padding: 10,
  },
  deleteButton: {
    backgroundColor: '#ff5555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  logsContainer: {
    marginTop: 30,
  },
  logsTitle: {
    color: '#A5B99C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noLogsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  logItem: {
    backgroundColor: '#333',
    padding: 15,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  logText: {
    color: '#fff',
    fontSize: 16,
  },
  logDateTime: {
    color: '#A5B99C',
    fontSize: 14,
    marginTop: 5,
  },
  logsCountContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logsCountText: {
    color: '#A5B99C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  childrenContainer: {
    marginBottom: 0,
  },
  childContainer: {
    marginBottom: 0,
  },
});
