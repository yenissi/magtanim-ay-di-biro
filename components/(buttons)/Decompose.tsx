import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';
import { Firebase_Database, Firebase_Auth } from '@/firebaseConfig';
import { ref, push, set, get, update, serverTimestamp, onValue, off } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DecomposeModalProps {
  visible: boolean;
  onClose: () => void;
  rottedItems: InventoryItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateMoney: (amount: number) => void;
  onAddToInventory: (item: InventoryItem) => void;
  onLoadRottedItems?: (items: InventoryItem[]) => void;
  decomposedItems: InventoryItem[];
}

export const DecomposeModal: React.FC<DecomposeModalProps> = ({
  visible,
  onClose,
  rottedItems,
  onRemoveItem,
  onUpdateMoney,
  onAddToInventory,
  onLoadRottedItems,
  decomposedItems,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [compostAmount, setCompostAmount] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [statistics, setStatistics] = useState({ rottedHarvested: 0 });
  const REQUIRED_ITEMS_FOR_FERTILIZER = 3;

  // Load rotted items from AsyncStorage when the component mounts
  useEffect(() => {
    const loadRottedItems = async () => {
      try {
        const existingRottedItems = await AsyncStorage.getItem('rottedItems');
        if (existingRottedItems) {
          const rottedItems = JSON.parse(existingRottedItems);
          if (onLoadRottedItems) {
            onLoadRottedItems(rottedItems);
          }
        }
      } catch (error) {
        console.error('Error loading rotted items from AsyncStorage:', error);
      }
    };

    loadRottedItems();
  }, []);

  // Load rotted items and statistics from the database when the component mounts
  useEffect(() => {
    const loadRottedItemsAndStatistics = async () => {
      try {
        const userId = Firebase_Auth.currentUser?.uid;
        if (!userId) return;

        // Load rotted items
        const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems`);
        const rottedItemsSnapshot = await get(rottedItemsRef);
        if (rottedItemsSnapshot.exists() && onLoadRottedItems) {
          const items = Object.values(rottedItemsSnapshot.val()) as InventoryItem[];
          onLoadRottedItems(items);
        }

        // Load statistics
        const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
        const statsSnapshot = await get(userStatsRef);
        const currentStats = statsSnapshot.val() || { rottedHarvested: 0 };
        setStatistics(currentStats);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadRottedItemsAndStatistics();

    // Set up real-time listener for rotted items
    const setupRottedItemsListener = () => {
      const userId = Firebase_Auth.currentUser?.uid;
      if (!userId) return;

      const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems`);
      onValue(rottedItemsRef, (snapshot) => {
        if (snapshot.exists() && onLoadRottedItems) {
          const items = Object.values(snapshot.val()) as InventoryItem[];
          onLoadRottedItems(items);
        }
      });
    };

    setupRottedItemsListener();

    // Clean up listener when the component unmounts
    return () => {
      const userId = Firebase_Auth.currentUser?.uid;
      if (userId) {
        const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems`);
        off(rottedItemsRef);
      }
    };
  }, [onLoadRottedItems]);

  // Calculate potential compost value whenever selected items change
  useEffect(() => {
    const totalValue = selectedItems.reduce((total, itemId) => {
      const item = rottedItems.find((item) => item.id === itemId);
      return total + (item ? Math.floor(item.sellPrice * 0.5) : 0);
    }, 0);

    setCompostAmount(totalValue);
  }, [selectedItems, rottedItems]);

  const handleItemPress = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Handle a plant becoming rotted
  const handlePlantRot = async (plant: InventoryItem) => {
    try {
      // Create a rotted version of the plant
      const rottedPlant: InventoryItem = {
        ...plant,
        id: `rotted-${plant.id}-${Date.now()}`,
        title: `Rotted ${plant.title}`,
        description: `A rotted ${plant.title} that can be composted.`,
        sellPrice: Math.floor(plant.sellPrice * 0.5),
      };
  
      // Save the rotted plant to the database
      await saveRottedItem(rottedPlant);
  
      // Update the "Rotted Harvested" statistic in the database
      const userId = Firebase_Auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');
  
      const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
      const statsSnapshot = await get(userStatsRef);
      const currentStats = statsSnapshot.val() || { rottedHarvested: 0 };
  
      const updatedStats = {
        rottedHarvested: (currentStats.rottedHarvested || 0) + 1,
      };
  
      // Log the current stats before updating
      console.log('Current Stats Before Update:', currentStats);
  
      // Update the statistics in Firebase
      await update(userStatsRef, updatedStats);
  
      // Log the updated stats after updating
      console.log('Updated Stats After Update:', updatedStats);
  
      // Update local state
      setStatistics(updatedStats);
  
      console.log(`Plant ${plant.title} has rotted and been added to compost bin`);
  
      // Update local state through callback
      if (onLoadRottedItems) {
        const updatedItems = await fetchRottedItems();
        onLoadRottedItems(updatedItems);
      }
    } catch (error) {
      console.error('Error handling plant rot:', error);
    }
  };
  const handleDecompose = async () => {
    if (selectedItems.length < REQUIRED_ITEMS_FOR_FERTILIZER) {
      Alert.alert(
        'Not Enough Items',
        `You need at least ${REQUIRED_ITEMS_FOR_FERTILIZER} rotted plants to create fertilizer.`
      );
      return;
    }
  
    try {
      // Remove selected items from AsyncStorage
      const existingRottedItems = await AsyncStorage.getItem('rottedItems');
      if (existingRottedItems) {
        const rottedItems = JSON.parse(existingRottedItems);
        const updatedRottedItems = rottedItems.filter(
          (item: InventoryItem) => !selectedItems.includes(item.id)
        );
        await AsyncStorage.setItem('rottedItems', JSON.stringify(updatedRottedItems));
      }
  
      // Add fertilizer to inventory
      const organicFertilizer: InventoryItem = {
        id: `fertilizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Organic Fertilizer',
        type: 'tool',
        description: 'Doubles harvest value and speeds up growth.',
        price: 100,
        sellPrice: 200,
        image: require('@/assets/images/fertilizer.png'),
      };
      onAddToInventory(organicFertilizer);
  
      // Remove selected items from local state
      selectedItems.forEach(onRemoveItem);
      setSelectedItems([]);
  
      Alert.alert(
        'Composting Complete!',
        `Converted ${selectedItems.length} rotted items into fertilizer.`
      );
    } catch (error) {
      console.error('Error during decomposition:', error);
      Alert.alert('Error', 'Failed to decompose items. Please try again.');
    }
  };

  const removeRottedItems = async (itemIds: string[]) => {
    try {
      const userId = Firebase_Auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const updates = {};
      itemIds.forEach((itemId) => {
        updates[`users/${userId}/statistics/${itemId}`] = null; // Remove from DB
      });

      await update(ref(Firebase_Database), updates);
      console.log('Rotted items removed from database!');
    } catch (error) {
      console.error('Error removing rotted items:', error);
      throw error;
    }
  };

  const fetchRottedItems = async (): Promise<InventoryItem[]> => {
    try {
      const userId = Firebase_Auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const rottedItemsRef = ref(Firebase_Database, `users/${userId}/statistics`);
      const snapshot = await get(rottedItemsRef);

      if (snapshot.exists()) {
        return Object.values(snapshot.val()) as InventoryItem[];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching rotted items:', error);
      return [];
    }
  };

  const saveRottedItem = async (item: InventoryItem) => {
    try {
      const userId = Firebase_Auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const rottedItemsRef = ref(Firebase_Database, `users/${userId}/statistics/${item.id}`);
      await set(rottedItemsRef, item);

      console.log('Rotted item saved successfully to database!');
      return true;
    } catch (error) {
      console.error('Error saving rotted item:', error);
      return false;
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === rottedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(rottedItems.map((item) => item.id));
    }
  };

  const canCreateFertilizer = selectedItems.length >= REQUIRED_ITEMS_FOR_FERTILIZER;
  const fertilizerAmount = Math.floor(selectedItems.length / REQUIRED_ITEMS_FOR_FERTILIZER);

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 rounded-xl w-[auto] h-[auto] p-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-brown-800">Decompose</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-base text-gray-700 mb-2">
            Convert your rotted plants into Organic Fertilizer (requires{' '}
            {REQUIRED_ITEMS_FOR_FERTILIZER} rotted plants per organic fertilizer)
          </Text>

          {rottedItems.length === 0 ? (
            <View className="flex-1 justify-center items-center p-8">
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
              <Text className="text-sm text-gray-600">
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
                    <Image source={item.image} className="w-12 h-12 mr-3" resizeMode="contain" />
                    <View className="flex-1">
                      <Text className="font-medium">{item.title}</Text>
                      <Text className="text-sm text-gray-600">{item.description}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-amber-700 font-medium mr-1">
                        {Math.floor(item.sellPrice * 0.5)}
                      </Text>
                      <Image source={require('@/assets/images/coin.png')} className="w-4 h-4" />
                    </View>
                  </TouchableOpacity>
                )}
                className="flex-1"
              />

              <View className="p-1 mt-2 justify-between items-center gap-3 flex-row">
                <View className="flex-row mt-6 gap-4 items-center">
                  <View className="flex-row items-center">
                    <Text className="text-lg font-medium">Fertilizer to Create:</Text>
                    <View className="flex-row items-center">
                      <Text className="text-xl font-bold text-green-700 mr-1">{fertilizerAmount}</Text>
                      <Image source={require('@/assets/images/fertilizer.png')} className="w-5 h-5" />
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
                  <Text className="text-white text-center font-bold text-lg">Convert to Fertilizer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};