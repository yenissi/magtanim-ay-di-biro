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
  infestationTimer?: NodeJS.Timeout;
  decayTimer?: NodeJS.Timeout;
  isFertilized: boolean;
};

type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: PlantData;
};

const GROWTH_TIMES = {
  Sibuyas: 100000,
  Mangga: 200000,
  Carrot: 100000,
  Gumamela: 200000
} as const;

const HARVEST_VALUES = {
  Sibuyas: 55,
  Mangga: 60,
  Carrot: 55,
  Gumamela: 80
} as const;

const INFESTATION_CHANCE = 0.9; // 90% chance of infestation
const INFESTATION_CHECK_INTERVAL = 5000; // Check every 5 seconds
const DECAY_TIME = 20000; // 20 seconds to treat infestation before decay
const FERTILIZER_GROWTH_MULTIPLIER = 0.5; // Reduces growth time by 50%

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
  onUseItem
}) => {
  const GRID_SIZE = 3;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [refresh, setRefresh] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

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


  // Save plots state whenever it changes
  useEffect(() => {
    onSavePlotsState(plots);
    console.log('Updated plots state:', JSON.stringify(plots, null, 2));
  }, [plots]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Clean up all infestation and decay timers
      plots.forEach(row => {
        row.forEach(plot => {
          if (plot.plant?.infestationTimer) {
            clearInterval(plot.plant.infestationTimer);
          }
          if (plot.plant?.decayTimer) {
            clearTimeout(plot.plant.decayTimer);
          }
        });
      });
    };
  }, [sound, plots]);

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
      timeoutRef.current = setTimeout(async () => {
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
// Start infestation check for a plant
const startInfestationCheck = (row: number, col: number, plant: PlantData) => {
  // Growth check interval to monitor when plant reaches stage 2
  const growthCheckInterval = setInterval(() => {
    setPlots(current => {
      // Deep clone the current state to ensure proper updates
      const newPlots = JSON.parse(JSON.stringify(current));
      // Check if plant has reached stage 2 and is not already infested
      if (newPlots[row][col].plant?.stage === 2 && 
          newPlots[row][col].plant?.hasInfestation === false) {
        console.log('Plant reached maturity - triggering infestation');
        // Clear the growth check interval
        clearInterval(growthCheckInterval);
        // Set infestation to true
        if (newPlots[row][col].plant) {
          // Clear any existing decay timer
          if (newPlots[row][col].plant.decayTimer) {
            clearTimeout(newPlots[row][col].plant.decayTimer);
          }
          // Apply infestation based on probability
          if (Math.random() <= INFESTATION_CHANCE) {
            newPlots[row][col].plant.hasInfestation = true;
            // Start decay timer
            const decayTimer = setTimeout(() => {
              console.log('Decay timer triggered - destroying plant');
              setPlots(decayState => {
                const decayPlots = JSON.parse(JSON.stringify(decayState));
                decayPlots[row][col] = {
                  isPlowed: false,
                  isWatered: false,
                  plant: undefined
                };
                return decayPlots;
              });
              Alert.alert('Crop Lost!', 'Your crop has rotted due to untreated infestation.');
            }, DECAY_TIME);
            newPlots[row][col].plant.decayTimer = decayTimer;
            // Show infestation alert
            Alert.alert(
              'Insect Infestation!',
              'Your crops are being attacked by insects! Use pesticide quickly!'
            );
          }
        }
        return newPlots;
      }
      // If no changes, return original state
      return current;
    });
  }, 1000);
  
  return growthCheckInterval as unknown as NodeJS.Timeout;
};

  // Growth timer for plants
  useEffect(() => {
    const growthTimer = setInterval(() => {
      setPlots(currentPlots => {
        let updated = false;
        const newPlots = currentPlots.map(row =>
          row.map(plot => {
            if (plot.plant) {
              const now = new Date();
              if (now >= plot.plant.readyAt && plot.plant.stage < 3) {
                updated = true;
                return {
                  ...plot,
                  plant: {
                    ...plot.plant,
                    stage: plot.plant.stage + 1
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
      let harvestValue = HARVEST_VALUES[cropType];
      
      // Double harvest value if fertilized
      if (plot.plant.isFertilized) {
        harvestValue *= 2;
      }
  
      // Create a harvested crop item to add to inventory
      const harvestedCrop: InventoryItem = {
        id: `${cropType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Harvested ${cropType}`,
        type: 'harvestedCrop',
        description: `A freshly harvested ${cropType} ready to be sold.`,
        price: 0,
        sellPrice: harvestValue,
        image: plot.plant.image // Use the same image as the mature plant
      };
      
      // Add harvested crop to inventory
      onAddToInventory(harvestedCrop);
      
      // Update statistics
      onUpdateStatistics({ 
        plantsGrown: 1
      });
      
      Alert.alert(
        'Harvest Success!',
        `${cropType} has been harvested and added to your bag.`
      );
  
      // Clear all timers for the plot
      if (plot.plant.infestationTimer) {
        clearInterval(plot.plant.infestationTimer);
      }
      if (plot.plant.decayTimer) {
        clearTimeout(plot.plant.decayTimer);
      }
  
      setPlots(current => {
        const newPlots = [...current];
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
            newPlots[row][col] = {
              ...plot,
              isPlowed: true
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/plow.mp3'));
        } else {
          Alert.alert("Already Plowed", "This plot has already been plowed.");
        }
        break;
  
      case 'Regadera':
        if (plot.isPlowed && !plot.isWatered) {
          setPlots(current => {
            const newPlots = [...current];
            newPlots[row][col] = {
              ...plot,
              isWatered: true
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/water.mp3'));
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
  
      case 'Pesticide':
        if (plot.plant?.hasInfestation) {
          // Clear decay timer
          if (plot.plant.decayTimer) {
            clearTimeout(plot.plant.decayTimer);
          }
          
          setPlots(current => {
            const newPlots = [...current];
            if (newPlots[row][col].plant) {
              newPlots[row][col].plant = {
                ...newPlots[row][col].plant!,
                hasInfestation: false
              };
            }
            return newPlots;
          });
          
          Alert.alert('Success!', 'The infestation has been treated.');
          playTimedSound(require('@/assets/sound/spray.mp3'));
          
          // Use up the pesticide item
          onUseItem(selectedItem);
        } else if (plot.plant) {
          Alert.alert("No Infestation", "This plant doesn't have an infestation.");
        } else {
          Alert.alert("No Plant", "There is no plant in this plot.");
        }
        break;
  
      case 'Fertilizer':
        if (plot.plant && !plot.plant.isFertilized) {
          setPlots(current => {
            const newPlots = [...current];
            if (newPlots[row][col].plant) {
              const currentTime = new Date();
              const remainingTime = plot.plant.readyAt.getTime() - currentTime.getTime();
              const newReadyAt = new Date(
                currentTime.getTime() + (remainingTime * FERTILIZER_GROWTH_MULTIPLIER)
              );
              
              newPlots[row][col].plant = {
                ...newPlots[row][col].plant!,
                isFertilized: true,
                readyAt: newReadyAt
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
            newPlots[row][col] = {
              ...plot,
              plant: newPlant
            };
            
            // Start infestation check for the new plant
            newPlots[row][col].plant!.infestationTimer = startInfestationCheck(row, col, newPlant);
            
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/plant.mp3'));
          
          // Only remove seed from inventory AFTER successful planting
          onUseItem(selectedItem);
        }
        break;
    }
  };

  const getPlantImage = (plant: PlantData) => {
    console.log(`Plant infestation status: ${plant.hasInfestation}`);
    if (plant.hasInfestation == true) {
      return require('@/assets/images/infested.png'); 
      console.log(`🐛 Infestation detected! Showing pest image.`);
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
      // Skip if no plant or plant is not mature
      if (!current[row][col].plant || current[row][col].plant.stage !== 2) {
        Alert.alert('Test Failed', 'Plant must be at stage 2 to test infestation');
        return current;
      }
  
      // Create a deep copy to ensure state update
      const newPlots = JSON.parse(JSON.stringify(current));
      
      // Set infestation flag
      newPlots[row][col].plant.hasInfestation = true;
      
      console.log('TEST: Setting infestation to true for plant at:', row, col);
      console.log('Plant infestation state:', newPlots[row][col].plant.hasInfestation);
      
      // Start decay timer
      const decayTimer = setTimeout(() => {
        setPlots(decayState => {
          const decayPlots = [...decayState];
          decayPlots[row][col] = {
            isPlowed: false,
            isWatered: false,
            plant: undefined
          };
          return decayPlots;
        });
        Alert.alert('Crop Lost!', 'Your crop has rotted due to untreated infestation.');
      }, DECAY_TIME);
      
      // Store the decay timer
      newPlots[row][col].plant.decayTimer = decayTimer;
      
      Alert.alert('Test Infestation', 'Infestation has been manually added to this plant');
      
      return newPlots;
    });
    triggerRefresh();
  };

  return (
    <View className="absolute bottom-32 left-8">
      <View className="flex-row gap-2">
        {plots.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-col gap-2">
            {row.map((plot, colIndex) => (
              // Modify the TouchableOpacity part of your render method to ensure the pest icon is shown
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
              style={{
                shadowColor: plot.isWatered ? '#3b82f6' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: plot.isWatered ? 0.5 : 0,
                shadowRadius: 5,
                elevation: plot.isWatered ? 5 : 0,
              }}
            >
              {plot.plant && (
                <View className="w-full h-full items-center justify-center">
                  <Image
                    source={getPlantImage(plot.plant)}
                    className="w-12 h-12"
                    resizeMode="contain"
                  />
                  <TouchableOpacity 
                    onPress={() => testInfestation(0, 0)} 
                    className="absolute top-0 left-0 bg-red-500 p-2 rounded-lg">
                    <Text className="text-white">Test Infestation</Text>
                  </TouchableOpacity>
                  {plot.plant.stage === 3 && (
                    <View className="absolute top-0 right-0 bg-yellow-400 rounded-bl-lg p-1">
                      <Text className="text-xs">✓</Text>
                    </View>
                  )}
                  {/* Debug indicator - always visible */}
                  {/* <View className="absolute bottom-0 left-0 bg-purple-500 rounded-tr-lg p-1">
                    <Text className="text-xs">{plot.plant.hasInfestation ? 'T' : 'F'}</Text>
                  </View> */}
                  {/* Make pest indicator more prominent */}
                  {plot.plant.hasInfestation === true && (
                    <View className="absolute top-0 left-0 bg-red-500 rounded-br-lg p-1">
                      <Text className="text-xs font-bold">🐛</Text>
                    </View>
                  )}
                  {plot.plant.isFertilized && (
                    <View className="absolute bottom-0 right-0 bg-green-500 rounded-tl-lg p-1">
                      <Text className="text-xs">⚡</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {selectedItem && (
        <View className="absolute top-0 right-0 bg-white/80 p-2 rounded-lg">
          <Text className="text-sm font-medium">Selected: {selectedItem.title}</Text>
        </View>
      )}
    </View>
  );
};