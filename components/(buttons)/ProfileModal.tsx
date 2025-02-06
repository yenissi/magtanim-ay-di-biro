import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { AntDesign, SimpleLineIcons } from "@expo/vector-icons";


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
        <View className="bg-orange-300 p-5 rounded-lg w-96 h-[240px] border border-black">
          <Pressable className="absolute right-3 top-3 p-2" onPress={onClose}>
            <AntDesign name="close" size={20} color="black" />
          </Pressable>
          <Text className="text-lg font-bold text-center">User Profile</Text>
          <View>
            <View className="flex-row gap-4">
              <View className="items-center justify-center rounded-lg p-3 border-2 border-black ">
                <SimpleLineIcons name="user" size={44} color="black" />
              </View>
              <View>
                <Text className="text-base text-black-600 font-light">FullName: {userData?.firstName} {userData?.lastName}</Text>
                <Text className="text-base text-black-600 font-light">Grade Level: {gradeLevel}</Text>
                <Text className="text-base text-black-600 font-light">School: {school}</Text>
              </View>
            </View>

            <View className="border-2 border-black mt-3 rounded-lg">
              <Text className="text-2xl font-medium text-center justify-center">Level: {userData?.level || 1}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-red-500 p-3 mt-4 rounded-md"
            onPress={onSignOut}
          >
            <Text className="text-black text-center font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};
