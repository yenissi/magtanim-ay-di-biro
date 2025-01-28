import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View, Image } from 'react-native';
//Styles
import  '../global.css';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
//Sign Components
import Signin from './(auth)/Signin';

const Stack = createStackNavigator();


export default function Index() {
  return (
    <SafeAreaView className='h-full bg-green-400'>
      <StatusBar backgroundColor="#fff" barStyle={'dark-content'}/>
      <ScrollView contentContainerStyle={{ height: '100%' }}>
          <Signin />
      </ScrollView>
    </SafeAreaView>
  );
}
