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

  // Ensure inventory is always an array, even if undefined or null
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  
  useEffect(() => {
    if (Array.isArray(inventory) && inventory.length > 0) {
      console.log('', inventory.map(item => ({
        title: item.title,
      })));
    } else {
    }
  }, [inventory]);

  const handleItemUse = (item: InventoryItem) => {
    onUseItem(item);
  };
  useEffect(() => {
    console.log('BagModal - Current inventory:', inventory);
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
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sell",
          onPress: () => {
            console.log('Selling item:', item.title);
            onSellItem(item);
            // Clear selection if the sold item was selected
            if (selectedItem?.id === item.id) {
              onSelectItem(null);
            }
          }
        }
      ]
    );
  };

  const handleUseItem = (item: InventoryItem) => { 
    console.log('Using Item BagModal: ', item);
    onSelectItem(item);
    onClose();
    
    // For consumable items, ONLY check if they're valid to use, but don't consume yet
    const nonConsumableTools = [''];
    if (!nonConsumableTools.includes(item.title)) {
      // Determine what the item does first
      if (item.title === 'Fertilizer' || item.title === 'Organic Fertilizer') {
        // If there's no currently selected plot with a plant, alert the user
        const hasActivePlant = plots.some(row => 
          row.some(plot => plot.plant && !plot.plant.isFertilized)
        );
        
        if (!hasActivePlant) {
          return; // Don't remove the item if it can't be used
        }
        
        Alert.alert(
          "Apply Fertilizer",
          "Select a plot with a plant to apply fertilizer.",
          [
            { text: "OK" }
          ]
        );
      } else if (item.type === 'crop' || item.type === 'tree') {
        // If there's no plowed and watered plot available, alert the user
        const hasAvailablePlot = plots.some(row => 
          row.some(plot => plot.isPlowed && plot.isWatered && !plot.plant)
        );
        
        if (!hasAvailablePlot) {
          return;
        }
        
        Alert.alert(
          "Plant Seeds",
          "Select a plowed and watered plot to plant these seeds.",
          [
            { text: "OK" }
          ]
        );
      }
    }
  };

  const renderItemActions = (item: InventoryItem) => {
    if (item.title === '' || item.title === 'Itak') {
      return (
        <TouchableOpacity
          className="rounded-lg p-2 w-full bg-green-400"
          onPress={() => handleUseItem(item)}
        >
          <Text className="text-sm font-medium text-center text-white">
            Use
          </Text>
        </TouchableOpacity>
      );
    }
    // Special handling for harvested crops
    if (item.type === 'harvestedCrop') {
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

    // For consumable items like seeds, fertilizer, etc.
    return (
      <TouchableOpacity
        className="rounded-lg p-2 w-full bg-green-400"
        onPress={() => handleUseItem(item)}
      >
        <Text className="text-sm font-medium text-center text-white">
          Use
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
                      className={`rounded-lg p-3 w-40 ${
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
                    {/* <Text className="text-xs text-gray-600 mb-2 text-center">{item?.type || ''}</Text> */}
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