import { View, Text, ImageBackground, ScrollView, StatusBar, Modal, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import { FontAwesome5 , MaterialIcons  } from "@expo/vector-icons";

const Main = () => {
  // ✅ Get all user data passed from Signin.tsx
  const { firstName, lastName, email, gradeLevel, school } = useLocalSearchParams();

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
          <View className="flex-col border border-black pr-6 p-2 bg-orange-300 rounded-tr-md rounded-br-md w-auto">
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
          </View>
          <View className="mr-3">
            <Image 
              source={require("../../assets/images/trivia1.png")}
              style={{ width: 44, height: 44, resizeMode: "contain" }}
            />
          </View>
        </View>

        {/* ✅ Bottom section moved to the bottom */}
        <View className="flex-1 justify-end pb-4">
          <View className="flex-row items-center justify-between mx-4">
            <TouchableOpacity className="flex-col items-center">
              <Image
                source={require("../../assets/images/shop.png")}
                style={{ width: 43, height: 43, resizeMode: "contain" }}
              />
              <Text className="text-sm">Shop</Text>
            </TouchableOpacity>
            <View>
              <Text>Items</Text>
            </View>
            <TouchableOpacity className="flex-col items-center">
              <Image
                source={require("../../assets/images/missions.png")}
                style={{ width: 70, height: 70, resizeMode: "contain" }}
              />
              <Text>Missions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </ImageBackground>
  );
};

export default Main;
