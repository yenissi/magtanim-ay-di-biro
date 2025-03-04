import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SimpleLineIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { ref, update, increment, onValue } from 'firebase/database';
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
import { savePlotsState } from '@/firebaseUtils';
import { Decompose } from '@/components/(buttons)/Decompose';
import { INITIAL_GAME_STATE } from '@/config/gameConfig';

// Define PlotStatus type to match what's being used in Taniman
type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: any;
};

 const Main = () => {
  const params = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const { gameData, loading, error } = useGameData(params.uid as string);
  
  const [shopVisible, setShopVisible] = useState(false);
  const [decomposeVisible, setDecomposeVisible] = useState(false);
  const [bagVisible, setBagVisible] = useState(false);
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [userMoney, setUserMoney] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [triviaVisible, setTriviaVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [plotsState, setPlotsState] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_GAME_STATE.missions);
  
  // Add plots state - initialize with a 3x3 grid
  const [plots, setPlots] = useState<PlotStatus[][]>(
    Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => ({
        isPlowed: false,
        isWatered: false,
        plant: undefined
      }))
    )
  );
  const [modals, setModals] = useState({
    shop: false,
    bag: false,
    missions: false,
    profile: false,
    trivia: false,
  });

  useEffect(() => {
    if (!params.uid) return;
    const userRef = ref(Firebase_Database, `users/${params.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setInventory(data.inventory || []);
        setUserMoney(data.money || 0);
        setPlots(data.plotsState || plots); // Ensure default format
      }
    });
    return () => unsubscribe();
  }, [params.uid]);

  // FIX 1: Improved inventory synchronization with real-time database
  useEffect(() => {
    if (!params.uid) return;

    const userRef = ref(Firebase_Database, `users/${params.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        if (userData.inventory) {
          console.log('Syncing inventory from database:', userData.inventory);
          setInventory(userData.inventory);
        }else{
          setInventory([]);
        }
        // Update money from real-time database
        if (userData.money !== undefined) {
          setUserMoney(userData.money);
        }
        // Update plots state if exists
        if (userData.plotsState) {
          setPlotsState(userData.plotsState);
          // Also update the plots state
          setPlots(userData.plotsState);
        }
      }
    });
    return () => unsubscribe();
  }, [params.uid]);

  // FIX 2: Keep selectedItem in sync with inventory changes
  useEffect(() => {
    if (selectedItem && !inventory.find(item => item.id === selectedItem.id)) {
      // The selected item has been removed from inventory
      setSelectedItem(null);
    }
  }, [inventory, selectedItem]);

  // FIX 3: Improved useEffect for gameData initialization
  useEffect(() => {
    if (gameData) {
      if (gameData.inventory) {
        setInventory(gameData.inventory);
      }
      
      if (gameData.money !== undefined) {
        setUserMoney(gameData.money);
      }
      
      if (gameData.plotsState) {
        setPlotsState(gameData.plotsState);
        setPlots(gameData.plotsState);
      }
    }
  }, [gameData]);

  // Function to handle removing item from inventory
  const handleRemoveItem = async (itemId: string) => {
    if (!params.uid) return;
    try {
      const newInventory = inventory.filter(item => item.id !== itemId);
      setInventory(newInventory);
      await update(ref(Firebase_Database, `users/${params.uid}`), { inventory: newInventory });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Function to handle adding items to inventory - with improved error handling
  const handleAddToInventory = async (item: InventoryItem) => {
    if (!params.uid) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    try {
      console.log(`Adding item to inventory:`, item);
      
      // Update local state first
      const newInventory = [...inventory, item];
      setInventory(newInventory);
      
      // Then update Firebase
      const userRef = ref(Firebase_Database, `users/${params.uid}`);
      await update(userRef, {
        inventory: newInventory
      });
      
      console.log('Item added successfully');
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      Alert.alert("Error", "Failed to add item to inventory");
    }
  };

  const handleUseItem = (item: InventoryItem) => { 
    console.log('Using Item: ', item);
    // For consumable items, remove from inventory after use
    const nonConsumableTools = ['Asarol', 'Regadera', 'Itak'];
    if (!nonConsumableTools.includes(item.title)) {
      handleRemoveItem(item.id);
    }
  };

  const handleUpdateInventory = async (newInventory: InventoryItem[]) => {
    setInventory(newInventory);
    if (params.uid) {
      const userRef = ref(Firebase_Database, `users/${params.uid}`);
      await update(userRef, {
        inventory: newInventory
      });
    }
  };

  const handleSellItem = async (item: InventoryItem) => {
    if (!params.uid) {
      return;
    }
    try {
      const moneyEarned = item.sellPrice || 0;
      await handleUpdateMoney(moneyEarned);
      await handleRemoveItem(item.id);
      await handleUpdateStatistics({ moneyEarned });
      Alert.alert("Success", `Sold ${item.title} for ${moneyEarned} coins!`);
    } catch (error) {
      console.error('Error selling item:', error);
      Alert.alert("Error", "Failed to sell item");
    }
  };

  // FIX 4: Improved plot state saving
  const handleSavePlotsState = async () => {
    if (!params.uid) return;
    
    try {
      const sanitizedPlotsState = plots.map(row => 
        row.map(plot => ({
          ...plot,
          plant: plot.plant !== undefined ? plot.plant : null, // Replace undefined with null
        }))
      );
  
      await update(ref(Firebase_Database, `users/${params.uid}`), {
        plotsState: sanitizedPlotsState,
      });
  
      console.log("Plots state saved successfully!");
    } catch (error) {
      console.error("Error saving plots state:", error);
    }
  };

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
        setSound(null);
      }
  
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      setSound(newSound);
      await newSound.playAsync();
  
      newSound.setOnPlaybackStatusUpdate(async (status) => {
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
      const newMoney = userMoney + amount;
      setUserMoney(newMoney);
      await update(ref(Firebase_Database, `users/${params.uid}`), { money: newMoney });
    } catch (error) {
      console.error('Error updating money:', error);
    }
  };

  const handleMissionComplete = (missionId: number, answers: string[]) => {
    const updatedMissions = missions.map(mission => 
      mission.id === missionId 
        ? { ...mission, completed: true } 
        : mission
    );
    setMissions(updatedMissions);
    
    // Optional: Save mission progress to Firebase
    if (params.uid) {
      try {
        update(ref(Firebase_Database, `users/${params.uid}`), {
          missions: updatedMissions
        });
      } catch (error) {
        console.error('Error saving mission progress:', error);
      }
    }

    // Optional: Add mission reward to money
    const completedMission = updatedMissions.find(m => m.id === missionId);
    if (completedMission) {
      handleUpdateMoney(completedMission.reward);
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

  if (loading) return <ActivityIndicator size="large" color="#FF9800" />;
  if (error) return <Text>Error loading game data</Text>;

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
                <Text>₱ {userMoney}.00</Text>
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
            <Text className="text-[10px] absolute mt-12 text-white font-medium">Trivia</Text>
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
            <Text className="text-[10px] text-white font-medium absolute mt-10">Shop</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center"
            onPress={() => setBagVisible(true)}
          >
            <Image 
              source={require('@/assets/images/bag.png')}
              className="w-12 h-12 mt-3"
            />
            <Text className="text-[10px] text-white font-medium absolute mt-14">Bag</Text>
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
            <Text className="text-[10px] text-white font-medium">Mission</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center" 
            onPress={() => setDecomposeVisible(true)}
        >
            <Image 
              source={require('@/assets/images/decompose.png')}
              className="w-12 h-12"
            />
            <Text className="text-[10px] text-white font-medium ">Decompose</Text>
          </TouchableOpacity>

        </View>

        {/* Modals */}
        <ShopModal
          visible={shopVisible}
          onClose={() => setShopVisible(false)}
          uid={params.uid as string}
          userMoney={userMoney}
          onPurchase={() => {/* Refresh game data handled by useGameData */}}
        />

        <Decompose
          visible={decomposeVisible}
          onClose={() => setDecomposeVisible(false)}
        />

        <BagModal
          visible={bagVisible}
          onClose={() => setBagVisible(false)}
          inventory={inventory || []} 
          onSelectItem={setSelectedItem}
          selectedItem={selectedItem}
          onSellItem={handleSellItem}
          onUseItem={handleUseItem}
          plots={plots || []}
          // onRemoveItem={handleRemoveItem}
        />

        <MissionsModal
          visible={missionsVisible}
          onClose={() => setMissionsVisible(false)}
          missions={missions}
          onMissionComplete={handleMissionComplete}
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
          inventory={inventory}
          onUpdateMoney={handleUpdateMoney}
          onUpdateStatistics={handleUpdateStatistics}
          selectedItem={selectedItem}
          userMoney={userMoney}
          onAddToInventory={handleAddToInventory}
          initialPlotsState={plotsState}
          onSavePlotsState={handleSavePlotsState}
          onUseItem={handleUseItem}
        />
      </View>
    </ImageBackground>
  );
}
export default Main;