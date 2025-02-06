import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";


interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userData: any;
  gradeLevel: string;
  school: string;
  onSignOut: () => void;
}

export const ProfileModal = ({
  visible,
  onClose,
  userData,
  gradeLevel,
  school,
  onSignOut,
}: ProfileModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={onClose}>
        <View className="bg-white p-5 rounded-lg w-80">
          <TouchableOpacity className="absolute right-3 top-3" onPress={onClose}>
            <AntDesign name="close" size={20} color="black" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-center">User Profile</Text>
          <View>
            <Text className="text-base text-gray-600">Grade Level: {gradeLevel}</Text>
            <Text className="text-base text-gray-600">School: {school}</Text>
            <Text className="text-lg font-medium text-center">Level: {userData?.level || 1}</Text>
          </View>
          <TouchableOpacity
            className="bg-red-400 p-3 mt-4 rounded-md"
            onPress={onSignOut}
          >
            <Text className="text-black text-center font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};
