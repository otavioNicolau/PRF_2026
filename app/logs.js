import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, useNavigation } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qyqcgxgxcbvlatlwzbuy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWNneGd4Y2J2bGF0bHd6YnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg5NzE4MTEsImV4cCI6MjAzNDU0NzgxMX0.SsFiwHvmTQgu4DvwpdR7WwHwBoH25Gdb0EzzWTe9g4Y';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Logs() {
  const navigation = useNavigation();
  const { assunto } = useLocalSearchParams();
  const [observacao, setObservacao] = useState('ESTUDADO! CAVEIRA!');
  const [logs, setLogs] = useState([]);
  const [numLogs, setNumLogs] = useState(0); // Estado para armazenar o número de logs
  const assuntoJson = JSON.parse(assunto);

  const countLogs = async (assunto_id) => {
    try {
      const { count, error } = await supabase
        .from('estudado')
        .select('id', { count: 'exact' })
        .eq('assunto_id', assunto_id);
  
      if (error) {
        throw error;
      }
  
      setNumLogs(count);
    } catch (error) {
      console.error('Erro ao contar os logs:', error.message);
    }
  };
  

  const loadLogs = async (assunto_id) => {
    try {
      const { data, error } = await supabase
        .from('estudado')
        .select('*')
        .eq('assunto_id', assunto_id)
        .order('created_at', { ascending: false });
  
      if (error) {
        throw error;
      }
  
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar os logs:', error.message);
    }
  };
  
  
  const insertLog = async (assunto_id, observacao) => {
    try {
      const { data, error } = await supabase
        .from('estudado')
        .insert([
          {
            assunto_id,
            observacao,
            created_at: new Date().toISOString(), // Inserir a data atual no formato adequado
          },
        ]);

      if (error) {
        throw error;
      }

      Alert.alert('Sucesso', 'Registro salvo com sucesso!');
      loadLogs(assunto_id);
      countLogs(assunto_id);
      setObservacao('ESTUDADO! CAVEIRA!');
    } catch (error) {
      console.error('Erro ao inserir o log de estudo:', error);
    }
  };

  const deleteLog = async (logId) => {
    try {
      const { error } = await supabase
        .from('estudado')
        .delete()
        .eq('id', logId);

      if (error) {
        throw error;
      }

      loadLogs(assuntoJson.id);
      countLogs(assuntoJson.id);
    } catch (error) {
      console.error('Erro ao excluir o log de estudo:', error);
    }
  };

  const handleSave = async () => {
    await insertLog(assuntoJson.id, observacao);
  };

  const confirmDelete = (logId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este log?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => deleteLog(logId) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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

        <View style={styles.assuntoContainer}>
          <Text style={styles.label}>Matéria:</Text>
          <Text style={styles.value}>{assuntoJson.materia}</Text>
          
          <Text style={styles.label}>Assunto:</Text>
          <Text style={styles.value}>{assuntoJson.nome}</Text>
          
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
    </SafeAreaView>
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
    fontSize: 14,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
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
});
