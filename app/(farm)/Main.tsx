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
import { ref, update, increment, onValue,get } from 'firebase/database';
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
import { DecomposeModal } from '@/components/(buttons)/Decompose';
import { INITIAL_GAME_STATE } from '@/config/gameConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define PlotStatus type to match what's being used in Taniman
type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: any;
};

interface MissionProgress {
  action: string;
  details: any;
}
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
  const [rottedItems, setRottedItems] = useState<InventoryItem[]>([]);
  const [normalItems, setNormalItems] = useState<InventoryItem[]>([]);
  const [money, setMoney] = useState(1000);
  const [plotsState, setPlotsState] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_GAME_STATE.missions); 
  const [rottedCrops, setRottedCrops] = useState<InventoryItem[]>([]);
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [decomposedItems, setDecomposedItems] = useState<InventoryItem[]>([]);
  const [purchasedTools, setPurchasedTools] = useState<string[]>([]);
  const [hasVisitedShop, setHasVisitedShop] = useState(false);
  
  const [statistics, setStatistics] = useState({
    plantsGrown: 0,
    moneyEarned: 0,
    compostCreated: 0
  });

  const [missionProgress, setMissionProgress] = useState<{
    wateredCrops: number;
    plantedCrops: number;
    harvestedCrops: number;
    usedTools: { [key: string]: number };
    usedFertilizers: { [key: string]: number };
    soldCrops: number;              
    soldTrees: number;             
    organicFertilizersCreated: number;
    plantedSantan: number;
    plantedGumamela: number;
    plantedOrchids: number;
    plantedMangga: number;
  }>({
    wateredCrops: 0,
    plantedCrops: 0,
    harvestedCrops: 0,
    usedTools: {},
    usedFertilizers: {},
    soldCrops: 0,                  
    soldTrees: 0,                   
    organicFertilizersCreated: 0,
    plantedSantan: 0,
    plantedGumamela: 0,
    plantedOrchids: 0,
    plantedMangga: 0,
  });
  
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
    const loadMissions = async () => {
      try {
        const missionsRef = ref(Firebase_Database, `users/${params.uid}/missions`);
        const snapshot = await get(missionsRef);
        if (snapshot.exists()) {
          setMissions(Array.isArray(snapshot.val()) ? snapshot.val() : Object.values(snapshot.val()));
        } else {
          setMissions(INITIAL_GAME_STATE.missions);
          await update(missionsRef, INITIAL_GAME_STATE.missions);
        }
  
        const progressRef = ref(Firebase_Database, `users/${params.uid}/missionProgress`);
        const progressSnapshot = await get(progressRef);
        if (progressSnapshot.exists()) {
          const progressData = progressSnapshot.val();
          // Provide defaults for all fields if they are missing
          setMissionProgress({
            wateredCrops: progressData.wateredCrops || 0,
            plantedCrops: progressData.plantedCrops || 0,
            harvestedCrops: progressData.harvestedCrops || 0,
            usedTools: progressData.usedTools || {},
            usedFertilizers: progressData.usedFertilizers || {},
            soldCrops: progressData.soldCrops || 0,
            soldTrees: progressData.soldTrees || 0,
            organicFertilizersCreated: progressData.organicFertilizersCreated || 0,
            plantedSantan: progressData.plantedSantan || 0,
            plantedGumamela: progressData.plantedGumamela || 0,
            plantedOrchids: progressData.plantedOrchids || 0,
            plantedMangga: progressData.plantedMangga || 0,
          });
        } else {
          // Set default progress if nothing exists in Firebase
          setMissionProgress({
            wateredCrops: 0,
            plantedCrops: 0,
            harvestedCrops: 0,
            usedTools: {},
            usedFertilizers: {},
            soldCrops: 0,
            soldTrees: 0,
            organicFertilizersCreated: 0,
            plantedSantan: 0,
            plantedGumamela: 0,
            plantedOrchids: 0,
            plantedMangga: 0,
          });
        }
      } catch (error) {
        console.error("Error loading missions or progress:", error);
      }
    };
    loadMissions();
  }, [params.uid]);

  const handleMissionProgress = (action: string, details: any) => {
    setMissionProgress(prev => {
      const newProgress = { ...prev };
      newProgress.usedFertilizers = newProgress.usedFertilizers || {};
      newProgress.usedTools = newProgress.usedTools || {};
      newProgress.plantedSantan = newProgress.plantedSantan || 0;

      newProgress.plantedGumamela = newProgress.plantedGumamela || 0;
      newProgress.plantedOrchids = newProgress.plantedOrchids || 0;
      newProgress.plantedMangga = newProgress.plantedMangga || 0;
  
      // Log para i-debug ang action at details
      console.log(`Processing action: ${action}, Details:`, details);
  
      switch (action) {
        case 'waterCrop':
          newProgress.wateredCrops += 1;
          console.log('Watered crops:', newProgress.wateredCrops);
          break;
  
        case 'plantCrop':
          newProgress.plantedCrops += 1;
          console.log('Total planted crops:', newProgress.plantedCrops);

          // Track specific crop types
          if (details.cropType === 'Santan') {
            newProgress.plantedSantan += 1;
            console.log('Planted Santan:', newProgress.plantedSantan);
          } else if (details.cropType === 'Gumamela') {
            newProgress.plantedGumamela += 1;
            console.log('Planted Gumamela:', newProgress.plantedGumamela);
          } else if (details.cropType === 'Orchids') {
            newProgress.plantedOrchids += 1;
            console.log('Planted Orchids:', newProgress.plantedOrchids);
          } else if (details.cropType === 'Mangga') {
            newProgress.plantedMangga += 1;
            console.log('Planted Mangga:', newProgress.plantedMangga);
          }
          break;
  
        case 'harvestCrop':
          newProgress.harvestedCrops += 1;
          console.log('Harvested crops:', newProgress.harvestedCrops);
          break;
  
        case 'useTool':
          newProgress.usedTools[details.tool] = (newProgress.usedTools[details.tool] || 0) + 1;
          console.log(`Used tool ${details.tool}:`, newProgress.usedTools[details.tool]);
          break;
  
        case 'useFertilizer':
          newProgress.usedFertilizers[details.type] = (newProgress.usedFertilizers[details.type] || 0) + 1;
          console.log(`Used fertilizer ${details.type}:`, newProgress.usedFertilizers[details.type]);
          break;
  
        case 'sellCrop':
          newProgress.soldCrops = (newProgress.soldCrops || 0) + 1;
          console.log('Sold crops:', newProgress.soldCrops);
          break;
  
        case 'sellTree':
          newProgress.soldTrees = (newProgress.soldTrees || 0) + 1;
          console.log('Sold trees:', newProgress.soldTrees);
          break;
  
        case 'createOrganicFertilizer':
          newProgress.organicFertilizersCreated = (newProgress.organicFertilizersCreated || 0) + 1;
          console.log('Organic fertilizers created:', newProgress.organicFertilizersCreated);
          break;
      }
      
      // Check mission completion
      const updatedMissions = missions.map(mission => {
        if (mission.completed) return mission;
  
        let isComplete = false;
  
        // Generic watering missions
        if (mission.title.includes('Mag Dilig ng') && mission.title.match(/(\d+)/)) {
          const required = parseInt(mission.title.match(/(\d+)/)![1], 10);
          isComplete = newProgress.wateredCrops >= required;
        } 
        // Generic planting mission
        else if (mission.title === 'Mag tanim ng Crops') {
          isComplete = newProgress.plantedCrops >= 1;
        }
        // Mangga-specific planting mission
        else if (mission.title === 'Mag tanim ng Mangga') {
          isComplete = details?.cropType === 'Mangga' && newProgress.plantedCrops >= 1;
        }
        // Tool usage missions
        else if (mission.title === 'Gumamit ng Asarol') {
          isComplete = (newProgress.usedTools['Asarol'] || 0) >= 1;
        } 
        // Fertilizer usage missions
        else if (mission.title === 'Gumamit ng Synthetic Fertilizer') {
          isComplete = (newProgress.usedFertilizers['Synthetic Fertilizer'] || 0) >= 1;
        } 
        else if (mission.title === 'Gumamit ng Organic Fertilizer') {
          isComplete = (newProgress.usedFertilizers['Organic Fertilizer'] || 0) >= 1;
        } 
        // Chemical Pesticide
        else if (mission.title === 'Gumamit ng Chemical Pesticide') {
          isComplete = (newProgress.usedTools['Chemical Pesticide'] || 0) >= 1;
        }
        // Gumamit ng Itak
        else if (mission.title === 'Gumamit ng Itak') {
          isComplete = (newProgress.usedTools['Itak'] || 0) >= 1;
        }
        // Mag Tanim ng Santan
        else if (mission.title === 'Mag tanim ng Santan') {
          isComplete = newProgress.plantedSantan >= 1;
        }
        // Mag Tanim ng Gummamela
        else if (mission.title === 'Mag tanim ng Gumamela') {
          isComplete = newProgress.plantedGumamela >= 1;
        }
        // Mag Tanim ng Orchids
        else if (mission.title === 'Mag tanim ng Orchids') {
          isComplete = newProgress.plantedOrchids >= 1;
        }
        // Selling missions
        else if (mission.title === 'Mag Benta ng Crops') {
          isComplete = (newProgress.soldCrops || 0) >= 1;
        } 
        else if (mission.title === 'Mag Benta ng Prutas') {
          isComplete = (newProgress.soldTrees || 0) >= 1;
        } 
        // Organic fertilizer creation mission
        else if (mission.title === 'Gumawa ng Organic Fertilizer') {
          isComplete = (newProgress.organicFertilizersCreated || 0) >= 1;
        }
        if (isComplete) {
          console.log(`Mission completed: ${mission.title}`);
        }
  
        return isComplete ? { ...mission, completed: true } : mission;
      });
  
      // Update state and Firebase
      setMissions(updatedMissions);
      if (params.uid) {
        update(ref(Firebase_Database, `users/${params.uid}`), {
          missions: updatedMissions,
          missionProgress: newProgress,
        }).then(() => {
          console.log('Mission progress saved to Firebase:', newProgress);
        }).catch(error => {
          console.error('Error saving mission progress:', error);
        });
      }
  
      return newProgress;
    });
  };

  useEffect(() => {
    const loadDecomposedItems = async () => {
      try {
        const savedDecomposedItems = await AsyncStorage.getItem('decomposedItems');
        if (savedDecomposedItems) {
          setDecomposedItems(JSON.parse(savedDecomposedItems));
          console.log('Loaded decomposed items from storage');
        }
      } catch (error) {
        console.error('Failed to load decomposed items:', error);
      }
    };
    
    loadDecomposedItems();
  }, []);

  const verifyInventoryInDatabase = async () => {
    if (!params.uid) return;
    
    try {
      const snapshot = await get(ref(Firebase_Database, `users/${params.uid}/inventory`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Current inventory in database:', {
          type: typeof data,
          isArray: Array.isArray(data),
          length: Object.keys(data).length,
          items: Object.values(data).map(item => `${item.id}: ${item.title}`)
        });
      } else {
        console.log('No inventory found in database');
      }
    } catch (error) {
      console.error('Error verifying inventory:', error);
    }
  };

  const saveDecomposedItems = async (items: InventoryItem[]) => {
    try {
      await AsyncStorage.setItem('decomposedItems', JSON.stringify(items));
      console.log('Saved decomposed items to storage');
    } catch (error) {
      console.error('Failed to save decomposed items:', error);
    }
  };

  const onAddToDecompose = (item: InventoryItem) => {
    setRottedItems(prevItems => [...prevItems, item]);
  };

  const onAddToNormalInventory = (item: InventoryItem) => {
    setNormalItems(prevItems => [...prevItems, item]);
  };

  const handleAddToDecompose = (item: InventoryItem) => {
    setRottedItems(prev => [...prev, item]);
    const updatedDecomposedItems = [...decomposedItems, item];
    setDecomposedItems(updatedDecomposedItems);
    saveDecomposedItems(updatedDecomposedItems);
  };
  const handleRemoveRottedItem = (itemId: string) => {
    setRottedItems(prev => prev.filter(item => item.id !== itemId));
  };
  const handleLoadRottedItems = (items: InventoryItem[]) => {
    setRottedItems(items);
  };

  useEffect(() => {
    if (!params.uid) return;
    const userRef = ref(Firebase_Database, `users/${params.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        if (data.inventory) {
          let inventoryArray = Array.isArray(data.inventory) 
            ? data.inventory 
            : Object.values(data.inventory);
          
          inventoryArray = inventoryArray.filter(item => item !== null);
        
          setInventory(inventoryArray);
        } else {
          setInventory([]);
        }
        
        setUserMoney(data.money || 0);
        setPlots(data.plotsState || plots);
      }
    });
    
    return () => unsubscribe();
  }, [params.uid]);

  useEffect(() => {
    if (!params.uid) return;
    
    const userRef = ref(Firebase_Database, `users/${params.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        // Ensure inventory is always an array
        const fetchedInventory = Array.isArray(userData.inventory) 
          ? userData.inventory 
          : [];
        
        setInventory(fetchedInventory);
        setUserMoney(userData.money || 0);
        // Use initial state as fallback instead of current state
      const initialPlotState = Array(3).fill(null).map(() => 
        Array(3).fill(null).map(() => ({
          isPlowed: false,
          isWatered: false,
          plant: undefined
        }))
      );
        setPlotsState(userData.plotsState || plots);
        setPlots(userData.plotsState || plots);
      }
    });
    
    return () => unsubscribe();
  }, [params.uid]);

  useEffect(() => {
    if (!params.uid) return;

    const loadUserData = async () => {
      try {
        const userRef = ref(Firebase_Database, `users/${params.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPurchasedTools(data.purchasedTools || []);
          setMissions(Array.isArray(data.missions) ? data.missions : INITIAL_GAME_STATE.missions);
          setMissionProgress(data.missionProgress || {
            wateredCrops: 0,
            plantedCrops: 0,
            harvestedCrops: 0,
            usedTools: {},
            usedFertilizers: {},
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, [params.uid]);

  useEffect(() => {
    if (selectedItem && !inventory.find(item => item.id === selectedItem.id)) {
      // The selected item has been removed from inventory
      setSelectedItem(null);
    }
  }, [inventory, selectedItem]);

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

  const handleAddToInventory = async (item: InventoryItem) => {
    if (!params.uid) {
      Alert.alert("Error", "User ID is missing");
      return;
    }
    try {
      const currentInventory = Array.isArray(inventory) ? [...inventory] : [];      
      const existingItemIndex = currentInventory.findIndex(i => i.id === item.id);
      
      if (existingItemIndex >= 0) {
        currentInventory[existingItemIndex] = item;
      } else {
        currentInventory.push(item);
      }  
      setInventory(currentInventory);  
      const userRef = ref(Firebase_Database, `users/${params.uid}`);
      await update(userRef, {
        inventory: currentInventory
      });  
    } catch (error) {
      console.error('Error adding item to inventory:', error);
      Alert.alert("Error", "Failed to add item to inventory");
    }
  };

  const handleUseItem = (usedItem: InventoryItem) => {
    console.log('Using Item: ', usedItem.title);
    const nonConsumableTools = ['Itak', 'Regadera', 'Asarol'];    
    if (!nonConsumableTools.includes(usedItem.title)) {
      const updatedInventory = [...inventory];
      const itemIndex = updatedInventory.findIndex(item => item.id === usedItem.id);
      if (itemIndex !== -1) {
        if (updatedInventory[itemIndex].quantity && updatedInventory[itemIndex].quantity > 1) {
          updatedInventory[itemIndex].quantity -= 1;
        } else {
          updatedInventory.splice(itemIndex, 1);
        }
        setInventory(updatedInventory);
        if (params.uid) {
          update(ref(Firebase_Database, `users/${params.uid}`), {
            inventory: updatedInventory
          });
        }
      }
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
      if (item.type === 'crop') {
        handleMissionProgress('sellCrop', { item });
      } else if (item.type === 'tree') {
        handleMissionProgress('sellTree', { item });
      }
      Alert.alert("Success", `Sold ${item.title} for ${moneyEarned} coins!`);
    } catch (error) {
      console.error('Error selling item:', error);
      Alert.alert("Error", "Failed to sell item");
    }
  };

  const handleSavePlotsState = async () => {
    if (!params.uid) {
      console.log("Cannot save plots state: User ID is missing");
      return;
    }
    
    try {
      // console.log("Saving plots state to Firebase...");
      
      // Create a deep copy of the plots array to avoid reference issues
      const plotsToSave = JSON.parse(JSON.stringify(plots));
      
      // Process each plot to ensure there are no undefined values
      // Firebase doesn't handle undefined values well
      const sanitizedPlotsState = plotsToSave.map(row => 
        row.map(plot => ({
          isPlowed: plot.isPlowed || false,
          isWatered: plot.isWatered || false,
          isFlooded: plot.isFlooded || false,
          // Only include plant data if it exists
          ...(plot.plant ? {
            plant: {
              id: plot.plant.id,
              stage: plot.plant.stage || 0,
              type: plot.plant.type || "",
              plantedAt: plot.plant.plantedAt ? plot.plant.plantedAt.toISOString() : new Date().toISOString(),
              readyAt: plot.plant.readyAt ? plot.plant.readyAt.toISOString() : new Date().toISOString(),
              cropType: plot.plant.cropType || "",
              image: plot.plant.image,
              hasInfestation: plot.plant.hasInfestation || false,
              isRotted: plot.plant.isRotted || false,
              isFertilized: plot.plant.isFertilized || false,
              needsWater: plot.plant.needsWater || false
            }
          } : {})
        }))
      );
    
      // Save to Firebase
      await update(ref(Firebase_Database, `users/${params.uid}`), {
        plotsState: sanitizedPlotsState,
      });
    
      // console.log("Plots state saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving plots state:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // First ensure the latest plots state is saved to Firebase
      await handleSavePlotsState();
      console.log("Plots state saved before logout");
      
      // Then sign out
      await signOut(Firebase_Auth);
      console.log("User signed out successfully");
      
      // Navigate to the login screen
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Logout Error", "There was a problem logging out. Please try again.");
    }
  };

  const loadPlotsState = () => {
    if (!gameData || !gameData.plotsState) return;
    
    try {
      console.log("Loading plots state from Firebase...");
      
      // Process the loaded plots state to convert date strings back to Date objects
      const loadedPlotsState = gameData.plotsState.map(row => 
        row.map(plot => ({
          isPlowed: plot.isPlowed || false,
          isWatered: plot.isWatered || false,
          isFlooded: plot.isFlooded || false,
          // Only process plant if it exists
          ...(plot.plant ? {
            plant: {
              ...plot.plant,
              // Convert string dates back to Date objects
              plantedAt: plot.plant.plantedAt ? new Date(plot.plant.plantedAt) : new Date(),
              readyAt: plot.plant.readyAt ? new Date(plot.plant.readyAt) : new Date()
            }
          } : {})
        }))
      );
      
      console.log("Plots state loaded successfully!");
      setPlots(loadedPlotsState);
      setPlotsState(loadedPlotsState);
    } catch (error) {
      console.error("Error processing loaded plots state:", error);
      // Fall back to default plots if there's an error
      const defaultPlots = Array(3).fill(null).map(() => 
        Array(3).fill(null).map(() => ({
          isPlowed: false,
          isWatered: false,
          plant: undefined
        }))
      );
      setPlots(defaultPlots);
      setPlotsState(defaultPlots);
    }
  };
  
  useEffect(() => {
    if (gameData) {
      loadPlotsState();
    }
  }, [gameData]);
  
  useEffect(() => {
    const saveInterval = setInterval(() => {
      handleSavePlotsState();
    }, 60000); // Save every minute
    
    return () => clearInterval(saveInterval);
  }, [plots]);
  
  useEffect(() => {
    return () => {
      handleSavePlotsState();
    };
  }, []);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockOrientation();
    
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

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

  const handleMissionComplete = async (missionId: number, answer: string) => {
    if (!params.uid) return;
    try {
      const mission = missions.find(m => m.id === missionId);
      if (mission && mission.completed) {
        await handleUpdateMoney(mission.reward);
        await handleUpdateStatistics({ moneyEarned: mission.reward });
        console.log(`Mission ${missionId} rewarded. Reward: ₱${mission.reward}.00`);
      }
    } catch (error) {
      console.error("Error in handleMissionComplete:", error);
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

  const onUseItem = (usedItem: InventoryItem) => {
    console.log('Using Item: ', usedItem);

  // Remove the item from inventory
  const updatedInventory = inventory.filter(item => item.id !== usedItem.id);

  // Update local state
  setInventory(updatedInventory);

  // Update Firebase
  if (params.uid) {
    const userRef = ref(Firebase_Database, `users/${params.uid}`);
    update(userRef, {
      inventory: updatedInventory
    });
  }
};

  useEffect(() => {
    if (params.uid) {
      // Refresh inventory data from Firebase
      const userRef = ref(Firebase_Database, `users/${params.uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.inventory) {
            // Convert to array if needed
            const inventoryArray = Array.isArray(data.inventory) 
              ? data.inventory 
              : Object.values(data.inventory);
            
            // Filter out null values
            const filteredInventory = inventoryArray.filter(item => item !== null);
            
            setInventory(filteredInventory);
            console.log('Inventory refreshed from Firebase:', filteredInventory.length);
          }
        }
      }).catch((error) => {
        console.error('Error refreshing inventory:', error);
      });
    }
  }, [selectedItem]);

  const handleSelectItem = (item: InventoryItem | null) => {
    console.log("Selected item in parent:", item);
    setSelectedItem(item);
};

  const handleUpdatePurchasedTools = async (newPurchasedTools: string[]) => {
    setPurchasedTools(newPurchasedTools);
    if (params.uid) {
      await update(ref(Firebase_Database, `users/${params.uid}`), {
        purchasedTools: newPurchasedTools,
      });
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
          purchasedTools={purchasedTools}
          onUpdatePurchasedTools={handleUpdatePurchasedTools}
        />

        <DecomposeModal
          visible={decomposeVisible}
          onClose={() => setDecomposeVisible(false)}
          rottedItems={rottedItems}
          normalItems={normalItems}
          inventory={inventory || []}
          onRemoveItem={handleRemoveRottedItem}
          onUpdateMoney={handleUpdateMoney}
          onAddToInventory={handleAddToInventory}
          decomposedItems={decomposedItems}
          onLoadRottedItems={handleLoadRottedItems}
          onLoadNormalItems={setNormalItems}
          onLoadInventory={(items) => setInventory(items)}
          verifyInventory={verifyInventoryInDatabase}
          onMissionProgress={handleMissionProgress}
        />

        <BagModal
          visible={bagVisible}
          onClose={() => setBagVisible(false)}
          inventory={inventory || []} 
          onSelectItem={handleSelectItem}
          selectedItem={selectedItem}
          onSellItem={handleSellItem}
          onAddToInventory={handleAddToInventory}
          onUseItem={onUseItem}
          plots={plots}
          onRemoveItem={handleRemoveItem}
        />

        <MissionsModal
          visible={missionsVisible}
          onClose={() => setMissionsVisible(false)}
          missions={missions}
          onMissionComplete={handleMissionComplete}
          userId={params.uid as string}
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
          inventory={inventory || []}
          onUpdateMoney={handleUpdateMoney}
          onUpdateStatistics={handleUpdateStatistics}
          selectedItem={selectedItem}
          userMoney={userMoney}
          onAddToInventory={handleAddToInventory}
          initialPlotsState={plotsState}
          onSavePlotsState={handleSavePlotsState}
          onUseItem={handleUseItem}
          decomposedItems={decomposedItems}
          onAddToDecompose={handleAddToDecompose}
          onAddToNormalInventory={onAddToNormalInventory}
          onMissionProgress={handleMissionProgress}
          // hasVisitedShop={hasVisitedShop} 
          // onShopModalOpened={() => setHasVisitedShop(true)}
        />
      </View>
    </ImageBackground>
  );
}
export default Main;