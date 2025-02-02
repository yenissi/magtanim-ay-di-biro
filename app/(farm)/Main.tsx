import { View, Text, ImageBackground, StatusBar, Modal, Image, TouchableOpacity, Pressable, ScrollView,Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useState } from "react";
import { FontAwesome5 , MaterialIcons,AntDesign   } from "@expo/vector-icons";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

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
          {/* ✅ PROFILE BUTTON */}
          <TouchableOpacity
            className="flex-col border border-black pr-6 p-2 bg-orange-300 rounded-tr-md rounded-br-md w-auto"
            onPress={() => setProfileVisible(true)}
          >
            <View className="flex-row items-center mb-1">
              <FontAwesome5 name="user-alt" size={18} color="black" />
              <Text className="text-sm text-black ml-2">{firstName}{lastName}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="attach-money" size={19} color="black" />
              <Text className="text-sm text-black ml-2">$100</Text>
            </View>
          </TouchableOpacity>

          {/* ✅ PROFILE MODAL */}
          <Modal visible={profileVisible} transparent animationType="fade">
            <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setProfileVisible(false)}>
              <View className="bg-white p-5 rounded-lg w-80">
                {/* X Button */}
                <TouchableOpacity className="absolute right-3 top-3" onPress={() => setProfileVisible(false)}>
                  <AntDesign name="close" size={20} color="black" />
                </TouchableOpacity>

                <Text className="text-lg font-bold text-center">Profile</Text>
                <Text className="text-gray-600 text-center">User can see the Level in this modal</Text>
              </View>
            </Pressable>
          </Modal>

          {/* ✅ TRIVIA BUTTON */}
          <TouchableOpacity className="mr-3" onPress={() => setTriviaVisible(true)}>
            <Image source={require("../../assets/images/cloud.png")} style={{ width: 65, height: 65, resizeMode: "contain" }} />
          </TouchableOpacity>

          {/* ✅ TRIVIA MODAL */}
          <Modal visible={triviaVisible} transparent={true} animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-orange-300 rounded-lg m-8 w-10/12 max-h-[85%]">
                {/* Exit Button */}
                <Pressable
                  className="p-2 flex-row items-center justify-center border border-b rounded-t-lg" 
                  onPress={() => setTriviaVisible(false)}>
                  <Text className="text-lg font-bold text-center pt-4">Trivia</Text>
                  <AntDesign name="close" size={20} color="black" 
                    style={{ position: "absolute", right: 0, top: 0 }}
                    className="p-2"
                  />
                </Pressable>
                
                <ScrollView className="px-4 border border-b rounded-b-lg">
                      {/* Trivia 1 */}
                      <View  className="flex-row items-center gap-2 mb-2">
                        <Text>Image-1</Text>
                        <Image
                          source={require("../../assets/images/cloud.png")}
                          style={{ width: 65, height: 65, resizeMode: "contain" }}
                        />
                        <View className="p-3">
                          <Text className="text-base font-bold">Nakapipigil sa Pagguho ng Lupa at Baha</Text>
                          <Text className="text-sm text-justify w-[450px]">
                            Kumakapit ang mga ugat ng mga punong ornamental sa lupang taniman kaya nakakaiwas sa landslide o
                            pagguho ng lupa. Ang mga punong ornamental ay nakatutulong din sa pagingat sa pagbaha dahil sa
                            tulong ng mga ugat nito.
                          </Text>
                        </View>
                      </View>
                      {/* Trivia 2 */}
                      <View  className="flex-row items-center gap-2 mb-2">
                        <Text>Image-2</Text>
                        <View className="p-3">
                          <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                          <Text className="text-sm text-justify w-[450px]">
                          Sa gamit ng mga halaman/ punong ornamental,
                          nakakaiwas sa polusyon ang pamayanan sa maruruming hangin na nagmumula sa mga usok ng sasakyan,
                          sinigaang basura, masasamang amoy na kung saan nalilinis ang hangin na ating nilalanghap.
                          </Text>
                        </View>
                      </View>
                </ScrollView>
              </View>
            </View>
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
