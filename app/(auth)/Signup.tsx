import { View, Text, ImageBackground,TextInput, TouchableOpacity, Modal, FlatList } from 'react-native'
import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { Link } from 'expo-router';




const Signup = () => {
  // state variables for form inputs
  const [userpass, setUserpass] = useState('');
  const [userfname, setUserfname] = useState('');
  const [userlname, setUselname] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState(null);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
  };

  const handlePress = (grade) => {
    setActiveButton(grade);
  };
  return (
    <ImageBackground
      source={require('../../assets/images/Grass.png')}
      style={{ flex: 1 }}
    >
      <StatusBar backgroundColor="#fff" barStyle={'dark-content'}/>
      <View className="flex-1 justify-center items-center">
        {/* Form */}
        <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
          <Text className="text-2xl font-bold text-center mb-4">Create Account</Text>
          {/* First at Last Name */}
          <View className='items-center flex-row gap-2'>
            <View className='flex-col'>
              <Text className="text-sm mb-2">Firstname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter Firstname"
                value={userfname}
                onChangeText={setUserfname}
              />
            </View>
            <View className='flex-col'>
              <Text className="text-sm mb-2">Lastname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter Lastname"
                value={userlname}
                onChangeText={setUselname}
              />
            </View>
          </View>
          {/* Grade level, Password, School */}
          <View>
            <Text className="text-sm mb-2">Password</Text>
            <TextInput
              className="bg-yellow-200 rounded-lg p-4 mb-4"
              secureTextEntry={true}
              placeholder="Enter Password"
              value={userpass}
              onChangeText={setUserpass}
            />
            {/* Dropdown Grade Level */}
            <Text className="text-sm mb-2">Grade Level</Text>
            <View className='flex-row gap-2'>
              <TouchableOpacity
                className={`border border-black p-2 rounded-lg ${activeButton === 'Grade 4' ? 'bg-yellow-500' : 'bg-yellow-200'}`}
                onPress={() => handlePress('Grade 4')}
              >
                <Text className="text-sm">Grade 4</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`border border-black p-2 rounded-lg ${activeButton === 'Grade 5' ? 'bg-yellow-500' : 'bg-yellow-200'}`}
                onPress={() => handlePress('Grade 5')}
              >
                <Text className="text-sm">Grade 5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`border border-black p-2 rounded-lg ${activeButton === 'Grade 6' ? 'bg-yellow-500' : 'bg-yellow-200'}`}
                onPress={() => handlePress('Grade 6')}
              >
                <Text className="text-sm">Grade 6</Text>
              </TouchableOpacity>
            </View>
            
            
            <Text className="text-sm mb-2">School</Text>
            {/* Option 1 */}
            <TouchableOpacity
              className="flex-row items-center mb-4"
              onPress={() => handleSelect('option1')}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 justify-center items-center ${selectedValue === 'option1' ? 'bg-blue-500 border-blue-500' : ''}`}
              >
                {selectedValue === 'option1' && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
              <Text className="text-lg">CCES - Calauan Central</Text>
            </TouchableOpacity>
            {/* Option 2 */}
            <TouchableOpacity
              className="flex-row items-center mb-4"
              onPress={() => handleSelect('option2')}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 justify-center items-center ${selectedValue === 'option2' ? 'bg-blue-500 border-blue-500' : ''}`}
              >
                {selectedValue === 'option2' && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
              <Text className="text-lg">BCES - Balayhangin Central</Text>
            </TouchableOpacity>
          </View>
          {/* Button at Signin */}
          <View>
            {/* Signup Button */}
            <TouchableOpacity
              className="bg-yellow-400 rounded-lg border border-black py-3 items-center hover"
              onPress={() => {
                // Add your signup logic here
                console.log('Signup Successful!');
              }}
            >
              <Text>Sign Up</Text>
            </TouchableOpacity>
            {/* Already have an Account */}
            <TouchableOpacity className='flex-row mt-4 items-center justify-center'>
              <Text className="text-sm text-center mr-1">Already have an account?</Text>
              <Link href={{pathname: "/(auth)/Signin", params:{Signin:"SignIn"},}}>
                <Text className="text-sm text-center mt-4 text-blue-500 underline">Login</Text>
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Add your signup form here */}
    </ImageBackground>
  )
}

export default Signup