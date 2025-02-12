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
  image: number; // More specific type for React Native image resource
};

type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: PlantData;
};

const GROWTH_TIMES = {
  Sibuyas: 30000,
  Mangga: 60000,
  Carrot: 45000,
  Gumamela: 20000
} as const;

const HARVEST_VALUES = {
  Sibuyas: 75,
  Mangga: 100,
  Carrot: 85,
  Gumamela: 80
} as const;

interface TanimanProps {
  inventory: InventoryItem[];
  onUpdateMoney: (amount: number) => void;
  onUpdateStatistics: (stats: { plantsGrown?: number, moneyEarned?: number }) => void;
  selectedItem: InventoryItem | null;
  userMoney: number;
}

export const Taniman: React.FC<TanimanProps> = ({ 
  inventory, 
  onUpdateMoney,
  onUpdateStatistics,
  selectedItem,
  userMoney
}) => {
  const GRID_SIZE = 3;
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [plots, setPlots] = useState<PlotStatus[][]>(
    Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({
        isPlowed: false,
        isWatered: false,
        plant: undefined
      }))
    )
  );

  // Cleanup sound and timeout when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sound]);

  const playTimedSound = async (soundFile: number) => {
    try {
      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        positionMillis: 0,
        durationMillis: 2000,
      });
      
      setSound(newSound);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        try {
          if (newSound) {
            await newSound.stopAsync();
            await newSound.unloadAsync();
            setSound(null);
          }
        } catch (error) {
          console.error('Error stopping sound:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to play sound:', error);
    }
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
      const harvestValue = HARVEST_VALUES[cropType];
      const newMoney = userMoney + harvestValue;
      
      onUpdateMoney(harvestValue);
      onUpdateStatistics({ 
        plantsGrown: 1, 
        moneyEarned: harvestValue 
      });
      
      Alert.alert(
        'Harvest Success!',
        `You earned ₱${harvestValue}\nNew balance: ₱${newMoney}`
      );

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
        }
        break;

      case 'Itak':
        handleHarvest(row, col, plot);
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
            image: selectedItem.image
          };

          setPlots(current => {
            const newPlots = [...current];
            newPlots[row][col] = {
              ...plot,
              plant: newPlant
            };
            return newPlots;
          });
          playTimedSound(require('@/assets/sound/plant.mp3'));
        }
        break;
    }
  };

  const getPlantImage = (plant: PlantData) => {
    switch (plant.stage) {
      case 0:
        return require('@/assets/images/seeds.png');
      case 1:
        return require('@/assets/images/sprout.png');
      case 2:
        return plant.image;
      default: 
        return plant.image;
    }
  };

  return (
    <View className="absolute bottom-32 left-8">
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
                    {plot.plant.stage === 3 && (
                      <View className="absolute top-0 right-0 bg-yellow-400 rounded-bl-lg p-1">
                        <Text className="text-xs">✓</Text>
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