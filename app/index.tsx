import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View, Image } from 'react-native';

//Styles
import  '../global.css';
//Component
import CustomButton from '../components/(buttons)/CustomButton';
import Signin from './(auth)/Signin';
import { Redirect, router } from 'expo-router';

export default function Index() {
  return (
    <SafeAreaView className='h-full bg-green-400'>
      <StatusBar backgroundColor="#161622" barStyle="light-content" />
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className='items-center justify-center w-full px-5 h-full'>
          <Image
            className='w-[130px] h-[85px]'
            resizeMode="contain"
            source={require('../assets/images/favicon.png')}
          />
          <View style={{ position: 'relative'}}>
            <Text className='text-center text-2xl font-normal mt-10'>
              Magtanim Ay Di Biro
            </Text>
            <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '300', marginTop: 10 }}>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Atque qui maxime.
            </Text>
            <CustomButton
              title="Continue to Sign In"
              onPress={() => router.push('/Signin')}
              buttonClass="mt-32" textClass={undefined} href={undefined}             
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
