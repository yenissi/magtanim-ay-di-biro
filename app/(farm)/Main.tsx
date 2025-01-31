import { View, Text, ImageBackground, ScrollView, StatusBar, Modal } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";

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
                <View className="flex-col">
                    <Text>{firstName} {lastName}!</Text>
                    <Text>Money</Text>
                </View>
                <View>
                    <Text>Trivia</Text>
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
