import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // You need to install react-native-vector-icons
import { Link } from 'expo-router';

const Signin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };



  return (
    <ImageBackground
      source={require('../../assets/images/Grass.png')}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
          <Text className="text-2xl font-bold text-center mb-4">
            Welcome Back!
          </Text>

          {/* Username Input */}
          <Text className="text-lg mb-2">Username:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
          />

          {/* Password Input */}
          <Text className="text-lg mb-2">Password:</Text>
          <View className="relative">
            <TextInput
              className="bg-yellow-200 rounded-lg p-4 mb-7 pr-12"
              placeholder="Enter your password"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              className="absolute right-4 top-6 transform -translate-y-1/2"
            >
              <Icon
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          {/* Sign-In Button */}
          <TouchableOpacity className="bg-yellow-400 rounded-lg border border-black py-3 items-center mb-4 hover">
            <Text className="font-bold text-lg">Sign In</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className=" text-center items-center justify-center flex-row">
            <Text className='text-sm'>Don’t have an account?{' '}</Text>
            <TouchableOpacity>
              <Link href={{pathname: "/(auth)/Signup", params:{Signun:"SignUp"},}}>
                <Text className="text-blue-500 underline">Create account</Text>
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Signin;