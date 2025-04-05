import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Firebase_Database, Firebase_Auth } from '@/firebaseConfig';
import { ref, set, get, serverTimestamp } from 'firebase/database';

type PlantData = {
  id: string;
  stage: number;
  type: string;
  plantedAt: Date;
  readyAt: Date;
  cropType: string;
  image: number;
  hasInfestation: boolean;
  isRotted?: boolean;
  isFertilized: boolean;
  needsWater?: boolean;
};

type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  isFlooded?: boolean;
  plant?: PlantData;
};

type TimerMap = {
  [plotId: string]: NodeJS.Timeout;
};

const GROWTH_TIMES = {
  Sibuyas: 100000,
  Mangga: 200000,
  Carrot: 100000,
  Gumamela: 200000,
  Santan: 200000,
  Kamatis: 100000,
  Orchids: 200000,
  Saging: 100000,
  Papaya: 100000,
} as const;

const HARVEST_VALUES = {
  Sibuyas: { normal: 50, rotten: 0 },
  Mangga: { normal: 150, rotten: 0 },
  Carrot: { normal: 100, rotten: 0 },
  Gumamela: { normal: 250, rotten: 0 },
  Santan: { normal: 150, rotten: 0 },
  Kamatis: { normal: 100, rotten: 0 },
  Orchids: { normal: 150, rotten: 0 },
  Saging: { normal: 100, rotten: 0 },
  Papaya: { normal: 100, rotten: 0 },
} as const;

const INFESTATION_CHANCE = 0.01;
const INFESTATION_CHECK_INTERVAL = 10000;
const DECAY_TIME = 300000;
const FERTILIZER_GROWTH_MULTIPLIER = 0.5;
const DROUGHT_CHANCE = 0.01;
const DROUGHT_CHECK_INTERVAL = 10000;
const DROUGHT_DECAY_TIME = 30000;
const FLOOD_CHANCE = 0.01;
const FLOOD_CHECK_INTERVAL = 30000;

// Tutorial Overlay Component
const TutorialOverlay = ({ message, onNext, onClose, highlight }) => (
  <View className="absolute top-[-110px] left-[-100px] w-[450px] p-[5px]">
    <View className="bg-white p-3 rounded-lg" pointerEvents="auto">
      <Text className="text-[12px] font-normal mb-2">{message}</Text>
      {highlight === "ShopModal" && (
        <View className="flex-row items-center mb-2">
          <Text className="text-[10px] text-yellow-700">
            Look at the top-right corner for the Shop button! ➡️
          </Text>
          <Image
            source={require('@/assets/images/shop.png')}
            className="w-[24px] h-[24px] ml-2"
            resizeMode="contain"
          />
        </View>
      )}
      {highlight === "Regadera" && (
        <View className="flex-row items-center mb-2">
          <Text className="text-[10px] text-yellow-700">
            Find the Regadera in your Bag! ➡️
          </Text>
          <Image
            source={require('@/assets/images/regadera.png')}
            className="w-[24px] h-[24px] ml-2"
            resizeMode="contain"
          />
        </View>
      )}
      {highlight === "Sibuyas" && (
        <View className="flex-row items-center mb-2">
          <Text className="text-[10px] text-yellow-700">
            Pick the Sibuyas seed or any crops from your Bag! ➡️
          </Text>
          <Image
            source={require('@/assets/images/sibuyas.png')}
            className="w-[24px] h-[24px] ml-2"
            resizeMode="contain"
          />
        </View>
      )}
      {highlight === "Synthetic Fertilizer" && (
        <View className="flex-row items-center mb-2">
          <Text className="text-[10px] text-yellow-700">
            Grab the Synthetic Fertilizer from your Bag! ➡️
          </Text>
          <Image
            source={require('@/assets/images/fertilizer.png')}
            className="w-[24px] h-[24px] ml-2"
            resizeMode="contain"
          />
        </View>
      )}
      <View className="flex-row justify-end">
        <TouchableOpacity onPress={onNext} className="bg-green-500 p-[5px] rounded-lg">
          <Text className="text-white text-[12px]">Next</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} className="ml-2 bg-gray-500 p-[5px] rounded-lg">
          <Text className="text-white text-[12px]">Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

interface TanimanProps {
  inventory: InventoryItem[];
  onUpdateMoney: (amount: number) => void;
  onUpdateStatistics: (stats: { plantsGrown?: number; moneyEarned?: number }) => void;
  selectedItem: InventoryItem | null;
  userMoney: number;
  onAddToInventory: (item: InventoryItem) => void;
  initialPlotsState?: PlotStatus[][];
  onSavePlotsState: (plotsData: PlotStatus[][]) => void;
  onUseItem: (item: InventoryItem) => void;
  onAddToDecompose: (item: InventoryItem) => void;
  decomposedItems: InventoryItem[];
  onAddToNormalInventory: (item: InventoryItem) => void;
  onMissionProgress?: (action: string, details: any) => void;
  onShopModalOpened?: () => void;
  hasVisitedShop?: boolean;
}

