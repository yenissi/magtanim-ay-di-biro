import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import Signin from './Signin';
import Signup from './Signup';

const AuthLayout = () => {
  return (
    <>
    <Stack>
    <StatusBar backgroundColor="#161622" barStyle="light-content" />
      <Stack.Screen name="Signin" options={{headerShown:false}} />
      <Stack.Screen name="Signup" options={{headerShown:false}} />
    </Stack>
    </>
  )
}

export default AuthLayout