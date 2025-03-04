import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { Mission } from '@/types';
import { INITIAL_GAME_STATE } from '@/config/gameConfig';

interface MissionsModalProps {
  visible: boolean;
  onClose: () => void;
  missions: Mission[];
  onMissionComplete: (missionId: number, answers: string[]) => void;
}

export const MissionsModal = ({ 
  visible, 
  onClose, 
  missions: propMissions, 
  onMissionComplete 
}: MissionsModalProps) => {
  // Use propMissions directly instead of local state
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  // Reset answers when mission changes
  useEffect(() => {
    if (selectedMission) {
      setAnswers(new Array(selectedMission.questions.split('\n').length).fill(''));
    }
  }, [selectedMission]);

  // Memoized mission progression logic
  const processedMissions = useMemo(() => {
    // Group missions by requiredMissionId
    const groupedMissions = propMissions.reduce((acc, mission) => {
      if (!acc[mission.requiredMissionId]) {
        acc[mission.requiredMissionId] = [];
      }
      acc[mission.requiredMissionId].push(mission);
      return acc;
    }, {} as Record<number, Mission[]>);

    // Update mission locks based on previous mission completion
    return propMissions.map(mission => {
      const missionsInGroup = groupedMissions[mission.requiredMissionId] || [];
      const previousGroupMissions = groupedMissions[mission.requiredMissionId - 1] || [];
      
      // Check if all previous group missions are completed
      const previousGroupCompleted = previousGroupMissions.length === 0 || 
        previousGroupMissions.every(m => m.completed);

      // Check if all missions in current group before this mission are completed
      const previousMissionsCompleted = missionsInGroup
        .filter(m => m.id < mission.id)
        .every(m => m.completed);

      return {
        ...mission,
        locked: !previousGroupCompleted || !previousMissionsCompleted
      };
    });
  }, [propMissions]);

  const handleStartMission = (mission: Mission) => {
    if (!mission.locked) {
      setSelectedMission(mission);
    }
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = text;
    setAnswers(newAnswers);
  };

  const handleSubmitMission = () => {
    if (selectedMission && answers.every(answer => answer.trim() !== '')) {
      onMissionComplete(selectedMission.id, answers);
      
      setSelectedMission(null);
      setAnswers([]);
    }
  };

  const renderMissionQuestions = () => {
    if (!selectedMission) return null;

    const questionPairs = selectedMission.questions.split('\n');
    
    return (
      <Modal visible={!!selectedMission} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-6 rounded-lg w-full max-w-md">
            <Text className="text-lg font-bold mb-4">{selectedMission.title}</Text>
            {questionPairs.map((questionPair, index) => {
              const [englishQuestion, tagalogQuestion] = questionPair.split(': ');
              return (
                <View key={index} className="mb-4">
                  <Text className="font-semibold mb-2">{englishQuestion}</Text>
                  <Text className="text-gray-600 mb-2">{tagalogQuestion}</Text>
                  <TextInput
                    className="border border-gray-300 p-2 rounded-lg"
                    placeholder="Your answer"
                    multiline
                    value={answers[index]}
                    onChangeText={(text) => handleAnswerChange(index, text)}
                  />
                </View>
              );
            })}
            <TouchableOpacity
              className={`p-3 rounded-lg ${
                answers.every(answer => answer.trim() !== '') 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
              onPress={handleSubmitMission}
              disabled={!answers.every(answer => answer.trim() !== '')}
            >
              <Text className="text-white text-center font-bold">Submit Answers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2 p-3 bg-red-500 rounded-lg"
              onPress={() => setSelectedMission(null)}
            >
              <Text className="text-white text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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
            {processedMissions.map((mission) => (
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
                <Text className="text-green-600 font-bold mb-4 text-sm">Reward: ₱{mission.reward}.00</Text>
                {!mission.completed && !mission.locked && (
                  <TouchableOpacity
                    className="bg-yellow-400 p-2 rounded-lg items-center"
                    onPress={() => handleStartMission(mission)}
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
      {renderMissionQuestions()}
    </Modal>
  );
};