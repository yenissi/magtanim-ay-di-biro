import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, Image, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { getDatabase, ref, update, get } from 'firebase/database';
import { SHOP_ITEMS } from '@/config/gameConfig';

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
  uid: string;
  userMoney: number;
  onPurchase: () => void;
}

interface FlipCardProps {
  item: any;
  onPurchase: (itemId: number, price: number) => void;
}

const FlipCard = ({ item, onPurchase }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = React.useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }]
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }]
  };

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleBuyPress = (event: any) => {
    event.stopPropagation();
    onPurchase(item.id, item.price);
  };

  const handleInfoPress = (event: any) => {
    event.stopPropagation();
    flipCard();
  };

  const handleBackPress = (event: any) => {
    event.stopPropagation();
    flipCard();
  };

  return (
    <View className="w-40 h-[200px]">
      <Animated.View 
        style={[
          { 
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
          frontAnimatedStyle
        ]}
        className="bg-yellow-200 rounded-lg p-4"
      >
        {item.image && (
          <Image 
            source={item.image} 
            className="w-16 h-16 self-center mb-2" 
            resizeMode="contain" 
          />
        )}
        <Text className="font-bold mb-2 text-[16px]">{item.title}</Text>
        <Text className="text-green-600 font-bold mb-4 text-[13px]">₱ {item.price}.00</Text>
        <View className='flex-row items-center gap-3'>
          <TouchableOpacity 
            className="bg-green-400 rounded-lg p-2 w-20 items-center"
            onPress={() => {
              onPurchase(item.id, item.price);
            }}>
            <Text className="font-bold">Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className='p-1 rounded-lg bg-blue-300 items-center'
            onPress={flipCard}>
            <AntDesign name='info' size={24} color="black" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          {
            backfaceVisibility: 'hidden',
            position: 'absolute',
            width: '100%',
          },
          backAnimatedStyle
        ]}
>
        <Text className="font-bold mb-2 text-[16px]">Description</Text>
        <Text className="text-gray-600 mb-4 text-sm">{item.description}</Text>
        <TouchableOpacity 
          className="bg-blue-400 rounded-lg p-2 items-center mt-auto"
          onPress={flipCard}
        >
          <Text className="font-bold">Back</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const TABS = ['All', 'Tool', 'Crop', 'Tree'];

export const ShopModal = ({ visible, onClose, uid, userMoney, onPurchase }: ShopModalProps) => {

  const [selectedTab, setSelectedTab] = useState('All');

  const displayItems = selectedTab === 'All' 
  ? SHOP_ITEMS 
  : SHOP_ITEMS.filter(item => item.type.toLowerCase() === selectedTab.toLowerCase());

    const handlePurchase = async (itemId: number, price: number) => {
      if (userMoney < price) {
        Alert.alert("Insufficient Funds", "You don't have enough money for this purchase.");
        return;
      }

      const db = getDatabase();
      const userRef = ref(db, `users/${uid}`);
      
      try {
        const snapshot = await get(userRef);
        if (!snapshot.exists()) return;
    
        const userData = snapshot.val();
        const inventory = Array.isArray(userData.inventory) ? userData.inventory : [];
        
        // Find the item to purchase
        const item = SHOP_ITEMS.find(item => item.id === itemId);
        if (!item) {
          console.log(`Item with ID: ${itemId} not found in SHOP_ITEMS.`);
          return;
        }

        const existingItemIndex = inventory.findIndex(item => item.id === itemId);
    
        let updatedInventory;
        if (existingItemIndex !== -1) {
          // Item exists, increment quantity
          updatedInventory = [...inventory];
          if (!updatedInventory[existingItemIndex].quantity) {
            // If quantity property doesn't exist yet, initialize it to 1
            updatedInventory[existingItemIndex] = {
              ...updatedInventory[existingItemIndex],
              quantity: 1
            };
          }
          updatedInventory[existingItemIndex].quantity += 1;
        } else {
          // Item doesn't exist, add it with quantity 1
          updatedInventory = [...inventory, {...item, quantity: 1}];
        }

    
        await update(userRef, {
          money: userData.money - price,
          inventory: updatedInventory,
        });
        
        Alert.alert("Success", `${item.title} purchased successfully!`);
        onPurchase();
      } catch (error) {
        console.error("Purchase error:", error);
        Alert.alert("Error", "Failed to complete purchase. Please try again.");
      }
    };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-orange-300 p-5 rounded-t-lg w-11/12 flex-row justify-between items-center">
            <Text className="text-lg font-bold">Shop</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
        <View className="bg-orange-300 p-5 rounded-b-lg w-11/12 flex-row">

          {/* Tabs on the Left Side */}
          <View className="mr-2 w-1/5">
            {TABS.map(tab => (
              <TouchableOpacity 
                key={tab} 
                className={`p-3 mb-2 border border-black rounded-lg ${selectedTab === tab ? 'bg-blue-500' : 'bg-white-300'}`}
                onPress={() => setSelectedTab(tab)}
              >
                <Text className="text-black font-bold text-center">{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Filtered Items */}
          <ScrollView horizontal>
            <View className="flex-row gap-4">
              {displayItems.map((item) => (
                <FlipCard key={item.id} item={item} onPurchase={handlePurchase} />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};