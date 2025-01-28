import { View, Text } from 'react-native'
import React from 'react'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'

const Rootlayout = () => {
    const [loaded,error] = useFonts({
        'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
        'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
        'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
        'Quicksan-Light': require('../assets/fonts/Quicksand-Light.ttf'),
        'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
    })

    if(!loaded && !error) return null

  return (
    <Stack>
      
    </Stack>
    )
}
export default Rootlayout