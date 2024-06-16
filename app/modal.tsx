import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Slide } from '~/components/Slide';

export default function Modal() {
  return (
    <SafeAreaView style={styles.containerArea}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: 'PROJETO PRF',
          headerTitleAlign: 'center',

        }}
      />

      <ScrollView style={styles.scrollView}>
        <Slide />

        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>Sobre Otávio Nicolau da Silva</Text>
          <Text style={styles.text}>
            Otávio Nicolau da Silva está se preparando intensamente para ingressar na Polícia Rodoviária Federal em 2026, dedicado a contribuir com a segurança nas estradas brasileiras.
          </Text>

          <Text style={styles.subtitle}>Frase Motivadora</Text>
          <Text style={styles.text}>
          "A persistência é o caminho do êxito." - Charlie Chaplin
          </Text>

          <Text style={styles.subtitle}>Convite aos Convidados Especiais</Text>
          <Text style={styles.text}>
            Hey! PRF Darlan!
          </Text>
          <Text style={styles.text}>
            Hey! PEF Dayane!
          </Text>
          <Text style={styles.text}>
            hey! PRF Neto!
          </Text>
          <Text style={styles.text}>
            Bora embarcar nessa missão? A estrada tá chamando!
          </Text>
          <Text style={styles.text}>
            1,2,3... Valendo!
          </Text>
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
    flex: 1,
    paddingHorizontal: 5,
  },
  contentContainer: {
    paddingVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ffffff',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#A5B99C',
    marginBottom: 20,
  },
});
