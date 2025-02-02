import { View, Text, ImageBackground, StatusBar, Modal, Image, TouchableOpacity, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useState } from "react";
import { FontAwesome5 , MaterialIcons  } from "@expo/vector-icons";

const Main = () => {
  // ✅ Get all user data passed from Signin.tsx
  const { firstName, lastName, email, gradeLevel, school } = useLocalSearchParams();
  const [shopVisible, setShopVisible] = useState(false);
  const [bagVisible, setBagVisible] = useState(false);
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [triviaVisible, setTriviaVisible] = useState(false);

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <ImageBackground source={require("../../assets/images/Mainbg.png")} style={{ flex: 1 }}>
      <StatusBar hidden/>
      <View className="w-full h-full flex-1">
        {/* Top */}
        <View className="flex-row justify-between items-center">
          <TouchableOpacity 
            className="flex-col border border-black pr-6 p-2 bg-orange-300 rounded-tr-md rounded-br-md w-auto" 
            onPress={() => setProfileVisible(true)}
            >
            {/* User Name */}
            <View className="flex-row items-center mb-1">
              <FontAwesome5 name="user-alt" size={18} color="black" className="mr-2" />
              <Text className="text-sm text-black">{firstName} {lastName}</Text>
            </View>
            {/* User Money */}
            <View className="flex-row items-center">
              <MaterialIcons name="attach-money" size={19} color="black" className="mr-2" />
              <Text className="text-sm text-black">Money</Text>
            </View>
          </TouchableOpacity>
          <Modal visible={profileVisible} transparent animationType="fade">
            <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setProfileVisible(false)}>
              <View className="bg-white p-5 rounded-lg">
                <Text className="text-lg font-bold">Profile</Text>
                <Text className="text-gray-600">User can see the Level in this modal</Text>
              </View>
            </Pressable>
          </Modal>
          <TouchableOpacity 
            className="mr-3"
            onPress={() => setTriviaVisible(true)}
          >
            <Image 
              source={require("../../assets/images/cloud.png")}
              style={{ width: 65, height: 65, resizeMode: "contain" }}
            />
          </TouchableOpacity>
          <Modal visible={triviaVisible} transparent animationType="fade">
            <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setTriviaVisible(false)}>
              <View className="bg-white p-5 rounded-lg">
                <Text className="text-lg font-bold">Trivia</Text>
                <Text className="text-gray-600">User can see the Trivia in this modal</Text>
              </View>
            </Pressable>
          </Modal>
        </View>

        {/*  Bottom section moved to the bottom */}
        <View className="flex-1 justify-end pb-4">
          <View className="absolute right-4 bottom-4 flex-col items-end space-y-3">
            {/*  SHOP BUTTON */}
            <TouchableOpacity className="flex-col items-center" onPress={() => setShopVisible(true)}>
              <Image source={require("../../assets/images/shop.png")} style={{ width: 43, height: 43, resizeMode: "contain" }} />
              <Text className="text-sm">Shop</Text>
            </TouchableOpacity>
            
            {/*  BAG BUTTON */}
            <TouchableOpacity className="flex-col items-center" onPress={() => setBagVisible(true)}>
              <Image source={require("../../assets/images/bag.png")} style={{ width: 43, height: 43, resizeMode: "contain" }} />
              <Text className="text-sm">Bag</Text>
            </TouchableOpacity>

            {/*  MISSIONS BUTTON */}
            <TouchableOpacity className="flex-col items-center" onPress={() => setMissionsVisible(true)}>
              <Image source={require("../../assets/images/missions1.png")} style={{ width: 43, height: 43, resizeMode: "contain" }} />
              <Text className="text-sm">Missions</Text>
            </TouchableOpacity>

            {/*  SHOP MODAL */}
            <Modal visible={shopVisible} transparent animationType="fade">
              <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setShopVisible(false)}>
                <View className="bg-white p-5 rounded-lg">
                  <Text className="text-lg font-bold">Shop</Text>
                  <Text className="text-gray-600">This is the shop section.</Text>
                </View>
              </Pressable>
            </Modal>

            {/*  BAG MODAL */}
            <Modal visible={bagVisible} transparent animationType="fade">
              <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setBagVisible(false)}>
                <View className="bg-white p-5 rounded-lg">
                  <Text className="text-lg font-bold">Bag</Text>
                  <Text className="text-gray-600">This is the bag section.</Text>
                </View>
              </Pressable>
            </Modal>

            {/*  MISSIONS MODAL */}
            <Modal visible={missionsVisible} transparent animationType="fade">
              <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setMissionsVisible(false)}>
                <View className="bg-white p-5 rounded-lg">
                  <Text className="text-lg font-bold">Missions</Text>
                  <Text className="text-gray-600">This is the missions section.</Text>
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Main;
