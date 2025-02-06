import React from "react";
import { Modal, View, Text, Pressable, ScrollView, Image } from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface TriviaModalProps {
  visible: boolean;
  onClose: () => void;
}

const TriviaModal = ({ visible, onClose }: TriviaModalProps ) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 rounded-lg m-8 w-10/12 max-h-[85%]">
          <Pressable className="p-2 flex-row items-center justify-center border border-b rounded-t-lg" onPress={onClose}>
            <Text className="text-lg font-bold text-center pt-4">Trivia</Text>
            <AntDesign name="close" size={20} color="black" className="p-2 absolute right-3 top-3" />
          </Pressable>

          <ScrollView className="px-4 border border-b rounded-b-lg p-4">
            {/* Trivia Item 1 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/land.jpg")} style={{ width: 90, height: 90, borderRadius: 3 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Nakapipigil sa Pagguho ng Lupa at Baha</Text>
                <Text className="text-sm text-justify w-[450px]">Kumakapit ang mga ugat ng mga punong ornamental sa lupa kaya nakakaiwas sa landslide o pagbaha.</Text>
              </View>
            </View>

            {/* Trivia Item 2 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/pollutions.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                <Text className="text-sm text-justify w-[450px]">Ang mga halaman ay tumutulong linisin ang maruming hangin mula sa usok ng sasakyan at basura.</Text>
              </View>
            </View>

             {/* Trivia Item 3 */}
             <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/pollutions.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                <Text className="text-sm text-justify w-[450px]">Ang mga halaman ay tumutulong linisin ang maruming hangin mula sa usok ng sasakyan at basura.</Text>
              </View>
            </View>

            {/* Trivia Item 4 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/pollutions.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                <Text className="text-sm text-justify w-[450px]">Ang mga halaman ay tumutulong linisin ang maruming hangin mula sa usok ng sasakyan at basura.</Text>
              </View>
            </View>
            
            {/* Trivia Item 5 */}
            <View className="flex-row items-center gap-2 mb-2">
              <Image source={require("../../assets/images/pollutions.jpg")} style={{ width: 90, height: 90, borderRadius: 4 }} />
              <View className="p-3">
                <Text className="text-base font-bold">Naiiwasan ang Polusyon</Text>
                <Text className="text-sm text-justify w-[450px]">Ang mga halaman ay tumutulong linisin ang maruming hangin mula sa usok ng sasakyan at basura.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default TriviaModal;
