import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export const useAudio = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Fix: Proper cleanup of audio resources
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [sound]);

  const playSound = async (soundFile: number) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
      });
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate(async status => {
        if (status.didJustFinish) {
          await newSound.unloadAsync().catch(console.error);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  };

  return { playSound };
};