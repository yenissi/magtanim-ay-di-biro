import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SimpleLineIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { ref, update, increment } from 'firebase/database';
import { Firebase_Auth, Firebase_Database } from '@/firebaseConfig';
import { useGameData } from '@/hooks/useGameData';
import { ShopModal } from '../../components/(buttons)/ShopModal';
import { BagModal } from '../../components/(buttons)/BagModal';
import { MissionsModal } from '../../components/(buttons)/MissionsModal';
import { ProfileModal } from '../../components/(buttons)/ProfileModal';
import TriviaModal from '../../components/(buttons)/TriviaModal';
import { Audio } from 'expo-av';
import { Taniman } from '../../components/(buttons)/Taniman';
import type { InventoryItem } from '@/types';

const Main = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { gameData, loading, error } = useGameData(params.uid as string);
  
  const [shopVisible, setShopVisible] = useState(false);
  const [bagVisible, setBagVisible] = useState(false);
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [triviaVisible, setTriviaVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockOrientation();
    
    return () => {
      ScreenOrientation.unlockAsync();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async (soundFile: number) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      setSound(newSound);
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate(async status => {
        if (status.didJustFinish) {
          await newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(Firebase_Auth);
      router.replace('/Signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpdateMoney = async (amount: number) => {
    if (!params.uid) return;
    
    try {
      const userRef = ref(Firebase_Database, `users/${params.uid}`);
      await update(userRef, {
        money: (gameData?.money || 0) + amount
      });
    } catch (error) {
      console.error('Error updating money:', error);
    }
  };

  const handleUpdateStatistics = async (stats: { plantsGrown?: number, moneyEarned?: number }) => {
    if (!params.uid) return;
    
    try {
      const userRef = ref(Firebase_Database, `users/${params.uid}/statistics`);
      const updates: { [key: string]: number } = {};
      
      if (stats.plantsGrown) {
        updates.plantsGrown = increment(stats.plantsGrown);
      }
      if (stats.moneyEarned) {
        updates.moneyEarned = increment(stats.moneyEarned);
      }
      
      await update(userRef, updates);
    } catch (error) {
      console.error('Error updating statistics:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">Error loading game data</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('@/assets/images/maingrass.png')} 
      className="flex-1"
    >
      <StatusBar hidden />
      <View className="flex-1">
        {/* Top Bar */}
        <View className="flex-row justify-between p-1">
          <TouchableOpacity
            className="flex-row items-center bg-orange-300 p-2 rounded-lg border-2 border-black-400"
            onPress={() => setProfileVisible(true)}
          >
            <SimpleLineIcons name="user" size={22} color="black" className="p-2 mr-2 rounded-lg border border-black" />
            <View>
              <Text className="font-bold">{gameData?.firstName} {gameData?.lastName}</Text>
              <View className="flex-row items-center">
                <Text>₱ {gameData?.money}.00</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => {
              setTriviaVisible(true);
              playSound(require('@/assets/sound/sound.mp3'));
            }}
          >
            <Image 
              source={require('@/assets/images/cloud.png')}
              className="w-16 h-16"
              resizeMode="contain"
            />
            <Text className="text-sm absolute mt-12 text-white font-medium">Trivia</Text>
          </TouchableOpacity>
        </View>

        {/* Game Controls */}
        <View className="absolute bottom-2 right-3 space-y-4 gap-3">
          <TouchableOpacity 
            className="items-center"
            onPress={() => setShopVisible(true)}
          >
            <Image 
              source={require('@/assets/images/shop.png')}
              className="w-12 h-12"
            />
            <Text className="text-sm text-white font-medium absolute mt-10">Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center"
            onPress={() => setBagVisible(true)}
          >
            <Image 
              source={require('@/assets/images/bag.png')}
              className="w-12 h-12 mt-3"
            />
            <Text className="text-sm text-white font-medium absolute mt-14">Bag</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center"
            onPress={() => setMissionsVisible(true)}
          >
            <Image 
              source={require('@/assets/images/missions1.png')}
              className="w-12 h-12 mt-3"
              resizeMode="contain"
            />
            <Text className="text-sm text-white font-medium">Mission</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <ShopModal
          visible={shopVisible}
          onClose={() => setShopVisible(false)}
          uid={params.uid as string}
          userMoney={gameData?.money || 0}
          onPurchase={() => {/* Refresh game data handled by useGameData */}}
        />

        <BagModal
          visible={bagVisible}
          onClose={() => setBagVisible(false)}
          inventory={gameData?.inventory || []}
          onSelectItem={setSelectedItem}
          selectedItem={selectedItem}
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
          gradeLevel={gameData?.gradeLevel}
          school={gameData?.school}
          onSignOut={handleSignOut}
        />

        <TriviaModal
          visible={triviaVisible}
          onClose={() => setTriviaVisible(false)}
        />

        <Taniman
          inventory={gameData?.inventory || []}
          selectedItem={selectedItem}
          userMoney={gameData?.money || 0}
          onUpdateMoney={handleUpdateMoney}
          onUpdateStatistics={handleUpdateStatistics}
        />
      </View>
    </ImageBackground>
  );
};

export default Main;