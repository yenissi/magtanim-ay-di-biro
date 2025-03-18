import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Firebase_Database, Firebase_Auth } from '@/firebaseConfig';
import { ref, push, set, get, update, serverTimestamp, onValue, off } from 'firebase/database';

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
  Sibuyas: { normal: 50, rotted: 0 },
  Mangga: { normal: 150, rotted: 0 },
  Carrot: { normal: 100, rotted: 0 },
  Gumamela: { normal: 250, rotted: 0 },
  Santan: { normal: 150, rotted: 0 },
  Kamatis: { normal: 100, rotted: 0 },
  Orchids: { normal: 150, rotted: 0 },
  Saging: { normal: 100, rotted: 0 },
  Papaya: { normal: 100, rotted: 0 },
} as const;

const INFESTATION_CHANCE = 1; // 100% chance of infestation
const INFESTATION_CHECK_INTERVAL = 10000; // Check every 10 seconds
const DECAY_TIME = 30000; // 30 seconds to treat infestation before decay
const FERTILIZER_GROWTH_MULTIPLIER = 0.5 ; // Reduces growth time by 10%

const DROUGHT_CHANCE = 0.1; // 10% chance of drought
const DROUGHT_CHECK_INTERVAL = 10000; // Check every 15 seconds
const DROUGHT_DECAY_TIME = 30000; // 30 seconds to water plants before damage
const FLOOD_CHANCE = 0.1; // 50% chance of flood
const FLOOD_CHECK_INTERVAL = 30000; // Check every 30 seconds

interface TanimanProps {
  inventory: InventoryItem[];
  onUpdateMoney: (amount: number) => void;
  onUpdateStatistics: (stats: { plantsGrown?: number, moneyEarned?: number }) => void;
  selectedItem: InventoryItem | null;
  userMoney: number;
  onAddToInventory: (item: InventoryItem) => void;
  initialPlotsState?: PlotStatus[][];
  onSavePlotsState: (plotsData: PlotStatus[][]) => void;
  onUseItem: (item: InventoryItem) => void; 
  onAddToDecompose: (item: InventoryItem) => void;
  decomposedItems: InventoryItem[];
  onAddToNormalInventory: (item: InventoryItem) => void;
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
  decomposedItems
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

  const triggerRefresh = () => setRefresh(prev => !prev);

