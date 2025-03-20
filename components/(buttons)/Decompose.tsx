import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { InventoryItem } from '@/types';
import { Firebase_Database, Firebase_Auth } from '@/firebaseConfig';
import { ref, push, set, get, update, serverTimestamp, onValue, off } from 'firebase/database';

interface DecomposeModalProps {
  visible: boolean;
  onClose: () => void;
  rottedItems: InventoryItem[];
  normalItems: InventoryItem[]; 
  onRemoveItem: (itemId: string) => void;
  onUpdateMoney: (amount: number) => void;
  onAddToInventory: (item: InventoryItem) => void;
  onLoadRottedItems?: (items: InventoryItem[]) => void;
  onLoadNormalItems?: (items: InventoryItem[]) => void;
  decomposedItems: InventoryItem[];
  inventory?: InventoryItem[]; // Add this line
  onLoadInventory?: (items: InventoryItem[]) => void;
  verifyInventory?: () => Promise<void>;
}

export const DecomposeModal: React.FC<DecomposeModalProps> = ({
  visible,
  onClose,
  rottedItems = [],
  normalItems = [],
  onRemoveItem,
  onUpdateMoney,
  onAddToInventory,
  onLoadRottedItems,
  onLoadNormalItems,
  onLoadInventory,
  verifyInventory,
  decomposedItems,
}) => {
  const [selectedRottedItems, setSelectedRottedItems] = useState<string[]>([]);
  const [selectedNormalItems, setSelectedNormalItems] = useState<string[]>([]);
  const [compostAmount, setCompostAmount] = useState(0);
  const [sellAmount, setSellAmount] = useState(0);
  const [statistics, setStatistics] = useState({ 
    rottedHarvested: 0,
    normalHarvested: 0,
    itemsSold: 0
  });
  const REQUIRED_ITEMS_FOR_FERTILIZER = 3;
  const [activeTab, setActiveTab] = useState<'rotted' | 'normal'>('rotted');
  const [isUserSignedIn, setIsUserSignedIn] = useState(false);

  // Check if user is signed in
  useEffect(() => {
    const checkAuth = () => {
      const userId = Firebase_Auth.currentUser?.uid;
      setIsUserSignedIn(!!userId);
    };
    
    checkAuth();
    
    // Set up auth state listener
    const unsubscribe = Firebase_Auth.onAuthStateChanged((user) => {
      setIsUserSignedIn(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  // Load items from Firebase and set up listeners
  useEffect(() => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId) {
      console.log('User not signed in. Items will not persist between sessions.');
      if (onLoadRottedItems) onLoadRottedItems([]);
      if (onLoadNormalItems) onLoadNormalItems([]);
      if (onLoadInventory) onLoadInventory([]); 
      return; // Early return if user is not signed in
    }

    // Load statistics
    const loadStatistics = async () => {
      try {
        const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
        const statsSnapshot = await get(userStatsRef);
        const currentStats = statsSnapshot.val() || { 
          rottedHarvested: 0,
          normalHarvested: 0,
          itemsSold: 0 
        };
        setStatistics(currentStats);
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    };
    
    loadStatistics();
    
    // Set up ONLY real-time listeners for Firebase changes
    const rottedItemsRef = ref(Firebase_Database, `users/${userId}/rottedItems`);
    const normalItemsRef = ref(Firebase_Database, `users/${userId}/normalItems`);
    const inventoryRef = ref(Firebase_Database, `users/${userId}/inventory`); 
    
    // Listen for rotted items changes
    const rottedListener = onValue(rottedItemsRef, (snapshot) => {
      if (snapshot.exists() && onLoadRottedItems) {
        const items = Object.values(snapshot.val()) as InventoryItem[];
        onLoadRottedItems(items);
        console.log('Updated rotted items from Firebase:', items.length);
      } else if (onLoadRottedItems) {
        onLoadRottedItems([]);
      }
    });
    
    // Listen for normal items changes
    const normalListener = onValue(normalItemsRef, (snapshot) => {
      if (snapshot.exists() && onLoadNormalItems) {
        const items = Object.values(snapshot.val()) as InventoryItem[];
        onLoadNormalItems(items);
        console.log('Updated normal items from Firebase:', items.length);
      } else if (onLoadNormalItems) {
        onLoadNormalItems([]);
      }
    });

    const inventoryListener = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists() && onLoadInventory) {
        const items = Object.values(snapshot.val()) as InventoryItem[];
        onLoadInventory(items);
        console.log('Updated inventory from Firebase:', items.length);
      } else if (onLoadInventory) {
        onLoadInventory([]);
      }
    });
    
    // Clean up listeners when component unmounts
    return () => {
      off(rottedItemsRef);
    off(normalItemsRef);
    off(inventoryRef);
    };
  }, []);

  // Calculate potential compost value whenever selected rotted items change
  useEffect(() => {
    const totalValue = selectedRottedItems.reduce((total, itemId) => {
      const item = rottedItems.find((item) => item.id === itemId);
      return total + (item ? Math.floor(item.sellPrice * 0.5) : 0);
    }, 0);

    setCompostAmount(totalValue);
  }, [selectedRottedItems, rottedItems]);

  // Calculate potential sell value whenever selected normal items change
  useEffect(() => {
    const totalValue = selectedNormalItems.reduce((total, itemId) => {
      const item = normalItems.find((item) => item.id === itemId);
      return total + (item ? item.sellPrice : 0);
    }, 0);

    setSellAmount(totalValue);
  }, [selectedNormalItems, normalItems]);

  const handleRottedItemPress = (itemId: string) => {
    setSelectedRottedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleNormalItemPress = (itemId: string) => {
    setSelectedNormalItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Handle selling normal crops
const handleSellNormalCrops = async () => {
  if (selectedNormalItems.length === 0) {
    Alert.alert('Selection Empty', 'Please select items to sell.');
    return;
  }
  
  try {
    const userId = Firebase_Auth.currentUser?.uid;
    
    // Calculate total sell value
    const totalSellValue = selectedNormalItems.reduce((total, itemId) => {
      const item = normalItems.find((item) => item.id === itemId);
      return total + (item ? item.sellPrice : 0);
    }, 0);
    
    if (userId) {
      // Remove items from Firebase only - let listeners handle local state
      const updates = {};
      selectedNormalItems.forEach((itemId) => {
        updates[`users/${userId}/normalItems/${itemId}`] = null;
      });
      await update(ref(Firebase_Database), updates);
      
      // Update statistics in Firebase
      const userStatsRef = ref(Firebase_Database, `users/${userId}/statistics`);
      const statsSnapshot = await get(userStatsRef);
      const currentStats = statsSnapshot.val() || { 
        rottedHarvested: 0,
        normalHarvested: 0,
        itemsSold: 0,
        moneyEarned: 0 // Make sure this exists
      };
      
      const updatedStats = {
        ...currentStats,
        itemsSold: (currentStats.itemsSold || 0) + selectedNormalItems.length,
        moneyEarned: (currentStats.moneyEarned || 0) + totalSellValue // Add money earned to statistics
      };
      
      await update(userStatsRef, updatedStats);
      
      // Update money in Firebase
      const userMoneyRef = ref(Firebase_Database, `users/${userId}/money`);
      await get(userMoneyRef).then((snapshot) => {
        const currentMoney = snapshot.exists() ? snapshot.val() : 0;
        set(userMoneyRef, currentMoney + totalSellValue);
      });
      
      // Don't call onRemoveItem here - let Firebase listeners handle it
    } else {
      // If no user, update local state directly
      onUpdateMoney(totalSellValue);
      selectedNormalItems.forEach(onRemoveItem);
    }
    
    // Reset selection regardless of auth state
    setSelectedNormalItems([]);
    
    Alert.alert(
      'Sale Complete!',
      `Sold ${selectedNormalItems.length} items for ${totalSellValue} coins.`
    );
  } catch (error) {
    console.error('Error selling items:', error);
    Alert.alert('Error', 'Failed to sell items. Please try again.');
  }
};

  // Handle decomposing rotted crops into fertilizer
  const handleDecompose = async () => {
    if (selectedRottedItems.length < REQUIRED_ITEMS_FOR_FERTILIZER) {
      Alert.alert(
        'Not Enough Items',
        `You need at least ${REQUIRED_ITEMS_FOR_FERTILIZER} rotted plants to create fertilizer.`
      );
      return;
    }
  
    try {
      const userId = Firebase_Auth.currentUser?.uid;
      const fertilizerCount = Math.floor(selectedRottedItems.length / REQUIRED_ITEMS_FOR_FERTILIZER);
      const selectedItemsCount = selectedRottedItems.length;
      
      // Create fertilizer objects first
      const fertilizers = [];
      for (let i = 0; i < fertilizerCount; i++) {
        const randomPart = Math.random().toString(36).substring(2, 11);
        const fertilizerID = `fertilizer-${randomPart}`;
        
        // Make sure this matches your inventory item structure exactly
        const organicFertilizer = {
          id: fertilizerID,
          title: 'Organic Fertilizer',
          type: 'tool',
          description: 'Doubles harvest value and speeds up growth.',
          price: 100,
          sellPrice: 200,
          image: require('@/assets/images/fertilizer.png'),
        };
        fertilizers.push(organicFertilizer);
      }
      
      if (userId) {
        // Remove selected items from Firebase
        const updates = {};
        selectedRottedItems.forEach((itemId) => {
          updates[`users/${userId}/rottedItems/${itemId}`] = null;
        });
        
        // IMPORTANT CHANGE: Use the right path for inventory items
        fertilizers.forEach(fert => {
          // Add to the correct inventory path, not as a nested object
          updates[`users/${userId}/inventory/${fert.id}`] = fert;
        });
        
        // Apply all updates atomically
        await update(ref(Firebase_Database), updates);
        
        // Add each fertilizer independently to make sure they're properly added
        fertilizers.forEach(fert => {
          console.log("Adding fertilizer to inventory:", fert.id);
          onAddToInventory(fert);
        });

        if (verifyInventory) {
          await verifyInventory();
        }
        
      } else {
        // If no user, update local state directly
        selectedRottedItems.forEach(itemId => onRemoveItem(itemId));
        
        // Add fertilizers to local state
        fertilizers.forEach(fert => {
          onAddToInventory(fert);
        });
      }
  
      // Reset selection
      setSelectedRottedItems([]);
  
      Alert.alert(
        'Composting Complete!',
        `Converted ${selectedItemsCount} rotted items into ${fertilizerCount} fertilizer.`
      );
    } catch (error) {
      console.error('Error during decomposition:', error);
      Alert.alert('Error', 'Failed to decompose items. Please try again.');
    }
  };

  const handleSelectAllRotted = () => {
    if (selectedRottedItems.length === rottedItems.length) {
      setSelectedRottedItems([]);
    } else {
      setSelectedRottedItems(rottedItems.map((item) => item.id));
    }
  };

  const handleSelectAllNormal = () => {
    if (selectedNormalItems.length === normalItems.length) {
      setSelectedNormalItems([]);
    } else {
      setSelectedNormalItems(normalItems.map((item) => item.id));
    }
  };

  const canCreateFertilizer = selectedRottedItems.length >= REQUIRED_ITEMS_FOR_FERTILIZER;
  const fertilizerAmount = Math.floor(selectedRottedItems.length / REQUIRED_ITEMS_FOR_FERTILIZER);

  // Function to handle user authentication requirement
  const handleSellWithWarning = () => {
    const userId = Firebase_Auth.currentUser?.uid;
    if (!userId && selectedNormalItems.length > 0) {
      Alert.alert(
        'Warning: Not Signed In',
        'Your progress will not be saved. We recommend signing in first to save your data.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              onClose();
              // Navigate to sign in screen - This function should be passed from parent component
              // onNavigateToSignIn();
            },
          },
          {
            text: 'Continue Anyway',
            onPress: () => handleSellNormalCrops(),
          },
        ]
      );
      return;
    }
    handleSellNormalCrops();
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 rounded-xl w-[100%] max-w-md h-[350px] p-2">
          <View className="flex-row justify-between items-center ">
            <Text className="text-2xl font-bold text-brown-800">Composting Station</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-xl font-bold text-brown-800">✕</Text>
            </TouchableOpacity>
          </View>

          {!isUserSignedIn && (
            <View className="bg-yellow-100 rounded-lg mb-4">
              <Text className="text-sm text-yellow-800">
                ⚠️ Sign in to save your progress and items. Changes will not persist without an account.
              </Text>
              <TouchableOpacity 
                className="bg-blue-500 p-2 rounded mt-2"
                onPress={() => {
                  onClose();
                  // Navigate to sign in screen - This function should be passed from parent
                  // onNavigateToSignIn();
                }}
              >
                <Text className="text-white text-center font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
              <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab('rotted')}
              className={`flex-1 p-2 rounded-tl-lg rounded-bl-lg ${activeTab === 'rotted' ? 'bg-brown-600' : 'bg-brown-400'}`}
            >
              <Text className={`text-center font-semibold ${activeTab === 'rotted' ? 'text-white' : 'text-brown-800'}`}>
                Rotted Plants
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('normal')}
              className={`flex-1 p-2 rounded-tr-lg rounded-br-lg ${activeTab === 'normal' ? 'bg-brown-600' : 'bg-brown-400'}`}
            >
              <Text className={`text-center font-semibold ${activeTab === 'normal' ? 'text-white' : 'text-brown-800'}`}>
                Fresh Crops
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'rotted' ? (
            <View>
              <Text className="text-[10px] mb-1 text-brown-800">
                Convert rotted plants into valuable fertilizer! Select at least {REQUIRED_ITEMS_FOR_FERTILIZER} items.
              </Text>
              
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-brown-800">
                  Rotted Items ({rottedItems.length})
                </Text>
                {/* <TouchableOpacity onPress={handleSelectAllRotted} className="bg-brown-500 px-3 py-1 rounded">
                  <Text className="text-white text-xs">
                    {selectedRottedItems.length === rottedItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity> */}
              </View>

              {rottedItems.length > 0 ? (
                <FlatList
                  data={rottedItems}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  className="h-[155px]"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleRottedItemPress(item.id)}
                      className={`p-2 m-1 items-center border border-black rounded-lg ${
                        selectedRottedItems.includes(item.id) ? 'bg-green-300 rounded-lg' : ''
                      }`}
                    >
                      <Image source={item.image} style={{ width: 40, height: 40 }} />
                      <Text className="text-xs text-center text-brown-800 mt-1">{item.title}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-center py-4 text-brown-800">No rotted items available.</Text>
                  }
                />
              ) : (
                <Text className="text-center py-4 text-brown-800">No rotted items available.</Text>
              )}

              <TouchableOpacity
                onPress={handleDecompose}
                disabled={!canCreateFertilizer}
                className={`p-3 rounded-lg ${
                  canCreateFertilizer ? 'bg-green-600' : 'bg-gray-400'
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {canCreateFertilizer 
                    ? `Create ${fertilizerAmount} Fertilizer` 
                    : `Need ${REQUIRED_ITEMS_FOR_FERTILIZER - selectedRottedItems.length} More Items`}
                </Text>
              </TouchableOpacity>
              
              {!isUserSignedIn && canCreateFertilizer && (
                <Text className="text-xs text-center text-yellow-800 mt-2">
                  Warning: Not signed in. Your fertilizer may not be saved.
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text className="text-[10px] mb-2 text-brown-800">
                Sell your fresh crops for coins. Select the items you want to sell.
              </Text>
              
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-brown-800">
                  Fresh Crops ({normalItems.length})
                </Text>
                {/* <TouchableOpacity onPress={handleSelectAllNormal} className="bg-brown-500 px-3 py-1 rounded">
                  <Text className="text-white text-xs">
                    {selectedNormalItems.length === normalItems.length ? 'Deselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity> */}
              </View>

              {normalItems.length > 0 ? (
                <FlatList
                  data={normalItems}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  className="h-[155px]"
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleNormalItemPress(item.id)}
                      className={`p-2 m-1 items-center border border-black rounded-lg ${
                        selectedNormalItems.includes(item.id) ? 'bg-green-300 rounded-lg' : ''
                      }`}
                    >
                      <Image source={item.image} style={{ width: 40, height: 40 }} />
                      <Text className="text-xs text-center text-brown-800 mt-1">{item.title}</Text>
                      <Text className="text-xs text-center text-green-700">{item.sellPrice} coins</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text className="text-center py-4 text-brown-800">No fresh crops available.</Text>
                  }
                />
              ) : (
                <Text className="text-center py-4 text-brown-800">No fresh crops available.</Text>
              )}

              <TouchableOpacity
                onPress={handleSellWithWarning}
                disabled={selectedNormalItems.length === 0}
                className={` p-3 rounded-lg ${
                  selectedNormalItems.length > 0 ? 'bg-green-600' : 'bg-gray-400'
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {selectedNormalItems.length > 0 
                    ? `Sell Crops (${sellAmount} coins)` 
                    : 'Select Items to Sell'}
                </Text>
              </TouchableOpacity>
              
              {/* Additional warning text for non-signed in users */}
              {!isUserSignedIn && selectedNormalItems.length > 0 && (
                <Text className="text-xs text-center text-yellow-800 mt-2">
                  Warning: Not signed in. Your earnings may not be saved.
                </Text>
              )}
              
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};