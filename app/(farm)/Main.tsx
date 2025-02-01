import { View, Text, ImageBackground, ScrollView, StatusBar, Modal, Image } from "react-native";
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
        <View className="w-full h-full">
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
          
          {/* <View>
            <Text className="text-lg text-gray-600 text-center mb-2">📧 {email}</Text>
            <Text className="text-lg text-gray-600 text-center">🏫 {school}</Text>
            <Text className="text-lg text-gray-600 text-center">📚 {gradeLevel}</Text>
          </View> */}
        </View>
    </ImageBackground>
  );
};

export default Main;
