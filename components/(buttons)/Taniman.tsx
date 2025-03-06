import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Image, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';

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
};

type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: PlantData;
};

// Key-value pair to store plot identifiers and their timer IDs
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
  Sibuyas: { normal: 50, rotted: 40 },
  Mangga: { normal: 150, rotted: 25 },
  Carrot: { normal: 100, rotted: 20 },
  Gumamela: { normal: 250, rotted: 30 },
  Santan: { normal: 150, rotted: 40 },
  Kamatis: { normal: 100, rotted: 30 },
  Orchids: { normal: 150, rotted: 40 },
  Saging: { normal: 100, rotted: 35 },
  Papaya: { normal: 100, rotted: 25 },
} as const;

const INFESTATION_CHANCE = 1; // 100% chance of infestation
const INFESTATION_CHECK_INTERVAL = 10000; // Check every 10 seconds
const DECAY_TIME = 30000; // 30 seconds to treat infestation before decay
const FERTILIZER_GROWTH_MULTIPLIER = 0.9; // Reduces growth time by 10%

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
  onAddToDecompose
}) => {
  const GRID_SIZE = 3;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [refresh, setRefresh] = useState(false);
  const soundTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Use refs to store timers outside of state
  const infestationTimersRef = useRef<TimerMap>({});
  const decayTimersRef = useRef<TimerMap>({});

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
        `Your ${plot.plant.cropType} has rotted due to untreated infestation. Harvest value will be reduced.`
      );
      
      return newPlots;
    });
  };

  // Save plots state whenever it changes
  useEffect(() => {
    onSavePlotsState(plots);
    console.log('Updated plots state:', JSON.stringify(plots, null, 2));
  }, [plots]);

  const [timers, setTimers] = useState<{
    growth: { [plotId: string]: number };
    decay: { [plotId: string]: number };
  }>({
    growth: {},
    decay: {},
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
      const newTimers = { growth: {}, decay: {} };

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
          const plotId = `${rowIndex}-${colIndex}`;
          startInfestationCheck(rowIndex, colIndex);
        }
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

  // Growth timer for plants
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

  const handleHarvest = (row: number, col: number, plot: PlotStatus) => {
    if (plot.plant?.stage === 3) {
      const cropType = plot.plant.cropType as keyof typeof HARVEST_VALUES;
      let harvestValue = plot.plant.isRotted 
        ? HARVEST_VALUES[cropType].rotted 
        : HARVEST_VALUES[cropType].normal;
      
      // Double harvest value if fertilized
      if (plot.plant.isFertilized) {
        harvestValue *= 2;
      }
  
      // Create a harvested crop item to add to inventory
      const harvestedCrop: InventoryItem = {
        id: `${cropType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${plot.plant.isRotted ? 'Rotted ' : ''}Harvested ${cropType}`,
        type: 'harvestedCrop',
        description: plot.plant.isRotted 
          ? `A rotted ${cropType} with reduced value.` 
          : `A freshly harvested ${cropType} ready to be sold.`,
        price: 0,
        sellPrice: harvestValue,
        image: plot.plant.image
      };
      
      // CHANGED: Route the harvested crop based on whether it's rotted or not
      if (plot.plant.isRotted) {
        // Send rotted crops to the DecomposeModal instead of regular inventory
        onAddToDecompose(harvestedCrop);
        Alert.alert(
          'Harvest Complete!',
          `Rotted ${cropType} has been sent to compost.`
        );
      } else {
        // Add normal crops to inventory
        onAddToInventory(harvestedCrop);
        Alert.alert(
          'Harvest Complete!',
          `${cropType} has been harvested and added to your bag.`
        );
      }
      
      // Update statistics
      onUpdateStatistics({ 
        plantsGrown: 1
      });
      
      Alert.alert(
        'Harvest Complete!',
        plot.plant.isRotted 
          ? `${cropType} was rotted but still harvested with reduced value.`
          : `${cropType} has been harvested and added to your bag.`
      );
  
      // Clear all timers for the plot
      clearPlotTimers(row, col);
  
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
      
      playTimedSound(require('@/assets/sound/harvesting.mp3'));
    }
  };

  const handlePlotPress = (row: number, col: number) => {
    if (!selectedItem) {
      return;
    }
    
    const plot = plots[row][col];
  
    switch (selectedItem.title) {
      case 'Asarol':
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

        } else if (!plot.isPlowed) {
          Alert.alert("Not Plowed", "You need to plow this plot first.");
        } else if (plot.isWatered) {
          Alert.alert("Already Watered", "This plot has already been watered.");
        }
        break;
  
      case 'Itak':
        if (plot.plant?.stage === 3) {
          handleHarvest(row, col, plot);
        } else if (plot.plant) {
          Alert.alert("Not Ready", "This plant is not ready for harvest yet.");
        } else {
          Alert.alert("Nothing to Harvest", "There is no plant to harvest in this plot.");
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
      
      // Code for the default case (planting seeds):
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
          
          // Note: We don't start infestation check until the plant reaches stage 3
          // This is handled in the growth timer effect
          
          playTimedSound(require('@/assets/sound/plant.mp3'));
          
          // Only remove seed from inventory AFTER successful planting
          onUseItem(selectedItem);
        }
        break;
    }
  };

  const getPlantImage = (plant: PlantData) => {
    if (plant.isRotted) {
      return require('@/assets/images/rotten.png');
    }
    
    if (plant.hasInfestation) {
      return require('@/assets/images/infe.png');
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
                      <View className="absolute top-0 right-0 bg-yellow-400 rounded-bl-lg p-1">
                        <Text className="text-xs">✓</Text>
                      </View>
                    )}
                    {plot.plant.hasInfestation && !plot.plant.isRotted && (
                      <View className="absolute bottom-0 left-0 bg-red-500 rounded-br-lg p-1">
                        <Text className="text-xs font-bold">🐛</Text>
                      </View>
                    )}
                    {plot.plant.isRotted && (
                      <View className="absolute bottom-0 left-0 bg-brown-500 rounded-br-lg p-1">
                        <Text className="text-xs font-bold">💀</Text>
                      </View>
                    )}
                    {plot.plant.isFertilized && (
                      <View className="absolute bottom-0 right-0 bg-green-500 rounded-tl-lg p-1">
                        <Text className="text-xs">⚡</Text>
                      </View>
                    )}
                    {/* Display Timers */}
                    <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                      {plot.plant.stage < 3 && (
                        <Text className="text-white text-[5px] text-center">
                          Grow: {formatTime(timers.growth[`${rowIndex}-${colIndex}`] / 1000)}
                        </Text>
                      )}
                      {plot.plant.hasInfestation && !plot.plant.isRotted && (
                        <Text className="text-white text-[5px] text-center">
                          Decay: {formatTime(timers.decay[`${rowIndex}-${colIndex}`] / 1000)}
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

      {/* Debug Button - Uncomment to test infestation */}
      {/* <TouchableOpacity 
        onPress={() => testInfestation(0, 0)} 
        className="bg-red-500 p-2 mt-2 rounded-lg"
      >
        <Text className="text-white font-bold">Force Infestation (Plot 0,0)</Text>
      </TouchableOpacity> */}

      {/* Uncomment to see infestation status for debugging */}
      {/* <InfestationDebugOverlay plots={plots} /> */}

      

      {selectedItem && (
        <View className="absolute top-[-5px] right-[300px] bg-white/80 p-2 rounded-lg">
          <Text className="text-sm font-medium">Selected: {selectedItem.title}</Text>
        </View>
      )}
    </View>
  );
};