import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import Signup from './Signup';
import Signin from './Signin';

const Stack = createStackNavigator();


const AuthNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="Signin">
      <Stack.Screen name="Signin" component={Signin} />
      <Stack.Screen name="Signup" component={Signup} />
    </Stack.Navigator>
  )
}

export default AuthNavigation