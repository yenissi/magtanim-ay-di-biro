import { View, Text, ImageBackground, StatusBar, Modal, Image, TouchableOpacity, Pressable, ScrollView,Button } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useState } from "react";
import { FontAwesome5 , MaterialIcons,AntDesign   } from "@expo/vector-icons";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { router } from "expo-router"; // Import router para sa navigation
import { getAuth, signOut } from "firebase/auth"; // Import Firebase auth kung ginagamit mo ito

const Main = () => {
  // ✅ Get all user data passed from Signin.tsx
  const { firstName, lastName, email, gradeLevel, school } = useLocalSearchParams();
  const [shopVisible, setShopVisible] = useState(false);
  const [bagVisible, setBagVisible] = useState(false);
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [triviaVisible, setTriviaVisible] = useState(false);


  // User Data
  const [userData, setUserData] = useState({
    level: 1,
    money: 100,
    missions: [
      {
        id: 1,
        title: "Complete a Mission",
        description: "Earn 50 points by completing a mission",
        reward: 50
      },
      {
        id: 2,
        title: "Collect 100 Items",
        description: "Earn 50 points by collecting 100 unique items",
        reward: 50
      },
      {
        id: 3,
        title: "Visit the Shop",
        description: "Earn 50 points by visiting the shop",
        reward: 50
      },
      {
        id: 4,
        title: "Complete 30 Trivia Questions",
        description: "Earn 50 points by answering 30 trivia questions correctly",
        reward: 50
      }
    ],
    shopItems: [
      {
      id: 1,
      title: "Basic Shoes",
      description: "A pair of comfortable shoes",
      price: 50,
      }
    ],
    userItems: [
      {
      id: 1,
      title: "Pala",
      description: "mema",
      price: 50
      }
  ]
  });
  // Complete Mission Data
  const completeMission = () => {
    setUserData((prev) => ({
      ...prev,
      level: prev.level + 1,
      money: prev.money + 50
    }));
  };

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
              <Text className="text-sm text-black ml-2">{firstName} {lastName}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="attach-money" size={19} color="black" />
              {/* Money */}
              <Text className="text-sm text-black ml-2">{userData.money}</Text>
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
                <Text>{userData.level}</Text>
                
                {/* ✅ Logout Button */}
                <TouchableOpacity
                  className="bg-red-500 p-3 mt-4 rounded-md"
                  onPress={() => {
                    const auth = getAuth();
                    signOut(auth) // Firebase logout
                      .then(() => {
                        router.replace("/Signin"); // Balik sa login page
                      })
                      .catch((error) => console.error("Logout failed:", error));
                  }}
                >
                  <Text className="text-white text-center font-bold">Logout</Text>
                </TouchableOpacity>
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
                          <Image
                            source={require("../../assets/images/land.jpg")}
                            style={{ width: 90, height: 90, resizeMode: "cover", borderRadius: 3 }}
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
                        <Image
                            source={require("../../assets/images/pollutions.jpg")}
                            style={{ width: 90, height: 90, resizeMode: "contain",borderRadius: 4 }}
                        />
                        <View className="p-3">
                          <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                          <Text className="text-sm text-justify w-[450px]">
                          Sa gamit ng mga halaman/ punong ornamental,
                          nakakaiwas sa polusyon ang pamayanan sa maruruming hangin na nagmumula sa mga usok ng sasakyan,
                          sinigaang basura, masasamang amoy na kung saan nalilinis ang hangin na ating nilalanghap.
                          </Text>
                        </View>
                      </View>
                      {/* Trivia 3 */}
                      <View  className="flex-row items-center gap-2 mb-2">
                        <Image
                            source={require("../../assets/images/fresh.jpg")}
                            style={{ width: 90, height: 90, resizeMode: "cover",borderRadius: 4 }}
                        />
                        <View className="p-3">
                          <Text className="text-base font-bold">Nagbibigay ng lilim at sariwang hangin</Text>
                          <Text className="text-sm text-justify w-[450px]">
                          May mga matataas at mayayabong na halamang ornamental gaya ng kalachuchi, 
                          ilang-ilang, pine tree, fire tree, at marami pang iba na maaaring itanim sa gilid ng kalsada, 
                          kanto ng isang lugar na puwedeng masilungan ng mga tao.
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
                   {/* Shop items */}
                  <Text className="text-lg font-bold">Shop</Text>
                  {userData.shopItems.map((item) => (
                    <Text key={item.id} className="text-gray-600">{item.title} - ${item.price}</Text>
                  ))}
                </View>
              </Pressable>
            </Modal>

            {/*  BAG MODAL */}
            <Modal visible={bagVisible} transparent animationType="fade">
              <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setBagVisible(false)}>
                <View className="bg-white p-5 rounded-lg">
                  {/* User items */}
                  <Text className="text-lg font-bold">Bag</Text>
                  {userData.userItems.map((item) => (
                    <Text key={item.id} className="text-gray-600">{item.title} - ${item.price}</Text>
                  ))}
                </View>
              </Pressable>
            </Modal>

            {/*  MISSIONS MODAL */}
            <Modal visible={missionsVisible} transparent animationType="fade">
              <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setMissionsVisible(false)}>
                <View className="bg-white p-5 rounded-lg">
                  <Text className="text-lg font-bold">Missions</Text>
                  {/* User's missions */}
                  {userData.missions.map((mission) => (
                    <Text key={mission.id} className="text-gray-600">{mission.title}</Text>
                  ))}
                  <TouchableOpacity className="bg-blue-500 p-3 rounded" onPress={completeMission}>
                    <Text className="text-white">Complete Mission</Text>
                  </TouchableOpacity>
                  {/* Missions */}
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
