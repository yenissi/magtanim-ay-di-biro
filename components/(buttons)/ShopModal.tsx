// components/game/ShopModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert,Image } from 'react-native';
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

export const ShopModal = ({ visible, onClose, uid, userMoney, onPurchase }: ShopModalProps) => {
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
      const inventory = userData.inventory || [];

      await update(userRef, {
        money: userData.money - price,
        inventory: [...inventory, SHOP_ITEMS.find(item => item.id === itemId)],
      });

      Alert.alert("Success", "Item purchased successfully!");
      onPurchase();
    } catch (error) {
      Alert.alert("Error", "Failed to complete purchase. Please try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-11/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Shop</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal>
            <View className="flex-row gap-4">
              {SHOP_ITEMS.map((item) => (
                <View key={item.id} className="bg-yellow-200 rounded-lg p-4 w-40 h-[220px]">
                  {item.image && (
                    <Image 
                      source={item.image} 
                      className="w-16 h-16 self-center mb-2" 
                      resizeMode="contain" 
                    />
                  )}
                  <Text className="font-bold mb-2">{item.title}</Text>
                  <Text className="text-gray-600 mb-2 text-sm">{item.description}</Text>
                  <Text className="text-green-600 font-bold mb-4 text-sm">₱{item.price}.00</Text>
                    <View className='flex-row items-center gap-2'>
                      {/* Button to purchase item */}
                      <TouchableOpacity className="bg-green-400 rounded-lg p-2 w-20 items-center"
                        onPress={() => handlePurchase(item.id, item.price)}>
                        <Text className="font-bold">Buy</Text>
                      </TouchableOpacity>
                      {/* Informations in Items */}
                      <TouchableOpacity className='p-1 rounded-lg bg-blue-300 items-center'>
                        <AntDesign name='info' size={24} color={ "black"} />
                      </TouchableOpacity>
                    </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};