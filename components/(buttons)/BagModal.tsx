// components/game/BagModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { InventoryItem } from '@/types';

interface BagModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
}

export const BagModal = ({ visible, onClose, inventory }: BagModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-11/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Inventory</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-96">
            {inventory.length === 0 ? (
              <Text className="text-center text-gray-600">Your bag is empty</Text>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                {inventory.map((item, index) => (
                  <View key={`${item.id}-${index}`} className="bg-yellow-200 rounded-lg p-3 w-40">
                    <Text className="font-bold mb-2">{item.title}</Text>
                    <Text className="text-gray-600">{item.description}</Text>
                    <View className='flex-row items-center gap-1 mt-2'>
                      <TouchableOpacity
                        className=" text-white rounded-lg bg-green-400 p-2 w-[100%]"
                        onPress={() => console.log(`Clicked on item ${item.title}`)}
                      >
                        <Text className='text-sm font-medium text-center'>Use</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};