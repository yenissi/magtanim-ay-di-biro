// components/game/Main.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { useGameData } from '@/hooks/useGameData';
import { ShopModal } from '../../components/(buttons)/ShopModal';
import { BagModal } from '../../components/(buttons)/BagModal';
import { MissionsModal } from '../../components/(buttons)/MissionsModal';
import { ProfileModal } from '../../components/(buttons)/ProfileModal';
import  TriviaModal  from '../../components/(buttons)/TriviaModal';

const Main = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { gameData, loading, error } = useGameData(params.uid as string);
  
  const [shopVisible, setShopVisible] = useState(false);
  const [bagVisible, setBagVisible] = useState(false);
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [triviaVisible, setTriviaVisible] = useState(false);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockOrientation();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.replace('/Signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('@/assets/images/Mainbg.png')} 
      className="flex-1"
    >
      <StatusBar hidden />
      <View className="flex-1">
        {/* Top Bar */}
        <View className="flex-row justify-between p-4">
          <TouchableOpacity
            className="flex-row items-center bg-orange-300 p-2 rounded-lg"
            onPress={() => setProfileVisible(true)}
          >
            <FontAwesome5 name="user-alt" size={18} color="black" className="mr-2" />
            <View>
              <Text className="font-bold">{gameData?.firstName} {gameData?.lastName}</Text>
              <View className="flex-row items-center">
                <MaterialIcons name="attach-money" size={18} color="black" />
                <Text>{gameData?.money}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => setTriviaVisible(true)}
          >
            <Image 
              source={require('@/assets/images/trivia1.png')}
              className="w-12 h-12"
              resizeMode='contain'
            />
            <Text className='text-sm'>Trivia</Text>
          </TouchableOpacity>

        </View>

        {/* Game Controls */}
        <View className="absolute bottom-4 right-2 space-y-4 gap-3">

          <TouchableOpacity 
            className="items-center"
            onPress={() => setShopVisible(true)}
          >
            <Image 
              source={require('@/assets/images/shop.png')}
              className="w-12 h-12"
            />
            <Text className='text-sm'>Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center"
            onPress={() => setBagVisible(true)}
          >
            <Image 
              source={require('@/assets/images/bag.png')}
              className="w-12 h-12"
            />
            <Text className='text-sm'>Bag</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center"
            onPress={() => setMissionsVisible(true)}
          >
            <Image 
              source={require('@/assets/images/missions1.png')}
              className="w-12 h-12"
              resizeMode='contain'
            />
            <Text className='text-sm'>Missions</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <ShopModal
          visible={shopVisible}
          onClose={() => setShopVisible(false)}
          uid={params.uid as string}
          userMoney={gameData?.money || 0}
          onPurchase={() => {/* Refresh game data */}}
        />

        <BagModal
          visible={bagVisible}
          onClose={() => setBagVisible(false)}
          inventory={gameData?.inventory || []}
        />

        <MissionsModal
          visible={missionsVisible}
          onClose={() => setMissionsVisible(false)}
          missions={gameData?.missions || []}
          onMissionComplete={(missionId) => {/* Handle mission completion */}}
        />

        <ProfileModal
          visible={profileVisible}
          onClose={() => setProfileVisible(false)}
          userData={gameData}
          // firstName={gameData?.firstName}
          // lastName={gameData?.lastName}
          gradeLevel={gameData?.gradeLevel}
          school={gameData?.school}
          onSignOut={handleSignOut}
        />

        <TriviaModal
          visible={triviaVisible}
          onClose={() => setTriviaVisible(false)}
        />
      </View>
    </ImageBackground>
  );
};

export default Main;