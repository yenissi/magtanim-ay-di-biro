import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { InventoryItem } from '@/types';

type PlotStatus = {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: any;
};

interface BagModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onSelectItem: (item: InventoryItem | null) => void;
  selectedItem: InventoryItem | null;
  onSellItem: (item: InventoryItem) => void;
  onUseItem: (item: InventoryItem) => void;
  onRemoveItem: (itemId: string) => void;
  plots: PlotStatus[][];
  onAddToInventory: (item: InventoryItem) => void;
}

export const BagModal = ({
  visible,
  onClose,
  inventory = [],
  onSelectItem,
  selectedItem,
  onSellItem,
  onUseItem,
  onRemoveItem,
  plots,
  onAddToInventory
}: BagModalProps) => {
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  useEffect(() => {
    if (Array.isArray(inventory) && inventory.length > 0) {
      console.log('', inventory.map(item => ({
        title: item.title,
      })));
    }
  }, [inventory]);

  const handleSellItem = (item: InventoryItem) => {
    if (item.title === 'Itak' || item.title === '') {
      Alert.alert("Cannot Sell", "This essential tool cannot be sold.");
      return;
    }

    const sellQuantity = item.quantity && item.quantity > 1 ? 1 : 1;
    const totalPrice = (item.sellPrice || 0) * sellQuantity;

    Alert.alert(
      "Sell Item",
      `Are you sure you want to sell ${sellQuantity} ${item.title} for ${totalPrice} coins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sell",
          onPress: () => {
            onSellItem(item);
            if (selectedItem?.id === item.id) {
              onSelectItem(null);
            }
          }
        }
      ]
    );
  };

  const handleToggleSelect = (item: InventoryItem) => {
    if (selectedItem?.id === item.id) {
      // If the item is already selected, unselect it
      onSelectItem(null);
    } else {
      // Select the item
      onSelectItem(item);
    }
  };

  const renderItemActions = (item: InventoryItem) => {
    const isSelected = selectedItem?.id === item.id;

    if (item.title === '' || item.title === 'Itak') {
      // Tools like Itak only have Select/Unselect
      return (
        <TouchableOpacity
          className={`rounded-lg p-2 w-full ${isSelected ? 'bg-red-400' : 'bg-green-400'}`}
          onPress={() => handleToggleSelect(item)}
        >
          <Text className="text-sm font-medium text-center text-white">
            {isSelected ? 'Unselect' : 'Select'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'harvestedCrop') {
      // Harvested crops keep the Sell button
      return (
        <TouchableOpacity
          className="rounded-lg p-2 w-full bg-blue-400"
          onPress={() => handleSellItem(item)}
        >
          <Text className="text-sm font-medium text-center text-white">
            Sell for {item.sellPrice} coins
          </Text>
        </TouchableOpacity>
      );
    }

    // Consumable items (seeds, fertilizer, etc.) get Select/Unselect
    return (
      <TouchableOpacity
        className={`rounded-lg p-2 w-full ${isSelected ? 'bg-red-400' : 'bg-green-400'}`}
        onPress={() => handleToggleSelect(item)}
      >
        <Text className="text-sm font-medium text-center text-white">
          {isSelected ? 'Unselect' : 'Select'}
        </Text>
      </TouchableOpacity>
    );
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
            {safeInventory.length === 0 ? (
              <Text className="text-center text-gray-600 p-4">Your bag is empty</Text>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                {safeInventory.map((item, index) => (
                  <View
                    key={`${item?.id || 'unknown'}-${index}`}
                    className={`rounded-lg p-3 w-40 items-center justify-between ${
                      selectedItem?.id === item?.id
                        ? 'bg-yellow-300 border-2 border-amber-500'
                        : 'bg-yellow-200'
                    }`}
                  >
                    <View className="items-center mb-2">
                      <Image
                        source={item?.image}
                        className="w-16 h-16"
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="font-bold mb-1 text-center">{item?.title || 'Unknown Item'}</Text>
                    {item?.quantity && item.quantity > 1 && (
                      <Text className="font-bold mb-1 text-center text-gray-700">Qty: {item.quantity}</Text>
                    )}
                    <View className="flex-row items-center gap-1">
                      {item && renderItemActions(item)}
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