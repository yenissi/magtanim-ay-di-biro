// components/game/MissionsModal.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { Mission } from '@/types';
import { INITIAL_GAME_STATE } from '@/config/gameConfig';
import { useState,useEffect } from 'react';


interface MissionsModalProps {
  visible: boolean;
  onClose: () => void;
  missions: Mission[];
  onMissionComplete: (missionId: number) => void;
}



export const MissionsModal = ({ visible, onClose, onMissionComplete }: MissionsModalProps) => {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_GAME_STATE.missions);

  useEffect(() => {
    // Automatically sync missions from INITIAL_GAME_STATE
    const updatedMissions = INITIAL_GAME_STATE.missions.map(configMission => {
      // Find existing mission in current state or use default state
      const existingMission = missions.find(m => m.id === configMission.id);
      
      return existingMission ? {
        ...configMission,
        completed: existingMission.completed,
        locked: existingMission.locked
      } : configMission;
    });

    setMissions(updatedMissions);
  }, [INITIAL_GAME_STATE.missions.length]);

  const handleMissionComplete = (missionId: number) => {
    const updatedMissions = missions.map(mission => 
      mission.id === missionId 
        ? { ...mission, completed: true } 
        : mission
    );
    setMissions(updatedMissions);
    onMissionComplete(missionId);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-11/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Missions</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal className="flex-row h-44">
            {missions.map((mission) => (
              <View
                key={mission.id}
                className={`p-4 rounded-lg w-auto mr-2 ${
                  mission.completed
                    ? 'bg-green-200'
                    : mission.locked
                    ? 'bg-gray-200'
                    : 'bg-yellow-200'
                }`}
              >
                <Text className="font-bold mb-2">{mission.title}</Text>
                {/* <Text className="text-gray-600 mb-2">{mission.description}</Text> */}
                <Text className="text-green-600 font-bold mb-4 text-sm">Reward: ₱{mission.reward}.00</Text>
                {!mission.completed && !mission.locked && (
                  <TouchableOpacity
                    className="bg-yellow-400 p-2 rounded-lg items-center"
                    onPress={() => onMissionComplete(mission.id)}
                  >
                    <Text className="font-bold">Complete</Text>
                  </TouchableOpacity>
                )}
                {mission.completed && (
                  <Text className="text-center text-green-600 font-bold">Completed!</Text>
                )}
                {mission.locked && (
                  <Text className="text-center text-gray-600">Locked</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};