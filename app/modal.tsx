import { View, Text, StyleSheet, Dimensions, ActivityIndicator, FlatList, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { Stack, Link } from 'expo-router';
import { Slide } from '~/components/Slide';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Modal() {
  return (
    <SafeAreaView style={styles.containerArea}>
      <ScrollView
        style={styles.scrollView}
      >
        <Stack.Screen options={{
          headerStyle: {
            backgroundColor: '#1B1B1B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          title: 'PROJETO RPF 2026'
        }} />

        <Slide />


        <View><Text>Bem vindo</Text></View>
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
  },
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  stepContainer: {
    marginBottom: 20,
  },
  cursoContainer: {
    width: 300,
    height: 180,
    padding: 10,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#ccc',
    marginRight: 10,
  },
  cursoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ffffff',
  },
  cursoInfo: {
    textAlign: 'center',
    color: '#A5B99C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
});
