import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, TextInput, View, Pressable, Text, AppState, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { supabase } from '~/lib/supabase';
import { Slide } from '~/components/Slide';
import * as Network from 'expo-network';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkInternetConnection = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsConnected(networkState.isConnected);
      } catch (error) {
        console.error('Erro ao verificar a conexão com a Internet:', error);
      }
    };

    checkInternetConnection();

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        supabase.auth.startAutoRefresh();
        checkInternetConnection(); // Verifica a conexão ao voltar para o aplicativo
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos não preenchidos', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Sem conexão de internet', 'Verifique sua conexão e tente novamente.');
      return;
    }

    setLoading2(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setLoading2(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos não preenchidos', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!isConnected) {
      Alert.alert('Sem conexão de internet', 'Verifique sua conexão e tente novamente.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      if (!session) {
        throw new Error('Aconteceu um erro!');
      }
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Slide />
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#A5A5A5"
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Text style={styles.label}>Senha:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Senha"
            autoCapitalize="none"
            placeholderTextColor="#A5A5A5"
          />
        </View>
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? '#CCC' : '#A5B99C',
              },
              styles.button,
            ]}
            onPress={signInWithEmail}
            disabled={loading2}
          >
            {loading2 ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>
        </View>
        <View style={styles.verticallySpaced}>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? '#CCC' : '#A5B99C',
              },
              styles.button,
            ]}
            onPress={signUpWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    // padding: 20,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticallySpaced: {
    marginVertical: '5%',
    width: '90%',

  },
  mt20: {
    marginTop: 20,
  },
  input: {
    height: 40,
    width: '100%',
    backgroundColor: '#2B2B2B',
    borderWidth: 1,
    borderColor: 'gray',
    paddingHorizontal: 10,
    color: '#FFFFFF',
  },
  button: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    color: '#A5B99C',
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
});

export default Auth;
