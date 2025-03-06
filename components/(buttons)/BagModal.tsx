import React from 'react';
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
}

export const BagModal = ({ 
  visible, 
  onClose, 
  inventory,
  onSelectItem,
  selectedItem,
  onSellItem,
  onUseItem,
  onRemoveItem,
  plots
}: BagModalProps) => {
  console.log('BagModal - Current Inventory:', inventory);
  console.log('BagModal Render - Selected item:', selectedItem);

  // const handleItemSelect = (item: InventoryItem) => {
  //   console.log('Item selected:', item.title);
  //   onSelectItem(selectedItem?.id === item.id ? null : item);
  // };

  const handleItemUse = (item: InventoryItem) => {
    onUseItem(item); // Remove item from inventory
  };

  const handleSellItem = (item: InventoryItem) => {
    Alert.alert(
      "Sell Item",
      `Are you sure you want to sell ${item.title} for ${item.sellPrice} coins?`,
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
    console.log('Using Item: ', item);

    if (item.title === 'Itak') {
      onSelectItem(item);
      onClose();
      return;
    }

    onSelectItem(item);
    onClose();
    
    // For consumable items, ONLY check if they're valid to use, but don't consume yet
    const nonConsumableTools = [''];
    if (!nonConsumableTools.includes(item.title)) {
      // Determine what the item does first
      if (item.title === 'Fertilizer') {
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
          // Alert.alert("Plots Available", "You need a plowed and watered plot to plant seeds.");
          return; // Don't remove the item if it can't be used
        }
        
        Alert.alert(
          "Plant Seeds",
          "Select a plowed and watered plot to plant these seeds.",
          [
            { text: "OK" }
          ]
        );
      }
      
      // REMOVED: Don't call onUseItem here - we only select the item, not use it
      // onUseItem(item);
    }
  };

  const renderItemActions = (item: InventoryItem) => {
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
            {inventory.length === 0 ? (
              <Text className="text-center text-gray-600 p-4">Your bag is empty</Text>
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
                    <Text className="text-xs text-gray-600 mb-2 text-center">{item.type}</Text>
                    <View className="flex-row items-center gap-1">
                      {renderItemActions(item)}
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