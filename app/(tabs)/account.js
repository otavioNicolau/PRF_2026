import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, ScrollView, SafeAreaView, Alert, Pressable, Text, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';

import { supabase } from '~/lib/supabase';
import Avatar from '~/components/Avatar';
import { Slide } from '~/components/Slide';
import * as Network from 'expo-network';

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [full_name, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
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
    if (session && session.user) {
      getProfile();
    }
  }, [session]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const user = session?.user;
      if (!user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateProfile = async ({ username, full_name, avatar_url }) => {
    try {
      setLoading(true);

      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        throw new Error('Sem conexão com a internet');
      }

      
      const user = session?.user;
      if (!user) throw new Error('No user on the session!');

      const updates = {
        id: user.id,
        username,
        full_name,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getProfile();
  }, []);

  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>

          <Stack.Screen options={{
            headerStyle: {
              backgroundColor: '#1B1B1B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            title: 'CONTA'
          }} />

          <Avatar
            size={200}
            url={avatarUrl}
            onUpload={(url) => {
              setAvatarUrl(url);
              updateProfile({ username, full_name, avatar_url: url });
            }}
          />

          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={session?.user?.email || ''}
              placeholder="Email"
              editable={false}
            />
          </View>

          <View style={styles.verticallySpaced}>
            <Text style={styles.label}>Nick:</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Nick"
            />
          </View>

          <View style={styles.verticallySpaced}>
            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={full_name}
              onChangeText={setFullName}
              placeholder="Nome Completo"
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
              onPress={() => updateProfile({ username, full_name, avatar_url: avatarUrl })}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Text>
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
              onPress={() => supabase.auth.signOut()}
            >
              <Text style={styles.buttonText}>Sair</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerArea: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  scrollView: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  verticallySpaced: {
    marginVertical: 10,
    width: '100%',
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