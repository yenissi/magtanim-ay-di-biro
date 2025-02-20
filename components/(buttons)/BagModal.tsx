import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { InventoryItem } from '@/types';

interface BagModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onSelectItem: (item: InventoryItem | null) => void;
  selectedItem: InventoryItem | null;
}

export const BagModal = ({ 
  visible, 
  onClose, 
  inventory,
  onSelectItem,
  selectedItem 
}: BagModalProps) => {
  console.log('BagModal Render - Current inventory:', inventory);
  console.log('BagModal Render - Selected item:', selectedItem);

  const handleItemSelect = (item: InventoryItem) => {
    console.log('Item selected:', item.title);
    if (selectedItem?.id === item.id) {
      console.log('Unselecting item');
      onSelectItem(null);
    } else {
      console.log('Selecting new item');
      onSelectItem(item);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-11/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Bag</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal className="max-h-96">
            {inventory.length === 0 ? (
              <Text className="text-center text-gray-600">Your bag is empty</Text>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                {inventory.map((item, index) => (
                  <View 
                    key={`${item.id}-${index}`} 
                    className={`rounded-lg p-3 w-40 ${
                      selectedItem?.id === item.id 
                        ? 'bg-yellow-300 border-2 border-amber-500' 
                        : 'bg-yellow-200'
                    }`}
                  >
                    <View className="items-center mb-2">
                      <Image 
                        source={item.image} 
                        className="w-16 h-16"
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="font-bold mb-1 text-center">{item.title}</Text>
                    <Text className="text-gray-600 text-center text-sm mb-2">{item.description}</Text>
                    <View className="flex-row items-center gap-1">
                      <TouchableOpacity
                        className={`rounded-lg p-2 w-full ${
                          selectedItem?.id === item.id 
                            ? 'bg-red-400' 
                            : 'bg-green-400'
                        }`}
                        onPress={() => handleItemSelect(item)}
                      >
                        <Text className="text-sm font-medium text-center text-white">
                          {selectedItem?.id === item.id ? 'Unselect' : 'Use'}
                        </Text>
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