  const [plots, setPlots] = useState<PlotStatus[][]>(
    initialPlotsState || Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({
        isPlowed: false,
        isWatered: false,
        plant: undefined
      }))
    )
  );

  
  // Add this new function to handle plant decay directly
  const handlePlantDecay = (row: number, col: number) => {
    setPlots(current => {
      const plot = current[row][col];
      if (!plot.plant || !plot.plant.hasInfestation || plot.plant.isRotted) {
        return current; // No change needed
      }
      
      console.log(`Manual decay triggered for infested plant at [${row},${col}]`);
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = {
        ...newPlots[row][col],
        plant: {
          ...newPlots[row][col].plant!,
          isRotted: true,
          hasInfestation: false
        }
      };
      
      // Alert the user
      Alert.alert(
        "Plant Rotted!", 
        `Your ${plot.plant.cropType} has rotted due to untreated infestation.`
      );
      
      return newPlots;
    });
  };
  // New function to handle drought damage
  const handleDroughtDamage = (row: number, col: number) => {
    setPlots(current => {
      const plot = current[row][col];
      if (!plot.plant || !plot.plant.needsWater) {
        return current; // No change needed
      }
      
      console.log(`Drought damage triggered for plant at [${row},${col}]`);
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = {
        ...newPlots[row][col],
        plant: {
          ...newPlots[row][col].plant!,
          isRotted: true,
          needsWater: false
        }
      };
      
      // Alert the user
      Alert.alert(
        "Plant Withered!", 
        `Your ${plot.plant.cropType} has withered due to drought. Harvest value will be reduced.`
      );
      
      return newPlots;
    });
  };
   // New function to handle flooding
   const handleFlood = (row: number, col: number) => {
    setPlots(current => {
      const plot = current[row][col];
      if (!plot.plant || plot.isFlooded) {
        return current; // No change needed
      }
      
      console.log(`Flood triggered for plot at [${row},${col}]`);
      
      // Record plant loss in statistics
      if (plot.plant) {
        onUpdateStatistics({ plantsLost: 1 });
      }
      
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];
      newPlots[row][col] = {
        isPlowed: false,
        isWatered: false,
        isFlooded: true,
        plant: undefined
      };
      
      // Clear all timers for this plot
      clearPlotTimers(row, col);
      
      // Alert the user
      Alert.alert(
        "Oh No!", 
        `Your plot has been flooded and all crops were washed away!`
      );
      
      // Play flood sound
      playTimedSound(require('@/assets/sound/water.mp3'));
      
      return newPlots;
    });
    
    // After a delay, the flood recedes
    setTimeout(() => {
      setPlots(current => {
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          isPlowed: false,
          isWatered: false,
          isFlooded: false,
          plant: undefined
        };
        return newPlots;
      });
    }, 10000); // Flood recedes after 10 seconds
  };

  // Save plots state whenever it changes
  useEffect(() => {
    onSavePlotsState(plots);
    // console.log('Updated plots state:', JSON.stringify(plots, null, 2));
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Timer update effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimers = { growth: {}, decay: {}, drought: {} };

      plots.forEach((row, rowIndex) => {
        row.forEach((plot, colIndex) => {
          const plotId = `${rowIndex}-${colIndex}`;
          if (plot.plant) {
            // Growth timer
            if (plot.plant.stage < 3) {
              const timeRemaining = Math.max(0, plot.plant.readyAt.getTime() - now);
              newTimers.growth[plotId] = timeRemaining;
            }

            // Decay timer (if infested)
            if (plot.plant.hasInfestation && !plot.plant.isRotted) {
              const infestationStartTime = plot.plant.readyAt.getTime(); // Assuming infestation starts when plant reaches stage 3
              const decayTimeRemaining = Math.max(0, infestationStartTime + DECAY_TIME - now);
              newTimers.decay[plotId] = decayTimeRemaining;

              // Check if decay timer has reached zero - apply rot immediately
              if (decayTimeRemaining === 0 && plot.plant.hasInfestation) {
                handlePlantDecay(rowIndex, colIndex);
              }
            }
            // Drought timer
            if (plot.plant.needsWater && !plot.plant.isRotted) {
              const droughtStartTime = plot.plant.readyAt.getTime(); // Using same timing mechanism
              const droughtTimeRemaining = Math.max(0, droughtStartTime + DROUGHT_DECAY_TIME - now);
              newTimers.drought[plotId] = droughtTimeRemaining;

              // Check if drought timer has reached zero - apply withering immediately
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

  // Setup infestation timers for existing plants when component mounts
  useEffect(() => {
    // First, clear any existing timers
    clearAllTimers();
    // Then set up new timers for all existing plants
    plots.forEach((row, rowIndex) => {
      row.forEach((plot, colIndex) => {
        if (plot.plant && plot.plant.stage === 3 && !plot.plant.isRotted) {
          // Start infestation checks
          startInfestationCheck(rowIndex, colIndex);
          
          // Start drought checks
          startDroughtCheck(rowIndex, colIndex);
        }
        // Start flood checks for all plots
        startFloodCheck(rowIndex, colIndex);
      });
    });
    
    // Cleanup function
    return () => {
      clearAllTimers();
      if (sound) {
        sound.unloadAsync();
      }
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
      }
    };
  }, []);

  const clearAllTimers = () => {
    // Clear all infestation timers
    Object.values(infestationTimersRef.current).forEach(timer => {
      clearInterval(timer);
    });
    infestationTimersRef.current = {};
    
    // Clear all decay timers
    Object.values(decayTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    decayTimersRef.current = {};

    // Clear all drought timers
    Object.values(droughtTimersRef.current).forEach(timer => {
      clearInterval(timer);
    });
    droughtTimersRef.current = {};
    
    // Clear all drought decay timers
    Object.values(droughtDecayTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    droughtDecayTimersRef.current = {};
    
    // Clear all flood timers
    Object.values(floodTimersRef.current).forEach(timer => {
      clearInterval(timer);
    });
    floodTimersRef.current = {};

  };

  const clearPlotTimers = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    
    // Clear infestation timer if exists
    if (infestationTimersRef.current[plotId]) {
      clearInterval(infestationTimersRef.current[plotId]);
      delete infestationTimersRef.current[plotId];
    }
    
    // Clear decay timer if exists
    if (decayTimersRef.current[plotId]) {
      clearTimeout(decayTimersRef.current[plotId]);
      delete decayTimersRef.current[plotId];
    }
    // Clear drought timer if exists
    if (droughtTimersRef.current[plotId]) {
      clearInterval(droughtTimersRef.current[plotId]);
      delete droughtTimersRef.current[plotId];
    }
    
    // Clear drought decay timer if exists
    if (droughtDecayTimersRef.current[plotId]) {
      clearTimeout(droughtDecayTimersRef.current[plotId]);
      delete droughtDecayTimersRef.current[plotId];
    }
    
    // Clear flood timer if exists
    if (floodTimersRef.current[plotId]) {
      clearInterval(floodTimersRef.current[plotId]);
      delete floodTimersRef.current[plotId];
    }
  };

  const playTimedSound = async (soundFile: number) => {
    try {
      // Ensure the previous sound is safely unloaded
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          console.log("Error checking sound status:", error);
          // Continue anyway, as we'll create a new sound instance
        }
        setSound(null);
      }
    
      // Create and load the sound before trying to play it
      const { sound: newSound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: false } // Don't auto-play until fully loaded
      );
      
      setSound(newSound);
      
      // Wait until loaded then play
      await newSound.playAsync();
    
      // Set up cleanup timeout
      soundTimeoutRef.current = setTimeout(async () => {
        if (newSound) {
          try {
            const currentStatus = await newSound.getStatusAsync();
            if (currentStatus.isLoaded) {
              await newSound.stopAsync();
              await newSound.unloadAsync();
            }
          } catch (error) {
            console.log("Error during sound cleanup:", error);
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
    
    // Clear any existing timer first
    if (infestationTimersRef.current[plotId]) {
      clearInterval(infestationTimersRef.current[plotId]);
    }
    
    // Create new infestation check timer
    const timer = setInterval(() => {
      setPlots(current => {
        const plot = current[row][col];
        if (!plot.plant || plot.plant.stage !== 3 || plot.plant.isRotted) {
          return current; // No change needed
        }
        
        // Apply infestation with 100% chance
        if (Math.random() < INFESTATION_CHANCE) {
          console.log(`Infestation triggered for plant at [${row},${col}]`);
          
          const newPlots = [...current];
          newPlots[row] = [...newPlots[row]];
          newPlots[row][col] = {
            ...newPlots[row][col],
            plant: {
              ...newPlots[row][col].plant!,
              hasInfestation: true
            }
          };
          
          // Start the decay timer
          startDecayTimer(row, col);
          
          return newPlots;
        }
        
        return current; // No changes
      });
    }, INFESTATION_CHECK_INTERVAL);
    
    // Store the timer ID
    infestationTimersRef.current[plotId] = timer;
    
    console.log(`Started infestation check for plant at [${row},${col}]`);
    return timer;
  };
  // New function for drought checks
  const startDroughtCheck = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    
    // Clear any existing timer first
    if (droughtTimersRef.current[plotId]) {
      clearInterval(droughtTimersRef.current[plotId]);
    }
    
    // Create new drought check timer
    const timer = setInterval(() => {
      setPlots(current => {
        const plot = current[row][col];
        if (!plot.plant || plot.plant.stage !== 3 || plot.plant.isRotted || plot.plant.needsWater) {
          return current; // No change needed
        }
        
        // Apply drought with the defined chance
        if (Math.random() < DROUGHT_CHANCE) {
          console.log(`Drought triggered for plant at [${row},${col}]`);
          
          const newPlots = [...current];
          newPlots[row] = [...newPlots[row]];
          newPlots[row][col] = {
            ...newPlots[row][col],
            isWatered: false, // Plant loses its watered status
            plant: {
              ...newPlots[row][col].plant!,
              needsWater: true
            }
          };
          
          // Start the drought decay timer
          startDroughtDecayTimer(row, col);
          
          // Alert the user
          Alert.alert(
            "Drought!", 
            `Your ${plot.plant.cropType} needs water! Use Regadera to prevent withering.`
          );
          
          return newPlots;
        }
        
        return current; // No changes
      });
    }, DROUGHT_CHECK_INTERVAL);
    
    // Store the timer ID
    droughtTimersRef.current[plotId] = timer;
    
    console.log(`Started drought check for plant at [${row},${col}]`);
    return timer;
  };
  // New function for flood checks
  const startFloodCheck = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    
    // Clear any existing timer first
    if (floodTimersRef.current[plotId]) {
      clearInterval(floodTimersRef.current[plotId]);
    }
    
    // Create new flood check timer
    const timer = setInterval(() => {
      setPlots(current => {
        const plot = current[row][col];
        if (plot.isFlooded) {
          return current; // No change needed if already flooded
        }
        
        // Apply flood with the defined chance
        if (Math.random() < FLOOD_CHANCE) {
          // Handle the flood in a separate function
          handleFlood(row, col);
        }
        
        return current; // This will be updated by handleFlood if needed
      });
    }, FLOOD_CHECK_INTERVAL);
    
    // Store the timer ID
    floodTimersRef.current[plotId] = timer;
    
    // console.log(`Started flood check for plot at [${row},${col}]`);
    return timer;
  };

  const startDecayTimer = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    // Clear any existing decay timer first
    if (decayTimersRef.current[plotId]) {
      clearTimeout(decayTimersRef.current[plotId]);
    }
    const timer = setTimeout(() => {
      setPlots(current => {
        const plot = current[row][col];
        if (!plot.plant || !plot.plant.hasInfestation || plot.plant.isRotted) {
          return current; // No change needed
        }
        console.log(`Decay timer triggered for infested plant at [${row},${col}]`);
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          ...newPlots[row][col],
          plant: {
            ...newPlots[row][col].plant!,
            isRotted: true,
            hasInfestation: false
          }
        };
        
        // Alert the user
        Alert.alert(
          "Plant Rotted!", 
          `Your ${plot.plant.cropType} has rotted due to untreated infestation. Harvest value will be reduced.`
        );
        return newPlots;
      });
    }, DECAY_TIME);
    decayTimersRef.current[plotId] = timer;
    console.log(`Started decay timer for infested plant at [${row},${col}]`);
    return timer;
  };

  const InfestationDebugOverlay = ({ plots }: { plots: PlotStatus[][] }) => {
    return (
      <View style={{
        position: 'absolute', 
        top: 10, 
        left: 10, 
        backgroundColor: 'rgba(0,0,0)', 
        padding: 10
      }}>
        {plots.map((row, rowIndex) => (
          row.map((plot, colIndex) => (
            plot.plant && (
              <Text key={`${rowIndex}-${colIndex}`} style={{color: 'white'}}>
                Plot [{rowIndex},{colIndex}]: 
                Stage {plot.plant.stage}, 
                Infested: {plot.plant.hasInfestation ? '🐛 YES' : '✅ NO'},
                Rotted: {plot.plant.isRotted ? '💀 YES' : '✅ NO'}
              </Text>
            )
          ))
        ))}
      </View>
    );
  };
  // New function for drought decay timer
  const startDroughtDecayTimer = (row: number, col: number) => {
    const plotId = `${row}-${col}`;
    // Clear any existing drought decay timer first
    if (droughtDecayTimersRef.current[plotId]) {
      clearTimeout(droughtDecayTimersRef.current[plotId]);
    }
    const timer = setTimeout(() => {
      setPlots(current => {
        const plot = current[row][col];
        if (!plot.plant || !plot.plant.needsWater || plot.plant.isRotted) {
          return current; // No change needed
        }
        console.log(`Drought decay timer triggered for plant at [${row},${col}]`);
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          ...newPlots[row][col],
          plant: {
            ...newPlots[row][col].plant!,
            isRotted: true,
            needsWater: false
          }
        };
        
        // Alert the user
        Alert.alert(
          "Plant Withered!", 
          `Your ${plot.plant.cropType} has withered due to drought. Harvest value will be reduced.`
        );
        return newPlots;
      });
    }, DROUGHT_DECAY_TIME);
    droughtDecayTimersRef.current[plotId] = timer;
    console.log(`Started drought decay timer for plant at [${row},${col}]`);
    return timer;
  };

  const WeatherDebugOverlay = ({ plots }: { plots: PlotStatus[][] }) => {
    return (
      <View style={{
        position: 'absolute', 
        top: 10, 
        left: 10, 
        backgroundColor: 'rgba(0,0,0)', 
        padding: 10
      }}>
        {plots.map((row, rowIndex) => (
          row.map((plot, colIndex) => (
            <Text key={`${rowIndex}-${colIndex}`} style={{color: 'white'}}>
              Plot [{rowIndex},{colIndex}]: 
              {plot.isFlooded ? '🌊 FLOODED' : ''}
              {plot.plant ? (
                <>
                  {' '} Stage {plot.plant.stage}, 
                  {plot.plant.needsWater ? '🏜️ DROUGHT' : '💧 Watered'}, 
                  {plot.plant.hasInfestation ? '🐛 Infested' : '✅ Healthy'},
                  {plot.plant.isRotted ? '💀 Rotted' : ''}
                </>
              ) : ' Empty'}
            </Text>
          ))
        ))}
      </View>
    );
  };

  useEffect(() => {
    const growthTimer = setInterval(() => {
      setPlots(currentPlots => {
        let updated = false;
        const newPlots = currentPlots.map((row, rowIndex) =>
          row.map((plot, colIndex) => {
            if (plot.plant) {
              const now = new Date();
              if (now >= plot.plant.readyAt && plot.plant.stage < 3) {
                // Plant has advanced to next stage
                updated = true;
                
                // Check if plant has just reached stage 3 (fully grown)
                const newStage = plot.plant.stage + 1;
                if (newStage === 3) {
                  // Start infestation checks now that the plant is mature
                  startInfestationCheck(rowIndex, colIndex);
                  // Start drought checks now that the plant is mature
                  startDroughtCheck(rowIndex, colIndex);
                }
                
                return {
                  ...plot,
                  plant: {
                    ...plot.plant,
                    stage: newStage
                  }
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
      Alert.alert(
        "Cannot Harvest", 
        "This plant has an infestation. Treat it with pesticide before harvesting, or wait for it to rot."
      );
      return;
    }
    if (plot.plant?.stage === 3) {
      const cropType = plot.plant.cropType as keyof typeof HARVEST_VALUES;
      let harvestValue = plot.plant.isRotted 
        ? HARVEST_VALUES[cropType].rotted 
        : HARVEST_VALUES[cropType].normal;
  
      // Double harvest value if fertilized
      if (plot.plant.isFertilized) {
        harvestValue *= 2;
      }
  
      // Create a unique ID using timestamp with microseconds
      const uniqueTimestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 11);
      const uniqueCounter = (global.harvestCounter = (global.harvestCounter || 0) + 1);
      
      const uniqueId = plot.plant.isRotted
        ? `rotted-${cropType}-${uniqueTimestamp}-${uniqueCounter}-${randomPart}`
        : `normal-${cropType}-${uniqueTimestamp}-${uniqueCounter}-${randomPart}`;
  
      // Create a harvested crop item to add to inventory
      const harvestedCrop: InventoryItem = {
        id: uniqueId,
        title: `${plot.plant.isRotted ? 'Rotted ' : ''} ${cropType}`,
        type: 'harvestedCrop',
        description: plot.plant.isRotted 
          ? `A rotted ${cropType} with reduced value.` 
          : `A freshly harvested ${cropType} ready to be sold.`,
        price: 0,
        sellPrice: harvestValue,
        image: plot.plant.image
      };
  
      console.log('Harvested crop created:', harvestedCrop);
  
      // Clear the plot after harvesting
      setPlots(current => {
        const newPlots = [...current];
        newPlots[row] = [...newPlots[row]];
        newPlots[row][col] = {
          isPlowed: false,
          isWatered: false,
          plant: undefined
        };
        return newPlots;
      });
      await savePlantsToFirebase();
      clearPlotTimers(row, col);
  
      const userId = Firebase_Auth.currentUser?.uid;
  
      // Update statistics first
      if (userId) {
        // Get current statistics
        const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
        const statsSnapshot = await get(userStatsRef);
        const currentStats = statsSnapshot.val() || { 
          rottedHarvested: 0, 
          normalHarvested: 0,
          itemsSold: 0 
        };
        
        // Update the appropriate statistic
        if (plot.plant.isRotted) {
          currentStats.rottedHarvested = (currentStats.rottedHarvested || 0) + 1;
        } else {
          currentStats.normalHarvested = (currentStats.normalHarvested || 0) + 1;
        }
        
        // Save updated statistics
        await set(userStatsRef, currentStats);
      }
  
      // Handle different item types
      if (plot.plant.isRotted) {
        // Handle rotted crops - just save to Firebase, callbacks will handle UI updates
        if (userId) {
          const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems/${harvestedCrop.id}`);
          await set(rottedItemsRef, harvestedCrop);
          console.log('Rotted crop saved to Firebase');
          
          // No need to manually call onAddToDecompose here since the Firebase listener will handle it
          Alert.alert(
            'Harvest Complete!',
            `Rotted ${cropType} has been sent to compost.`
          );
        } else {
          // If user is not signed in, update UI directly
          onAddToDecompose(harvestedCrop);
          Alert.alert(
            'Harvest Complete!',
            `Rotted ${cropType} has been sent to compost. Sign in to save your progress!`
          );
        }
      } else {
        // Handle normal crops - just save to Firebase, callbacks will handle UI updates
        if (userId) {
          const normalItemsRef = ref(Firebase_Database, `users/${userId}/normalItems/${harvestedCrop.id}`);
          await set(normalItemsRef, harvestedCrop);
          console.log('Normal crop saved to Firebase');
          
          // No need to manually call onAddToNormalInventory here since the Firebase listener will handle it
          Alert.alert(
            'Harvest Complete!',
            `${cropType} has been harvested and added to your inventory.`
          );
        } else {
          // If user is not signed in, update UI directly
          if (typeof onAddToNormalInventory === 'function') {
            onAddToNormalInventory(harvestedCrop);
          }
          Alert.alert(
            'Harvest Complete!',
            `${cropType} has been harvested and added to your inventory. Sign in to save your progress!`
          );
        }
      }
  
      // Update local statistics
      onUpdateStatistics({ plantsGrown: 1 });
      playTimedSound(require('@/assets/sound/harvesting.mp3'));
  
      if (onComplete) {
        onComplete();
      }
    }
  };

  const savePlantsToFirebase = async () => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) return;
  
    try {
      // Convert plots to a serializable format and filter out undefined values
      const serializablePlots = plots.map(row => 
        row.map(plot => {
          // Create a clean plot object without undefined values
          const cleanPlot = {
            isPlowed: !!plot.isPlowed,
            isWatered: !!plot.isWatered,
            isFlooded: plot.isFlooded || false
          };
          
          // Only add plant if it exists
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
              needsWater: !!plot.plant.needsWater
            };
          }
          
          return cleanPlot;
        })
      );
  
      // Save to Firebase
      const plotsRef = ref(Firebase_Database, `users/${userId}/plots`);
      await set(plotsRef, serializablePlots);
      console.log('Plots saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving plots to Firebase:', error);
    }
  };
  
  
  // Add function to load planted crops from Firebase
  const loadPlantsFromFirebase = async () => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) return false;
  
    try {
      const plotsRef = ref(Firebase_Database, `users/${userId}/plots`);
      const snapshot = await get(plotsRef);
      const savedPlots = snapshot.val();
      
      if (!savedPlots) {
        console.log('No saved plots found in Firebase');
        return false;
      }
      
      console.log('Found plots data in Firebase:', savedPlots);
      
      // Clear all existing timers first
      clearAllTimers();
      
      // Convert dates back to Date objects
      const deserializedPlots = savedPlots.map((row) => 
        row.map((plot) => {
          // Handle null or undefined plot
          if (!plot) return {
            isPlowed: false,
            isWatered: false
          };
          
          // Create a new plot object with defaults
          const newPlot = {
            isPlowed: plot.isPlowed || false,
            isWatered: plot.isWatered || false,
            isFlooded: plot.isFlooded || false
          };
          
          // Only add plant if it exists in the data
          if (plot.plant) {
            newPlot.plant = {
              ...plot.plant,
              plantedAt: new Date(plot.plant.plantedAt),
              readyAt: new Date(plot.plant.readyAt),
              hasInfestation: !!plot.plant.hasInfestation,
              isRotted: !!plot.plant.isRotted,
              isFertilized: !!plot.plant.isFertilized,
              needsWater: !!plot.plant.needsWater
            };
          }
          
          return newPlot;
        })
      );
      
      // Update the state
      setPlots(deserializedPlots);
      console.log('Plots loaded from Firebase successfully');
      
      // Setup timers for loaded plants after state is updated
      setTimeout(() => {
        deserializedPlots.forEach((row, rowIndex) => {
          row.forEach((plot, colIndex) => {
            // Start flood checks for all plots
            startFloodCheck(rowIndex, colIndex);
            
            // Only proceed if there's a plant
            if (plot.plant) {
              // Handle growing plants (stages 0-2)
              if (plot.plant.stage < 3) {
                // No special timers needed, the growth timer will handle this
                console.log(`Setting up growth timer for plant at [${rowIndex},${colIndex}]`);
              } 
              // Handle mature plants (stage 3)
              else if (plot.plant.stage === 3) {
                console.log(`Setting up stage 3 timers for plant at [${rowIndex},${colIndex}]`);
                
                if (!plot.plant.isRotted) {
                  // Start infestation check for healthy mature plants
                  startInfestationCheck(rowIndex, colIndex);
                  
                  // Start drought check for healthy mature plants
                  startDroughtCheck(rowIndex, colIndex);
                  
                  // If plant has infestation but not rotted yet, start decay timer
                  if (plot.plant.hasInfestation) {
                    console.log(`Starting decay timer for infested plant at [${rowIndex},${colIndex}]`);
                    startDecayTimer(rowIndex, colIndex);
                  }
                  
                  // If plant needs water but not rotted yet, start drought decay timer
                  if (plot.plant.needsWater) {
                    console.log(`Starting drought decay timer for plant at [${rowIndex},${colIndex}]`);
                    startDroughtDecayTimer(rowIndex, colIndex);
                  }
                }
              }
            }
          });
        });
      }, 100); // Small delay to ensure state is updated first
      
      return true; // Successfully loaded data
    } catch (error) {
      console.error('Error loading plots from Firebase:', error);
      return false; // Failed to load data
    }
  };
  

  useEffect(() => {
    const loadData = async () => {
      // First try to load from Firebase if user is logged in
      const userId = Firebase_Auth.currentUser?.uid;
      if (userId) {
        try {
          console.log('Attempting to load plots from Firebase...');
          const loaded = await loadPlantsFromFirebase();
          console.log('Firebase load result:', loaded);
          
          // If Firebase load failed and we have initial state, use that
          if (!loaded && initialPlotsState) {
            console.log('Using initial state from props instead');
            setPlots(initialPlotsState);
            // Save this initial state to Firebase immediately
            setTimeout(() => savePlantsToFirebase(), 500);
          }
        } catch (error) {
          console.error('Error in initial data loading:', error);
          // Fallback to initial state
          if (initialPlotsState) {
            setPlots(initialPlotsState);
          }
        }
      } 
      // If not logged in but we have initial state, use that
      else if (initialPlotsState) {
        console.log('User not logged in, using initial state from props');
        setPlots(initialPlotsState);
      }
    };
    
    loadData();
    
    // Add auth state listener to reload when user logs in
    const unsubscribe = Firebase_Auth.onAuthStateChanged((user) => {
      console.log('Auth state changed, user:', user?.uid);
      if (user) {
        loadData(); // Reload data when user logs in
      }
    });
    
    return () => unsubscribe(); // Clean up listener
  }, []);  
  
  const handlePlotPress = (row: number, col: number) => { 
    if (!selectedItem) {
      return;
    }
    const plot = plots[row][col];
    // If plot is flooded, only allow draining
    if (plot.isFlooded) {
      if (selectedItem.title === 'Regadera') {
        // Use Regadera to drain the flooded plot
        setPlots(current => {
          const newPlots = [...current];
          newPlots[row] = [...newPlots[row]];
          newPlots[row][col] = {
            isPlowed: false,
            isWatered: false,
            isFlooded: false,
            plant: undefined
          };
          return newPlots;
        });
        
        Alert.alert("Plot Drained", "You've successfully drained the flooded plot.");
        playTimedSound(require('@/assets/sound/water.mp3'));

        onUseItem(selectedItem);

        // Start flood checks again
        startFloodCheck(row, col);
        return;
      } else {
        Alert.alert("Plot Flooded", "This plot is flooded. Use Regadera to drain it first.");
        return;
      }
    }
    
    switch (selectedItem.title) {
      case 'Asarol':
        console.log('Asarol selected in switch:', selectedItem);
        if (!plot.isPlowed) {
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row] = [...newPlots[row]];
            newPlots[row][col] = {
              ...plot,
              isPlowed: true
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/plow.mp3'));
          onUseItem(selectedItem);
        } else {
          Alert.alert("Already Plowed", "This plot has already been plowed.");
        }
        break;
  
      case 'Regadera':
        if (plot.isPlowed && !plot.isWatered) {
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row] = [...newPlots[row]];
            newPlots[row][col] = {
              ...plot,
              isWatered: true
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/water.mp3'));
          onUseItem(selectedItem);
        } else if (plot.plant?.needsWater) {
          // Fix: Handle watering plants during drought
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row] = [...newPlots[row]];
            
            // Clear the drought decay timer if it exists
            if (droughtDecayTimersRef.current[`${row}-${col}`]) {
              clearTimeout(droughtDecayTimersRef.current[`${row}-${col}`]);
              delete droughtDecayTimersRef.current[`${row}-${col}`];
            }
            
            newPlots[row][col] = {
              ...plot,
              isWatered: true,
              plant: {
                ...plot.plant,
                needsWater: false
              }
            };
            return newPlots;
          });
          Alert.alert("Plant Watered", "You've saved your plant from drought!");
          playTimedSound(require('@/assets/sound/water.mp3'));
          onUseItem(selectedItem);
        } else if (!plot.isPlowed) {
          Alert.alert("Not Plowed", "You need to plow this plot first.");
        } else if (plot.isWatered) {
          Alert.alert("Already Watered", "This plot has already been watered.");
        }
        break;
      
      case 'Itak':
        if (plot.plant && plot.plant.stage === 3) {
          if (plot.plant.hasInfestation && !plot.plant.isRotted) {
            Alert.alert(
              "Cannot Harvest", 
              "This plant has an infestation. Treat it with pesticide before harvesting, or wait for it to rot."
            );
            return;
          }
          handleHarvest(row, col, plot, () => {
            onUseItem(selectedItem);
          });
        } else {
          Alert.alert("Not Ready", "This plant is not ready for harvest yet.");
        }
        break;
        
  
        case "Chemical Pesticide":
          if (plot.plant?.hasInfestation) {
            // Clear decay timer
            clearPlotTimers(row, col);

            setPlots((current) => {
              const newPlots = [...current];
              newPlots[row] = [...newPlots[row]];
              newPlots[row][col] = {
                ...newPlots[row][col],
                plant: {
                  ...newPlots[row][col].plant!,
                  hasInfestation: false,
                },
              };
    
              // Restart infestation check
              // startInfestationCheck(row, col);
              return newPlots;
            });

            // After state update, restart infestation check
            setTimeout(() => {
              startInfestationCheck(row, col);
            }, 100);
    
            Alert.alert("Success!", "The infestation has been treated.");
            playTimedSound(require("@/assets/sound/spray.mp3"));
            // Use up the pesticide item
            onUseItem(selectedItem);
          } else if (plot.plant) {
            Alert.alert("No Infestation", "This plant doesn't have an infestation.");
          } else {
            Alert.alert("No Plant", "There is no plant in this plot.");
          }
          break;
  
      case 'Synthetic Fertilizer':
      case 'Organic Fertilizer':
        if (plot.plant && !plot.plant.isFertilized) {
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row] = [...newPlots[row]];
            if (newPlots[row][col].plant) {
              const currentTime = new Date();
              const remainingTime = plot.plant.readyAt.getTime() - currentTime.getTime();
              const newReadyAt = new Date(
                currentTime.getTime() + (remainingTime * FERTILIZER_GROWTH_MULTIPLIER)
              );
              
              newPlots[row][col] = {
                ...newPlots[row][col],
                plant: {
                  ...newPlots[row][col].plant!,
                  isFertilized: true,
                  readyAt: newReadyAt
                }
              };
            }
            return newPlots;
          });
          
          Alert.alert('Success!', 'Fertilizer applied! Growth speed increased and harvest value will be doubled.');
          playTimedSound(require('@/assets/sound/fertilizernew.mp3'));
          
          // Only remove fertilizer from inventory AFTER successful use
          onUseItem(selectedItem);
        } else if (!plot.plant) {
          Alert.alert("No Plant", "There is no plant to fertilize in this plot.");
        } else if (plot.plant.isFertilized) {
          Alert.alert("Already Fertilized", "This plant has already been fertilized.");
        }
        break;
      
      default:
        if (selectedItem.type === 'crop' || selectedItem.type === 'tree') {
          if (!plot.isPlowed) {
            Alert.alert('Plot Not Ready', 'Please plow the plot first using Asarol.');
            return;
          }
          
          if (!plot.isWatered) {
            Alert.alert('Plot Not Ready', 'Please water the plot first using Regadera.');
            return;
          }
          
          if (plot.plant) {
            Alert.alert('Plot Occupied', 'This plot already has a plant growing in it.');
            return;
          }
      
          const cropType = selectedItem.title as keyof typeof GROWTH_TIMES;
          const newPlant: PlantData = {
            id: Math.random().toString(),
            stage: 0,
            type: selectedItem.type,
            plantedAt: new Date(),
            readyAt: new Date(Date.now() + GROWTH_TIMES[cropType]),
            cropType: selectedItem.title,
            image: selectedItem.image,
            hasInfestation: false,
            isFertilized: false
          };
      
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row] = [...newPlots[row]];
            newPlots[row][col] = {
              ...plot,
              plant: newPlant
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/plant.mp3'));
          onUseItem(selectedItem);
        }
        break;
    }
    setTimeout(() => savePlantsToFirebase(), 100);
  };

  const getPlantImage = (plant: PlantData) => {
    if (plant.isRotted) {
      return require('@/assets/images/rotten.png');
    }
    
    if (plant.hasInfestation) {
      return require('@/assets/images/infe.png');
    }

    if (plant.needsWater) {
      return require('@/assets/images/drought.png');
    }
    
    switch (plant.stage) {
      case 0:
        return require('@/assets/images/seeds.png');
      case 1:
        return require('@/assets/images/sprout.png');
      case 2:
      case 3:
        return plant.image;
      default: 
        return plant.image;
    }
  };

  const testInfestation = (row: number, col: number) => {

    setPlots(current => {
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];

      if (newPlots[row][col].plant) {
        newPlots[row][col] = {
          ...newPlots[row][col],
          plant: {
            ...newPlots[row][col].plant!,
            hasInfestation: true
          }
        };
        // Start decay timer
        startDecayTimer(row, col);
        console.log('🐛 FORCED Infestation:', {
          row, 
          col, 
          infestationStatus: newPlots[row][col].plant.hasInfestation
        });
        Alert.alert('Infestation Forced', 'Infestation manually set to true');
      }
      return newPlots;
    });
  };
  // test drought
  const testDrought = (row: number, col: number) => {
    setPlots(current => {
      const newPlots = [...current];
      newPlots[row] = [...newPlots[row]];

      if (newPlots[row][col].plant) {
        newPlots[row][col] = {
          ...newPlots[row][col],
          isWatered: false,
          plant: {
            ...newPlots[row][col].plant!,
            needsWater: true
          }
        };
        // Start drought decay timer
        startDroughtDecayTimer(row, col);
        console.log('🏜️ FORCED Drought:', {
          row, 
          col, 
          droughtStatus: newPlots[row][col].plant.needsWater
        });
        Alert.alert('Drought Forced', 'Drought manually set to true');
      }
      return newPlots;
    });
  };
  // test flood 
  const testFlood = (row: number, col: number) => {
    handleFlood(row, col);
    Alert.alert('Flood Forced', 'Flood manually triggered');
  };

  return (
    <View className="absolute bottom-[100px] left-[300px]">
      <View className="flex-row gap-2">
        {plots.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-col gap-2">
            {row.map((plot, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                onPress={() => handlePlotPress(rowIndex, colIndex)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-4 ${
                  plot.isPlowed 
                    ? 'border-amber-800 bg-amber-700' 
                    : 'border-green-800 bg-green-700'
                } ${
                  plot.isWatered 
                    ? 'opacity-90 shadow-lg shadow-blue-500' 
                    : 'opacity-100'
                }`}
              >
                {plot.plant && (
                  <View className="w-full h-full items-center justify-center">
                    <Image
                      source={getPlantImage(plot.plant)}
                      className="w-12 h-12"
                      resizeMode="contain"
                    />
                    {plot.plant.stage === 3 && (
                      <View className="absolute top-0 right-0 bg-green-500 rounded-bl-lg p-[1px]">
                        <Text className="text-[8px]">✓</Text>
                      </View>
                    )}
                    {plot.plant.hasInfestation && !plot.plant.isRotted && (
                      <View className="absolute bottom-0 left-0 bg-red-500 rounded-br-lg ">
                        <Text className="text-[8px]">🐛</Text>
                      </View>
                    )}
                    {plot.plant.needsWater && !plot.plant.isRotted && (
                      <View className="absolute top-0 left-0 bg-amber-500 rounded-br-lg p-[1px]">
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
                    {/* Display Timers */}
                    <View className="absolute bottom-0 left-0 right-0 ">
                      {plot.plant.stage < 3 && (
                        <Text className="text-black text-[7px] font-medium text-right">
                          {formatTime(timers.growth[`${rowIndex}-${colIndex}`] / 1000)}
                        </Text>
                      )}
                      {plot.plant.hasInfestation && !plot.plant.isRotted && (
                        <Text className="text-red text-[7px] font-medium text-right">
                          {formatTime(timers.decay[`${rowIndex}-${colIndex}`] / 1000)}
                        </Text>
                      )}
                      {plot.plant.needsWater && !plot.plant.isRotted && (
                        <Text className="text-blue text-[7px] font-medium text-right">
                          {formatTime(timers.drought[`${rowIndex}-${colIndex}`] / 1000)}
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
        </View>
      )}
    </View>
  );
};