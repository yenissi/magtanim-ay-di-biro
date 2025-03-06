import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';

interface DecomposeModalProps {
  visible: boolean;
  onClose: () => void;
  rottedItems: InventoryItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateMoney: (amount: number) => void;
  onAddToInventory: (item: InventoryItem) => void;
//   onUpdateStatistics: (stats: { compostCreated?: number }) => void;
}

export const DecomposeModal: React.FC<DecomposeModalProps> = ({
  visible,
  onClose,
  rottedItems,
  onRemoveItem,
  onUpdateMoney,
  onAddToInventory,
//   onUpdateStatistics
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [compostAmount, setCompostAmount] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const REQUIRED_ITEMS_FOR_FERTILIZER = 3;

  // Calculate potential compost value whenever selected items change
  useEffect(() => {
    const totalValue = selectedItems.reduce((total, itemId) => {
      const item = rottedItems.find(item => item.id === itemId);
      return total + (item ? Math.floor(item.sellPrice * 0.5) : 0);
    }, 0);
    
    setCompostAmount(totalValue);
  }, [selectedItems, rottedItems]);

//   const playSound = async () => {
//     try {
//       if (sound) {
//         await sound.unloadAsync();
//       }
      
//       const { sound: newSound } = await Audio.Sound.createAsync(
//         require('@/assets/sound/compost.mp3'),
//         { shouldPlay: true }
//       );
      
//       setSound(newSound);
      
//       // Unload sound after it plays
//       setTimeout(async () => {
//         if (newSound) {
//           await newSound.unloadAsync();
//           setSound(null);
//         }
//       }, 2000);
//     } catch (error) {
//       console.error('Failed to play sound:', error);
//     }
//   };

  const handleItemPress = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleDecompose = () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one rotted item to compost.');
      return;
    }
    
    if (selectedItems.length < REQUIRED_ITEMS_FOR_FERTILIZER) {
      Alert.alert(
        'Not Enough Items', 
        `You need at least ${REQUIRED_ITEMS_FOR_FERTILIZER} rotted plants to create Organic Fertilizer. You have selected ${selectedItems.length}.`
      );
      return;
    }
    
    // // Play compost sound
    // playSound();
    
    // Add compost value to player money
    onUpdateMoney(compostAmount);
    
    // Create Organic Fertilizer item
    const fertilizerQuantity = Math.floor(selectedItems.length / REQUIRED_ITEMS_FOR_FERTILIZER);
    
    if (fertilizerQuantity > 0) {
      // Create Organic Fertilizer item
      const organicFertilizer: InventoryItem = {
        id: `fertilizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Organic Fertilizer',
        type: 'tool',
        description: 'Natural fertilizer made from composted plants. Doubles harvest value and speeds up growth.',
        price: 100, // Default price if ever needed
        sellPrice: 200, // If player wants to sell it
        image: require('@/assets/images/fertilizer.png') // Assuming you have this image
      };
      
      // Add fertilizer to inventory
      for (let i = 0; i < fertilizerQuantity; i++) {
        onAddToInventory(organicFertilizer);
      }
      
      // Update statistics
    //   onUpdateStatistics({ compostCreated: selectedItems.length });
      
      // Remove items from inventory
      selectedItems.forEach(itemId => {
        onRemoveItem(itemId);
      });
      
      // Reset selected items
      setSelectedItems([]);
      
      Alert.alert(
        'Composting Complete!',
        `You've converted ${selectedItems.length} rotted items into ${fertilizerQuantity} Organic Fertilizer${fertilizerQuantity > 1 ? 's' : ''} and earned ${compostAmount} coins.`
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === rottedItems.length) {
      // If all are selected, deselect all
      setSelectedItems([]);
    } else {
      // Otherwise, select all
      setSelectedItems(rottedItems.map(item => item.id));
    }
  };

  const canCreateFertilizer = selectedItems.length >= REQUIRED_ITEMS_FOR_FERTILIZER;
  const fertilizerAmount = Math.floor(selectedItems.length / REQUIRED_ITEMS_FOR_FERTILIZER);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 rounded-xl w-[auto] h-[auto] p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-brown-800">Decompose</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold">✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-base text-gray-700 mb-2">
            Convert your rotted plants into Organic Fertilizer (requires {REQUIRED_ITEMS_FOR_FERTILIZER} rotted plants per organic fertilizer)
          </Text>
          
          {rottedItems.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-lg text-gray-500">Your compost bin is empty</Text>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row justify-between">
                <Text className="font-medium">Rotten Plant/s: {rottedItems.length}</Text>
                <TouchableOpacity onPress={handleSelectAll} className="bg-green-700 px-3 py-1 rounded-lg">
                  <Text className="text-white font-medium">
                    {selectedItems.length === rottedItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-600 ">
                  Selected: {selectedItems.length} of {rottedItems.length} items
                </Text>
                {!canCreateFertilizer && selectedItems.length > 0 && (
                  <Text className="text-sm text-red-600">
                    Need {REQUIRED_ITEMS_FOR_FERTILIZER - selectedItems.length} more items to create fertilizer
                  </Text>
                )}
              
              <FlatList
                data={rottedItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleItemPress(item.id)}
                    className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                      selectedItems.includes(item.id) 
                        ? 'bg-green-200 border-green-500' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Image 
                      source={item.image} 
                      className="w-12 h-12 mr-3" 
                      resizeMode="contain"
                    />
                    <View className="flex-1">
                      <Text className="font-medium">{item.title}</Text>
                      <Text className="text-sm text-gray-600">{item.description}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-amber-700 font-medium mr-1">
                        {Math.floor(item.sellPrice * 0.5)}
                      </Text>
                      <Image 
                        source={require('@/assets/images/coin.png')} 
                        className="w-4 h-4" 
                      />
                    </View>
                  </TouchableOpacity>
                )}
                className="flex-1"
              />
              
              <View className="p-1 mt-2 justify-between items-center gap-3 flex-row ">
                <View className='flex-row mt-6 gap-4 items-center'>
                    {/* <View className="flex-row items-center">
                    <Text className="text-lg font-medium">Compost Value:</Text>
                        <View className="flex-row items-center">
                            <Text className="text-xl font-bold text-amber-700 mr-1"> {compostAmount}</Text>
                            <Image 
                            source={require('@/assets/images/coin.png')} 
                            className="w-5 h-5" 
                            />
                        </View>
                    </View> */}
                    <View className="flex-row  items-center">
                        <Text className="text-lg font-medium">Fertilizer to Create:</Text>
                        <View className="flex-row items-center">
                            <Text className="text-xl font-bold text-green-700 mr-1"> {fertilizerAmount}</Text>
                            <Image 
                            source={require('@/assets/images/fertilizer.png')} 
                            className="w-5 h-5" 
                            />
                        </View>
                    </View>
                </View>


                <TouchableOpacity
                    onPress={handleDecompose}
                    disabled={selectedItems.length === 0}
                    className={`p-3 rounded-lg mt-3 ${
                    selectedItems.length >= REQUIRED_ITEMS_FOR_FERTILIZER ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                >
                    <Text className="text-white text-center font-bold text-lg">
                    Convert to Fertilizer
                    </Text>
              </TouchableOpacity>

              </View>
              
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};