export const Taniman: React.FC<TanimanProps> = ({
  inventory,
  onUpdateMoney,
  onUpdateStatistics,
  selectedItem,
  userMoney,
  onAddToInventory,
  initialPlotsState,
  onSavePlotsState,
  onUseItem,
  onAddToDecompose,
  onAddToNormalInventory,
  decomposedItems,
  onMissionProgress,
  onShopModalOpened,
  hasVisitedShop = false,
}) => {
  const GRID_SIZE = 3;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [refresh, setRefresh] = useState(false);
  const soundTimeoutRef = useRef<NodeJS.Timeout>();
  const infestationTimersRef = useRef<TimerMap>({});
  const decayTimersRef = useRef<TimerMap>({});
  const droughtTimersRef = useRef<TimerMap>({});
  const droughtDecayTimersRef = useRef<TimerMap>({});
  const floodTimersRef = useRef<TimerMap>({});
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  // Tutorial states
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(false); // Start as false, set based on isNewUser

  const tutorialSteps = [
    { message: "Welcome to Taniman! Let's learn how to grow crops.", highlight: null },
    { message: "First, visit the Shop (top-right) to buy tools and crops.", highlight: "ShopModal" },
    { message: "Select the 'Asarol' tool in the Bag to plow the soil.", highlight: "Asarol" },
    { message: "Now, tap on an empty plot to plow it.", highlight: "plot" },
    { message: "Select the 'Regadera' tool in the Bag to water the plot.", highlight: "Regadera" },
    { message: "Now, tap on a plowed plot to water it.", highlight: "plot" },
    { message: "Next, select a crop seed from your Bag.", highlight: "Sibuyas" },
    { message: "Tap the watered plot to plant the seed.", highlight: "plot" },
    { message: "Wait for the crop to grow. Click 'Next' to advance to the next step.", highlight: "plot" },
    { message: "To speed up growth, select 'Synthetic Fertilizer' in the Bag.", highlight: "Synthetic Fertilizer" },
    { message: "Tap the planted plot to apply the fertilizer.", highlight: "plot" },
    { message: "Once the crop is fully grown, select the 'Itak' tool to harvest it.", highlight: "Itak" },
    { message: "Tap the fully grown crop to harvest it.", highlight: "plot" },
    { message: "Congratulations! You've completed the tutorial. Happy farming!", highlight: null },
  ];

  const [tutorialRequirements, setTutorialRequirements] = useState({
    asarolSelected: false,
    plotPlowed: false,
    regaderaSelected: false,
    shopVisited: false,
  });

  const advanceTutorial = () => {
    setTutorialStep((prevStep) => {
      console.log(`Advancing from step ${prevStep} to ${prevStep + 1}`);
      if (prevStep + 1 >= tutorialSteps.length) {
        setIsTutorialActive(false);
        markTutorialCompleted();
        return prevStep;
      }
      return prevStep + 1;
    });
  };

  const markTutorialCompleted = async () => {
    try {
      const userId = Firebase_Auth.currentUser?.uid;
      if (userId) {
        const tutorialRef = ref(Firebase_Database, `users/${userId}/tutorialCompleted`);
        await set(tutorialRef, true);
      }
      await AsyncStorage.setItem('tutorialCompleted', 'true');
    } catch (error) {
      console.error('Error marking tutorial completed:', error);
    }
  };

  useEffect(() => {
    if (!isTutorialActive) return;

    switch (tutorialStep) {
      case 1: // ShopModal step
        if (hasVisitedShop) advanceTutorial();
        break;
      case 2: // Asarol selection
        if (selectedItem?.title === 'Asarol') advanceTutorial();
        break;
      case 4: // Regadera selection
        if (selectedItem?.title === 'Regadera') advanceTutorial();
        break;
      case 6: // Seed selection
        if (selectedItem?.type === 'crop' || selectedItem?.type === 'tree') advanceTutorial();
        break;
      case 9: // Fertilizer selection
        if (selectedItem?.title === 'Synthetic Fertilizer') advanceTutorial();
        break;
      case 11: // Itak selection
        if (selectedItem?.title === 'Itak') advanceTutorial();
        break;
    }
  }, [selectedItem, tutorialStep, isTutorialActive, hasVisitedShop]);

  // Check new user status and control tutorial visibility
  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const userId = Firebase_Auth.currentUser?.uid;
        let isNew = true;

        if (userId) {
          const tutorialRef = ref(Firebase_Database, `users/${userId}/tutorialCompleted`);
          const snapshot = await get(tutorialRef);
          isNew = !snapshot.exists() || !snapshot.val();
        } else {
          const tutorialCompleted = await AsyncStorage.getItem('tutorialCompleted');
          isNew = !tutorialCompleted;
        }

        setIsNewUser(isNew);
        setIsTutorialActive(isNew); // Set tutorial active only for new users
      } catch (error) {
        console.error('Error checking new user status:', error);
        setIsNewUser(true);
        setIsTutorialActive(true); // Default to true if there's an error
      }
    };

    checkNewUser();
  }, []);

  const triggerRefresh = () => setRefresh((prev) => !prev);

  const [plots, setPlots] = useState<PlotStatus[][]>(
    initialPlotsState || Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isPlowed: false,
        isWatered: false,
      }))
    )
  );

  useEffect(() => {
    onSavePlotsState(plots);
  }, [plots]);

  const [timers, setTimers] = useState<{
    growth: { [plotId: string]: number };
    decay: { [plotId: string]: number };
    drought: { [plotId: string]: number };
  }>({
    growth: {},
    decay: {},
    drought: {},
  });

  const formatTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimers = { growth: {}, decay: {}, drought: {} };

      plots.forEach((row, rowIndex) => {
        row.forEach((plot, colIndex) => {
          const plotId = `${rowIndex}-${colIndex}`;
          if (plot.plant) {
            if (plot.plant.stage < 3) {
              const timeRemaining = Math.max(
                0,
                Math.floor((plot.plant.readyAt.getTime() - now) / 1000)
              );
              newTimers.growth[plotId] = timeRemaining;
            }
            if (plot.plant.hasInfestation && !plot.plant.isRotted) {
              const infestationStartTime = plot.plant.readyAt.getTime();
              const decayTimeRemaining = Math.max(
                0,
                Math.floor((infestationStartTime + DECAY_TIME - now) / 1000)
              );
              newTimers.decay[plotId] = decayTimeRemaining;
              if (decayTimeRemaining === 0 && plot.plant.hasInfestation) {
                handlePlantDecay(rowIndex, colIndex);
              }
            }
            if (plot.plant.needsWater && !plot.plant.isRotted) {
              const droughtStartTime = plot.plant.readyAt.getTime();
              const droughtTimeRemaining = Math.max(
                0,
                Math.floor((droughtStartTime + DROUGHT_DECAY_TIME - now) / 1000)
              );
              newTimers.drought[plotId] = droughtTimeRemaining;
              if (droughtTimeRemaining === 0 && plot.plant.needsWater) {
                handleDroughtDamage(rowIndex, colIndex);
              }
            }
          }
        });
      });

      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [plots]);

  useEffect(() => {
    clearAllTimers();
    plots.forEach((row, rowIndex) => {
      row.forEach((plot, colIndex) => {
        if (plot.plant && plot.plant.stage === 3 && !plot.plant.isRotted) {
          startInfestationCheck(rowIndex, colIndex);
          startDroughtCheck(rowIndex, colIndex);
        }
        startFloodCheck(rowIndex, colIndex);
      });
    });

    return () => {
      clearAllTimers();
      if (sound) sound.unloadAsync();
      if (soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current);
    };
  }, []);

  const clearAllTimers = () => {
    Object.values(infestationTimersRef.current).forEach((timer) => clearInterval(timer));
    infestationTimersRef.current = {};
    Object.values(decayTimersRef.current).forEach((timer) => clearTimeout(timer));
    decayTimersRef.current = {};
    Object.values(droughtTimersRef.current).forEach((timer) => clearInterval(timer));
    droughtTimersRef.current = {};
    Object.values(droughtDecayTimersRef.current).forEach((timer) => clearTimeout(timer));
    droughtDecayTimersRef.current = {};
    Object.values(floodTimersRef.current).forEach((timer) => clearInterval(timer));
    floodTimersRef.current = {};
  };

  const clearPlotTimers = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (infestationTimersRef.current[plotId]) {
      clearInterval(infestationTimersRef.current[plotId]);
      delete infestationTimersRef.current[plotId];
    }
    if (decayTimersRef.current[plotId]) {
      clearTimeout(decayTimersRef.current[plotId]);
      delete decayTimersRef.current[plotId];
    }
    if (droughtTimersRef.current[plotId]) {
      clearInterval(droughtTimersRef.current[plotId]);
      delete droughtTimersRef.current[plotId];
    }
    if (droughtDecayTimersRef.current[plotId]) {
      clearTimeout(droughtDecayTimersRef.current[plotId]);
      delete droughtDecayTimersRef.current[plotId];
    }
    if (floodTimersRef.current[plotId]) {
      clearInterval(floodTimersRef.current[plotId]);
      delete floodTimersRef.current[plotId];
    }
  };

  const playTimedSound = async (soundFile: number) => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: false });
      setSound(newSound);
      await newSound.playAsync();
      soundTimeoutRef.current = setTimeout(async () => {
        if (newSound) {
          const currentStatus = await newSound.getStatusAsync();
          if (currentStatus.isLoaded) {
            await newSound.stopAsync();
            await newSound.unloadAsync();
          }
          setSound(null);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  const startInfestationCheck = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (infestationTimersRef.current[plotId]) clearInterval(infestationTimersRef.current[plotId]);
    const timer = setInterval(() => {
      setPlots((current) => {
        const plot = current[row][col];
        if (!plot.plant || plot.plant.stage !== 3 || plot.plant.isRotted) return current;
        if (Math.random() < INFESTATION_CHANCE) {
          console.log(`Infestation triggered for plant at [${row},${col}]`);
          const newPlots = [...current];
          newPlots[row] = [...newPlots[row]];
          newPlots[row][col] = {
            ...newPlots[row][col],
            plant: { ...newPlots[row][col].plant!, hasInfestation: true },
          };
          startDecayTimer(row, col);
          return newPlots;
        }
        return current;
      });
    }, INFESTATION_CHECK_INTERVAL);
    infestationTimersRef.current[plotId] = timer;
    console.log(`Started infestation check for plant at [${row},${col}]`);
    return timer;
  };

  const startDroughtCheck = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (droughtTimersRef.current[plotId]) clearInterval(droughtTimersRef.current[plotId]);
    const timer = setInterval(() => {
      setPlots((current) => {
        const plot = current[row][col];
        if (!plot.plant || plot.plant.stage !== 3 || plot.plant.isRotted || plot.plant.needsWater) return current;
        if (Math.random() < DROUGHT_CHANCE) {
          console.log(`Drought triggered for plant at [${row},${col}]`);
          const newPlots = [...current];
          newPlots[row] = [...newPlots[row]];
          newPlots[row][col] = {
            ...newPlots[row][col],
            isWatered: false,
            plant: { ...newPlots[row][col].plant!, needsWater: true },
          };
          startDroughtDecayTimer(row, col);
          Alert.alert('Drought!', `Your ${plot.plant.cropType} needs water! Use Regadera to prevent withering.`);
          return newPlots;
        }
        return current;
      });
    }, DROUGHT_CHECK_INTERVAL);
    droughtTimersRef.current[plotId] = timer;
    console.log(`Started drought check for plant at [${row},${col}]`);
    return timer;
  };

  const startFloodCheck = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (floodTimersRef.current[plotId]) clearInterval(floodTimersRef.current[plotId]);
    const timer = setInterval(() => {
      setPlots((current) => {
        const plot = current[row][col];
        if (plot.isFlooded) return current;
        if (Math.random() < FLOOD_CHANCE) handleFlood(row, col);
        return current;
      });
    }, FLOOD_CHECK_INTERVAL);
    floodTimersRef.current[plotId] = timer;
    return timer;
  };

  const startDecayTimer = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (decayTimersRef.current[plotId]) clearTimeout(decayTimersRef.current[plotId]);
    const timer = setTimeout(() => {
      setPlots((current) => {
        const plot = current[row][col];
        if (!plot.plant || !plot.plant.hasInfestation || plot.plant.isRotted) return current;
        console.log(`Decay timer triggered for infested plant at [${row},${col}]`);
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          ...newPlots[row][col],
          plant: { ...newPlots[row][col].plant!, isRotted: true, hasInfestation: false },
        };
        Alert.alert('Plant Rotten!', `Your ${plot.plant.cropType} has rotten due to untreated infestation.`);
        return newPlots;
      });
    }, DECAY_TIME);
    decayTimersRef.current[plotId] = timer;
    console.log(`Started decay timer for infested plant at [${row},${col}]`);
    return timer;
  };

  const startDroughtDecayTimer = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    if (droughtDecayTimersRef.current[plotId]) clearTimeout(droughtDecayTimersRef.current[plotId]);
    const timer = setTimeout(() => {
      setPlots((current) => {
        const plot = current[row][col];
        if (!plot.plant || !plot.plant.needsWater || plot.plant.isRotted) return current;
        console.log(`Drought decay timer triggered for plant at [${row},${col}]`);
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          ...newPlots[row][col],
          plant: { ...newPlots[row][col].plant!, isRotted: true, needsWater: false },
        };
        Alert.alert('Plant Withered!', `Your ${plot.plant.cropType} has withered due to drought.`);
        return newPlots;
      });
    }, DROUGHT_DECAY_TIME);
    droughtDecayTimersRef.current[plotId] = timer;
    console.log(`Started drought decay timer for plant at [${row},${col}]`);
    return timer;
  };

  useEffect(() => {
    const growthTimer = setInterval(() => {
      setPlots((currentPlots) => {
        let updated = false;
        const newPlots = currentPlots.map((row, rowIndex) =>
          row.map((plot, colIndex) => {
            if (plot.plant) {
              const now = new Date();
              if (now >= plot.plant.readyAt && plot.plant.stage < 3) {
                updated = true;
                const newStage = plot.plant.stage + 1;
                if (newStage === 3) {
                  startInfestationCheck(rowIndex, colIndex);
                  startDroughtCheck(rowIndex, colIndex);
                }
                return {
                  ...plot,
                  plant: { ...plot.plant, stage: newStage },
                };
              }
            }
            return plot;
          })
        );
        return updated ? newPlots : currentPlots;
      });
    }, 1000);

    return () => clearInterval(growthTimer);
  }, []);

  const handleHarvest = async (row: number, col: number, plot: PlotStatus, onComplete?: () => void) => {
    if (plot.plant?.hasInfestation && !plot.plant.isRotted) {
      Alert.alert('Cannot Harvest', 'This plant has an infestation. Treat it with pesticide first.');
      return;
    }

    if (plot.plant?.stage === 3) {
      const cropType = plot.plant.cropType as keyof typeof HARVEST_VALUES;
      let harvestValue = plot.plant.isRotted
        ? HARVEST_VALUES[cropType].rotten
        : HARVEST_VALUES[cropType].normal;
      if (plot.plant.isFertilized) harvestValue *= 2;

      const uniqueTimestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 11);
      const uniqueCounter = (global.harvestCounter = (global.harvestCounter || 0) + 1);
      const uniqueId = plot.plant.isRotted
        ? `rotten-${cropType}-${uniqueTimestamp}-${uniqueCounter}-${randomPart}`
        : `normal-${cropType}-${uniqueTimestamp}-${uniqueCounter}-${randomPart}`;

      const harvestedCrop: InventoryItem = {
        id: uniqueId,
        title: `${plot.plant.isRotted ? 'Rotten ' : ''}${cropType}`,
        type: 'harvestedCrop',
        description: plot.plant.isRotted
          ? `A rotten ${cropType} with reduced value.`
          : `A freshly harvested ${cropType} ready to be sold.`,
        price: 0,
        sellPrice: harvestValue,
        image: plot.plant.image,
      };

      setPlots((current) => {
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = { isPlowed: false, isWatered: false, isFlooded: false, plant: undefined };
        return newPlots;
      });

      clearPlotTimers(row, col);
      await savePlantsToFirebase();
      const userId = Firebase_Auth.currentUser?.uid;

      if (userId) {
        const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
        const statsSnapshot = await get(userStatsRef);
        const currentStats = statsSnapshot.val() || { rottedHarvested: 0, normalHarvested: 0, itemsSold: 0 };

        if (plot.plant.isRotted) {
          currentStats.rottedHarvested = (currentStats.rottedHarvested || 0) + 1;
        } else {
          currentStats.normalHarvested = (currentStats.normalHarvested || 0) + 1;
        }
        await set(userStatsRef, currentStats);
      }

      if (onMissionProgress) {
        onMissionProgress('harvestCrop', { cropType });
        if (cropType === 'Santan') onMissionProgress('harvestCrop', { cropType: 'Santan' });
        if (cropType === 'Mangga') onMissionProgress('harvestCrop', { cropType: 'Mangga' });
        if (cropType === 'Gumamela') onMissionProgress('harvestCrop', { cropType: 'Gumamela' });
        if (cropType === 'Orchids') onMissionProgress('harvestCrop', { cropType: 'Orchids' });
      }

      if (plot.plant.isRotted) {
        if (userId) {
          const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems/${harvestedCrop.id}`);
          await set(rottedItemsRef, harvestedCrop);
          Alert.alert('Harvest Complete!', `Rotten ${cropType} has been sent to compost.`);
        } else {
          onAddToDecompose(harvestedCrop);
          Alert.alert('Harvest Complete!', `Rotten ${cropType} has been sent to compost. Sign in to save!`);
        }
      } else {
        if (userId) {
          const normalItemsRef = ref(Firebase_Database, `users/${userId}/normalItems/${harvestedCrop.id}`);
          await set(normalItemsRef, harvestedCrop);
          if (onMissionProgress) {
            if (plot.plant.type === 'tree') {
              onMissionProgress('sellTree', { item: harvestedCrop });
            } else {
              onMissionProgress('sellCrop', { item: harvestedCrop });
            }
          }
          Alert.alert('Harvest Complete!', `${cropType} has been harvested and added to your inventory.`);
        } else {
          onAddToNormalInventory(harvestedCrop);
          Alert.alert('Harvest Complete!', `${cropType} has been harvested. Sign in to save!`);
        }
      }

      onUpdateStatistics({ plantsGrown: 1 });
      playTimedSound(require('@/assets/sound/harvesting.mp3'));

      if (onComplete) onComplete();
      if (isTutorialActive && tutorialStep === 12) advanceTutorial();
    }
  };

  const updatePlot = (current: PlotStatus[][], row: number, col: number, update: Partial<PlotStatus>) => {
    const newPlots = [...current];
    newPlots[row] = [...newPlots[row]];
    newPlots[row][col] = { ...newPlots[row][col], ...update };
    return newPlots;
  };

  const savePlantsToFirebase = async () => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) return;

    try {
      const serializablePlots = plots.map((row) =>
        row.map((plot) => {
          const cleanPlot = { isPlowed: !!plot.isPlowed, isWatered: !!plot.isWatered, isFlooded: plot.isFlooded || false };
          if (plot.plant) {
            cleanPlot.plant = {
              id: plot.plant.id,
              stage: plot.plant.stage,
              type: plot.plant.type,
              plantedAt: plot.plant.plantedAt.getTime(),
              readyAt: plot.plant.readyAt.getTime(),
              cropType: plot.plant.cropType,
              image: plot.plant.image,
              hasInfestation: !!plot.plant.hasInfestation,
              isRotted: !!plot.plant.isRotted,
              isFertilized: !!plot.plant.isFertilized,
              needsWater: !!plot.plant.needsWater,
            };
          }
          return cleanPlot;
        })
      );
      const plotsRef = ref(Firebase_Database, `users/${userId}/plots`);
      await set(plotsRef, serializablePlots);
    } catch (error) {
      console.error('Error saving plots to Firebase:', error);
    }
  };

  useEffect(() => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) return;
    const timeout = setTimeout(() => {
      savePlantsToFirebase().catch((error) => console.error('Debounced save error:', error));
    }, 500);
    return () => clearTimeout(timeout);
  }, [plots]);

  const loadPlantsFromFirebase = async () => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) return false;

    try {
      const plotsRef = ref(Firebase_Database, `users/${userId}/plots`);
      const snapshot = await get(plotsRef);
      const savedPlots = snapshot.val();
      if (!savedPlots) return false;

      clearAllTimers();
      const deserializedPlots = savedPlots.map((row) =>
        row.map((plot) => {
          if (!plot) return { isPlowed: false, isWatered: false, isFlooded: false };
          const newPlot = {
            isPlowed: plot.isPlowed || false,
            isWatered: plot.isWatered || false,
            isFlooded: plot.isFlooded || false,
            plant: plot.plant
              ? {
                  ...plot.plant,
                  plantedAt: new Date(plot.plant.plantedAt),
                  readyAt: new Date(plot.plant.readyAt),
                  hasInfestation: !!plot.plant.hasInfestation,
                  isRotted: !!plot.plant.isRotted,
                  isFertilized: !!plot.plant.isFertilized,
                  needsWater: !!plot.plant.needsWater,
                }
              : undefined,
          };
          return newPlot;
        })
      );

      const initialTimers = { growth: {}, decay: {}, drought: {} };
      const now = Date.now();

      deserializedPlots.forEach((row, rowIndex) => {
        row.forEach((plot, colIndex) => {
          const plotId = `${rowIndex}-${colIndex}`;
          startFloodCheck(rowIndex, colIndex);
          if (plot.plant) {
            if (plot.plant.stage < 3) {
              initialTimers.growth[plotId] = Math.max(
                0,
                Math.floor((plot.plant.readyAt.getTime() - now) / 1000)
              );
            }
            if (plot.plant.stage === 3 && !plot.plant.isRotted) {
              startInfestationCheck(rowIndex, colIndex);
              startDroughtCheck(rowIndex, colIndex);
            }
            if (plot.plant.hasInfestation) {
              initialTimers.decay[plotId] = Math.max(
                0,
                Math.floor((plot.plant.readyAt.getTime() + DECAY_TIME - now) / 1000)
              );
              startDecayTimer(rowIndex, colIndex);
            }
            if (plot.plant.needsWater) {
              initialTimers.drought[plotId] = Math.max(
                0,
                Math.floor((plot.plant.readyAt.getTime() + DROUGHT_DECAY_TIME - now) / 1000)
              );
              startDroughtDecayTimer(rowIndex, colIndex);
            }
          }
        });
      });

      setPlots(deserializedPlots);
      setTimers(initialTimers);
      return true;
    } catch (error) {
      console.error('Error loading plots from Firebase:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const userId = Firebase_Auth.currentUser?.uid;
      if (userId) {
        const loaded = await loadPlantsFromFirebase();
        if (!loaded && initialPlotsState) {
          setPlots(initialPlotsState);
          await savePlantsToFirebase();
        }
      } else if (initialPlotsState) {
        setPlots(initialPlotsState);
      }
    };
    loadData();
    const unsubscribe = Firebase_Auth.onAuthStateChanged((user) => {
      if (user) loadData();
    });
    return () => unsubscribe();
  }, []);

  const handlePlotPress = (row: number, col: number) => {
    if (!selectedItem) return;

    const plot = plots[row][col];
    if (isTutorialActive && tutorialSteps[tutorialStep].highlight === 'plot' && (row !== 0 || col !== 0)) {
      Alert.alert('Tutorial', 'Please tap the selected plot to continue!');
      return;
    }
    if (plot.isFlooded) {
      if (selectedItem.title === 'Regadera') {
        setPlots((current) => updatePlot(current, row, col, { isPlowed: false, isWatered: false, isFlooded: false, plant: undefined }));
        Alert.alert('Plot Drained', 'You’ve successfully drained the flooded plot.');
        playTimedSound(require('@/assets/sound/water.mp3'));
        onUseItem(selectedItem);
        startFloodCheck(row, col);
        return;
      } else {
        Alert.alert('Plot Flooded', 'Use Regadera to drain it first.');
        return;
      }
    }

    switch (selectedItem.title) {
      case 'Asarol':
        if (!plot.isPlowed) {
          setPlots((current) => updatePlot(current, row, col, { isPlowed: true }));
          playTimedSound(require('@/assets/sound/plow.mp3'));
          onMissionProgress?.('useTool', { tool: 'Asarol' });
          if (isTutorialActive && tutorialStep === 3) advanceTutorial();
          savePlantsToFirebase();
        } else {
          Alert.alert('Already Plowed', 'This plot has already been plowed.');
        }
        break;

      case 'Regadera':
        if (plot.isPlowed && !plot.isWatered) {
          setPlots((current) => updatePlot(current, row, col, { isWatered: true }));
          playTimedSound(require('@/assets/sound/water.mp3'));
          onMissionProgress?.('waterCrop', { row, col });
          if (isTutorialActive && tutorialStep === 5) advanceTutorial();
          savePlantsToFirebase();
        } else if (plot.plant?.needsWater) {
          setPlots((current) => {
            if (droughtDecayTimersRef.current[`${row}-${col}`]) {
              clearTimeout(droughtDecayTimersRef.current[`${row}-${col}`]);
              delete droughtDecayTimersRef.current[`${row}-${col}`];
            }
            return updatePlot(current, row, col, { isWatered: true, plant: { ...plot.plant, needsWater: false } });
          });
          Alert.alert('Plant Watered', 'You’ve saved your plant from drought!');
          onMissionProgress?.('waterCrop', { row, col });
          playTimedSound(require('@/assets/sound/water.mp3'));
          onUseItem(selectedItem);
        } else {
          Alert.alert(!plot.isPlowed ? 'Not Plowed' : 'Already Watered', !plot.isPlowed ? 'Plow first.' : 'Already watered.');
        }
        break;

      case 'Itak':
        if (plot.plant && plot.plant.stage === 3) {
          if (onMissionProgress) {
            onMissionProgress('useTool', { tool: 'Itak' });
          }
          handleHarvest(row, col, plot);
        } else {
          Alert.alert('Not Ready', 'This plant isn’t ready for harvest yet.');
        }
        break;

      case 'Chemical Pesticide':
        if (plot.plant?.hasInfestation) {
          clearPlotTimers(row, col);
          setPlots((current) => updatePlot(current, row, col, { plant: { ...plot.plant, hasInfestation: false } }));
          setTimeout(() => startInfestationCheck(row, col), 100);
          Alert.alert('Success!', 'The infestation has been treated.');
          playTimedSound(require('@/assets/sound/spray.mp3'));
          onUseItem(selectedItem);
          savePlantsToFirebase();
        } else {
          Alert.alert(plot.plant ? 'No Infestation' : 'No Plant', plot.plant ? 'No infestation.' : 'No plant here.');
        }
        break;

      case 'Synthetic Fertilizer':
      case 'Organic Fertilizer':
        if (plot.plant && !plot.plant.isFertilized) {
          setPlots((current) => {
            const currentTime = new Date();
            const remainingTime = plot.plant.readyAt.getTime() - currentTime.getTime();
            const newReadyAt = new Date(currentTime.getTime() + remainingTime * FERTILIZER_GROWTH_MULTIPLIER);
            return updatePlot(current, row, col, { plant: { ...plot.plant, isFertilized: true, readyAt: newReadyAt } });
          });
          Alert.alert('Success!', 'Fertilizer applied! Growth speed increased and harvest value doubled.');
          onMissionProgress?.('useFertilizer', { type: selectedItem.title });
          playTimedSound(require('@/assets/sound/fertilizernew.mp3'));
          onUseItem(selectedItem);
          if (isTutorialActive && tutorialStep === 10) advanceTutorial();
          savePlantsToFirebase();
        } else {
          Alert.alert(!plot.plant ? 'No Plant' : 'Already Fertilized', !plot.plant ? 'No plant.' : 'Already fertilized.');
        }
        break;

      default:
        if (selectedItem.type === 'crop' || selectedItem.type === 'tree') {
          if (!plot.isPlowed || !plot.isWatered) {
            Alert.alert('Plot Not Ready', `Please ${!plot.isPlowed ? 'plow' : 'water'} the plot first.`);
            return;
          }
          if (plot.plant) {
            Alert.alert('Plot Occupied', 'This plot already has a plant.');
            return;
          }
          const cropType = selectedItem.title as keyof typeof GROWTH_TIMES;
          const growthTime = GROWTH_TIMES[cropType];
          const newPlant: PlantData = {
            id: Math.random().toString(),
            stage: 0,
            type: selectedItem.type,
            plantedAt: new Date(),
            readyAt: new Date(Date.now() + growthTime),
            cropType: selectedItem.title,
            image: selectedItem.image,
            hasInfestation: false,
            isRotted: false,
            isFertilized: false,
            needsWater: false,
          };
          setPlots((current) => updatePlot(current, row, col, { plant: newPlant }));
          setTimers((prev) => ({
            ...prev,
            growth: { ...prev.growth, [`${row}-${col}`]: Math.floor(growthTime / 1000) },
          }));
          playTimedSound(require('@/assets/sound/plant.mp3'));
          onUseItem(selectedItem);
          if (onMissionProgress) {
            onMissionProgress('plantCrop', { cropType: selectedItem.title });
            if (selectedItem.title === 'Santan') onMissionProgress('plantCrop', { cropType: 'Santan' });
            if (selectedItem.title === 'Gumamela') onMissionProgress('plantCrop', { cropType: 'Gumamela' });
            if (selectedItem.title === 'Orchids') onMissionProgress('plantCrop', { cropType: 'Orchids' });
            if (selectedItem.title === 'Mangga') onMissionProgress('plantCrop', { cropType: 'Mangga' });
          }
          if (isTutorialActive && tutorialStep === 7) advanceTutorial();
          savePlantsToFirebase();
        }
        break;
    }
  };

  const handlePlantDecay = (row: number, col: number) => {
    setPlots((current) => {
      const plot = current[row][col];
      if (!plot.plant || !plot.plant.hasInfestation || plot.plant.isRotted) return current;
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = {
        ...newPlots[row][col],
        plant: { ...newPlots[row][col].plant!, isRotted: true, hasInfestation: false },
      };
      Alert.alert('Plant Rotten!', `Your ${plot.plant.cropType} has rotten due to untreated infestation.`);
      return newPlots;
    });
  };

  const handleDroughtDamage = (row: number, col: number) => {
    setPlots((current) => {
      const plot = current[row][col];
      if (!plot.plant || !plot.plant.needsWater) return current;
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = {
        ...newPlots[row][col],
        plant: { ...newPlots[row][col].plant!, isRotted: true, needsWater: false },
      };
      Alert.alert('Plant Withered!', `Your ${plot.plant.cropType} has withered due to drought.`);
      return newPlots;
    });
  };

  const handleFlood = (row: number, col: number) => {
    setPlots((current) => {
      const plot = current[row][col];
      if (!plot.plant || plot.isFlooded) return current;
      console.log(`Flood triggered for plot at [${row},${col}]`);
      if (plot.plant) onUpdateStatistics({ plantsLost: 1 });
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = { isPlowed: false, isWatered: false, isFlooded: true, plant: undefined };
      clearPlotTimers(row, col);
      Alert.alert('Oh No!', 'Your plot has been flooded and all crops were washed away!');
      playTimedSound(require('@/assets/sound/water.mp3'));
      return newPlots;
    });
    setTimeout(() => {
      setPlots((current) => updatePlot(current, row, col, { isPlowed: false, isWatered: false, isFlooded: false, plant: undefined }));
    }, 10000);
  };

  const getPlantImage = (plant: PlantData) => {
    if (plant.isRotted) return require('@/assets/images/rotten.png');
    if (plant.hasInfestation) return require('@/assets/images/infe.png');
    if (plant.needsWater) return require('@/assets/images/drought.png');
    switch (plant.stage) {
      case 0: return require('@/assets/images/seeds.png');
      case 1: return require('@/assets/images/sprout.png');
      case 2:
      case 3: return plant.image;
      default: return plant.image;
    }
  };

  return (
    <View className="absolute bottom-[70px] left-[300px]">
      <View className="flex-row gap-2">
        {plots.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-col gap-2">
            {row.map((plot, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                onPress={() => handlePlotPress(rowIndex, colIndex)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-4 ${
                  plot.isPlowed ? 'border-amber-800 bg-amber-700' : 'border-green-800 bg-green-700'
                } ${
                  plot.isWatered ? 'border-amber-800 bg-amber-800' : 'opacity-500'
                } ${
                  isTutorialActive && tutorialSteps[tutorialStep].highlight === 'plot' && rowIndex === 0 && colIndex === 0
                    ? 'border-yellow-500'
                    : ''
                }`}
              >
                {plot.plant && (
                  <View className="w-full h-full items-center justify-center">
                    <Image source={getPlantImage(plot.plant)} className="w-[34px] h-[34px]" resizeMode="contain" />
                    {plot.plant.stage === 3 && (
                      <View className="absolute top-0 right-0 bg-green-500 rounded-bl-lg p-[1px]">
                        <Text className="text-[8px]">✓</Text>
                      </View>
                    )}
                    {plot.plant.hasInfestation && !plot.plant.isRotted && (
                      <View className="absolute bottom-0 left-0 bg-red-500 rounded-br-lg">
                        <Text className="text-[8px]">🐛</Text>
                      </View>
                    )}
                    {plot.plant.needsWater && !plot.plant.isRotted && (
                      <View className="absolute bottom-0 right-0 bg-amber-500 rounded-br-lg p-[1px]">
                        <Text className="text-[7px]">🏜️</Text>
                      </View>
                    )}
                    {plot.plant.isRotted && (
                      <View className="absolute bottom-0 left-0 bg-brown-500 rounded-br-lg p-[1px]">
                        <Text className="text-[8px]">💀</Text>
                      </View>
                    )}
                    {plot.plant.isFertilized && (
                      <View className="absolute top-0 left-0 bg-green-500 rounded-tl-lg p-[1px]">
                        <Text className="text-[7px]">⚡</Text>
                      </View>
                    )}
                    <View className="absolute bottom-0 left-0 right-0">
                      {plot.plant.stage < 3 && (
                        <Text className="text-black text-[7px] font-medium text-right">
                          {formatTime(timers.growth[`${rowIndex}-${colIndex}`])}
                        </Text>
                      )}
                      {plot.plant.hasInfestation && !plot.plant.isRotted && (
                        <Text className="text-red text-[7px] font-medium text-right">
                          {formatTime(timers.decay[`${rowIndex}-${colIndex}`])}
                        </Text>
                      )}
                      {plot.plant.needsWater && !plot.plant.isRotted && (
                        <Text className="text-blue text-[7px] font-medium text-right">
                          {formatTime(timers.drought[`${rowIndex}-${colIndex}`])}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {selectedItem && (
        <View className="absolute top-[-5px] right-[300px] bg-white/80 p-2 rounded-lg">
          <Text className="text-sm font-medium">Selected: {selectedItem.title}</Text>
          {isTutorialActive && tutorialStep === 2 && selectedItem.title !== 'Asarol' && (
            <Text className="text-xs text-yellow-700">Select "Asarol" to continue.</Text>
          )}
          {isTutorialActive && tutorialStep === 4 && selectedItem.title !== 'Regadera' && (
            <Text className="text-xs text-yellow-700">Select "Regadera" to continue.</Text>
          )}
          {isTutorialActive && tutorialStep === 6 && selectedItem.type !== 'crop' && selectedItem.type !== 'tree' && (
            <Text className="text-xs text-yellow-700">Select a seed (e.g., "Sibuyas") to continue.</Text>
          )}
          {isTutorialActive && tutorialStep === 9 && selectedItem.title !== 'Synthetic Fertilizer' && (
            <Text className="text-xs text-yellow-700">Select "Synthetic Fertilizer" to continue.</Text>
          )}
          {isTutorialActive && tutorialStep === 11 && selectedItem.title !== 'Itak' && (
            <Text className="text-xs text-yellow-700">Select "Itak" to continue.</Text>
          )}
        </View>
      )}

      {isTutorialActive && tutorialSteps[tutorialStep].message && (
        <TutorialOverlay
          message={tutorialSteps[tutorialStep].message}
          onNext={advanceTutorial}
          onClose={() => {
            setIsTutorialActive(false);
            setTutorialStep(0);
            setTutorialRequirements({ asarolSelected: false, plotPlowed: false, regaderaSelected: false, shopVisited: false });
            markTutorialCompleted();
          }}
          highlight={tutorialSteps[tutorialStep].highlight}
        />
      )}
    </View>
  );
};