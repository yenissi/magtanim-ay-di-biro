import React from 'react'
import { Modal, View, Text,TouchableOpacity } from 'react-native'
import { AntDesign } from '@expo/vector-icons'

interface DecomposeProps{
    visible: boolean,
    onClose: () => void;
}

export const Decompose = ({ visible, onClose }: DecomposeProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
        <View  className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-orange-300 p-5 rounded-lg w-11/12">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold">Decompose</Text>
                    <TouchableOpacity onPress={onClose}>
                        <AntDesign name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                {/* Decompose Content */}
                <View>
                    {/* Add your content here */}
                    <Text className='text-center'>Decompose Content</Text>
                </View>
            </View>
        </View>
    </Modal>
  )
}