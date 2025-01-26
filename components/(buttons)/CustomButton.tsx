import { View, Text, TouchableOpacity, Linking } from 'react-native'
import React from 'react'


const CustomButton = ({ onPress, title, buttonClass, textClass, href }) => {
    const handlePress = async () => {
        if (href) {
          const supported = await Linking.canOpenURL(href);
          if (supported) {
            await Linking.openURL(href); // Open the external URL
          } else {
            console.error("Don't know how to open this URL: " + href);
          }
        } else if (onPress) {
          onPress(); // Fallback to the provided onPress function
        }
      };
  return (
    <TouchableOpacity
      className={`bg-orange-300 px-4 py-2 rounded items-center justify-center ${buttonClass}`}
      onPress={handlePress}
    >
      <Text className={`text-black text-lg font-normal ${textClass}`}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}


  
export default CustomButton