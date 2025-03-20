import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { Mission } from '@/types';
import { INITIAL_GAME_STATE } from '@/config/gameConfig';
import { ref, update, get } from 'firebase/database';
import { Firebase_Database } from '@/firebaseConfig';

interface MissionsModalProps {
  visible: boolean;
  onClose: () => void;
  missions: Mission[];
  onMissionComplete: (missionId: number, answer: string) => void;
  userId?: string; // Make userId optional but handle its absence
}

export const MissionsModal = ({ 
  visible, 
  onClose, 
  missions: propMissions, 
  onMissionComplete,
  userId
}: MissionsModalProps) => {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [localMissions, setLocalMissions] = useState<Mission[]>(propMissions);

  // Load saved missions from Firebase when the component mounts
  useEffect(() => {
    if (!userId) {
      console.error("Cannot load missions: User ID is missing");
      return;
    }
    
    if (visible) {
      const loadSavedMissions = async () => {
        try {
          const missionsRef = ref(Firebase_Database, `users/${userId}/missions`);
          const snapshot = await get(missionsRef);
          
          if (snapshot.exists()) {
            const savedMissions = snapshot.val();
            // If missions are saved as an array, use them directly
            if (Array.isArray(savedMissions)) {
              setLocalMissions(savedMissions);
            } else {
              // If missions are saved as an object, convert to array
              const missionsArray = Object.values(savedMissions);
              setLocalMissions(missionsArray as Mission[]);
            }
            // console.log("Loaded saved missions from Firebase:", savedMissions);
          } else {
            // If no saved missions, initialize with prop missions
            setLocalMissions(propMissions);
            console.log("No saved missions found, using prop missions");
          }
        } catch (error) {
          console.error("Error loading saved missions:", error);
          setLocalMissions(propMissions);
        }
      };

      loadSavedMissions();
    }
  }, [userId, visible, propMissions]);

  // Reset answer when mission changes
  useEffect(() => {
    if (selectedMission) {
      setAnswer('');
    }
  }, [selectedMission]);

  const processedMissions = useMemo(() => {
    // Group missions by requiredMissionId
    const groupedMissions = localMissions.reduce((acc, mission) => {
      if (!acc[mission.requiredMissionId]) {
        acc[mission.requiredMissionId] = [];
      }
      acc[mission.requiredMissionId].push(mission);
      return acc;
    }, {} as Record<number, Mission[]>);

    // Update mission locks based on previous mission completion
    return localMissions.map(mission => {
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
  }, [localMissions]);

  const handleStartMission = (mission: Mission) => {
    if (!mission.locked) {
      setSelectedMission(mission);
    }
  };

  const getEnglishQuestionFromConfig = (missionId: number) => {
    const missionConfig = INITIAL_GAME_STATE.missions.find(m => m.id === missionId);
    if (missionConfig && missionConfig.questions) {
      if (typeof missionConfig.questions === 'object') {
        return missionConfig.questions.english || '';
      }
    }
    return '';
  };

  const handleSubmitMission = async () => {
    if (!selectedMission || answer.trim() === '') return;
    
    if (!userId) {
      console.error("Cannot submit mission: User ID is missing");
      return; // Early return if userId is undefined
    }

    try {
      // Prepare the data to save
      let missionData = {
        answer: answer,
        completedAt: new Date().toISOString(),
        missionId: selectedMission.id
      };
      
      // Add question details based on the data structure
      if (typeof selectedMission.questions === 'object') {
        missionData.questionEnglish = selectedMission.questions.english;
        missionData.questionTagalog = selectedMission.questions.tagalog;
      } else if (typeof selectedMission.questions === 'string') {
        // If string only has Tagalog question, get English from config
        if (selectedMission.questions.startsWith('Tagalog:')) {
          missionData.questionEnglish = getEnglishQuestionFromConfig(selectedMission.id);
          missionData.questionTagalog = selectedMission.questions.replace('Tagalog:', '').trim();
        } else {
          // Parse English and Tagalog parts
          const questionParts = selectedMission.questions.split('Tagalog:');
          missionData.questionEnglish = questionParts[0].trim();
          missionData.questionTagalog = questionParts.length > 1 ? questionParts[1].trim() : '';
        }
      }
      
      // Save to Firebase under the user's missionsCompleted node
      const userMissionRef = ref(Firebase_Database, `users/${userId}/missionsCompleted/${selectedMission.id}`);
      await update(userMissionRef, missionData);
      
      // Update the completed status in local state
      const updatedMissions = localMissions.map(mission => 
        mission.id === selectedMission.id 
          ? { ...mission, completed: true } 
          : mission
      );
      setLocalMissions(updatedMissions);
      
      // Also save the updated missions array to Firebase
      const userMissionsRef = ref(Firebase_Database, `users/${userId}/missions`);
      await update(userMissionsRef, updatedMissions);
      
      // Call the onMissionComplete callback
      onMissionComplete(selectedMission.id, answer);
      
      // Reset state
      setSelectedMission(null);
      setAnswer('');
      
      console.log(`Mission ${selectedMission.id} submitted successfully for user ${userId}`);
    } catch (error) {
      console.error("Error saving mission answer:", error);
      // You might want to show an error message to the user
    }
  };

  const renderMissionQuestions = () => {
    if (!selectedMission) return null;
    
    let englishQuestion = '';
    let tagalogQuestion = '';
    
    if (selectedMission.questions && typeof selectedMission.questions === 'object') {
      englishQuestion = selectedMission.questions.english || '';
      tagalogQuestion = selectedMission.questions.tagalog || '';
    } else if (typeof selectedMission.questions === 'string') {
      // Fix parsing of string questions
      if (selectedMission.questions.startsWith('Tagalog:')) {
        // Get English question from game config instead of using title
        englishQuestion = getEnglishQuestionFromConfig(selectedMission.id);
        tagalogQuestion = selectedMission.questions.replace('Tagalog:', '').trim();
      } else {
        // Parse English and Tagalog parts
        const questionParts = selectedMission.questions.split('Tagalog:');
        englishQuestion = questionParts[0].trim();
        tagalogQuestion = questionParts.length > 1 ? questionParts[1].trim() : '';
      }
    }
    
    return (
      <Modal visible={!!selectedMission} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="bg-orange-300 p-6 rounded-lg w-full max-w-md">
          <View className="mb-4">
            <Text className="text-black-600 mb-1">English: {englishQuestion}</Text>
            <Text className="text-black-600 mb-1">Tagalog: {tagalogQuestion}</Text>
            <TextInput
              className="border border-black-300 p-2 rounded-lg h-[55px]"
              placeholder="Sagutan..."
              multiline
              value={answer}
              onChangeText={setAnswer}
            />
          </View>
          <TouchableOpacity
            className={`p-3 rounded-lg ${
              answer.trim() !== '' 
                ? 'bg-green-500' 
                : 'bg-gray-300'
            }`}
            onPress={handleSubmitMission}
            disabled={answer.trim() === ''}
          >
            <Text className="text-white text-center font-bold">Submit</Text>
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

  // If userId is not provided, show an error message instead of the modal
  if (!userId) {
    return visible ? (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-red-100 p-5 rounded-lg w-10/12">
            <Text className="text-red-500 font-bold text-center">Error: User ID is missing</Text>
            <TouchableOpacity 
              className="mt-4 p-3 bg-red-500 rounded-lg"
              onPress={onClose}
            >
              <Text className="text-white text-center font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ) : null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-10/12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold">Missions</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal className="flex-row">
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
                    <Text className="font-bold">Start Mission</Text>
                  </TouchableOpacity>
                )}
                {mission.completed && (
                  <TouchableOpacity 
                    className="text-center text-green-600 font-bold"
                    onPress={() => handleStartMission(mission)}
                  > 
                  <Text className="font-bold">✅ Completed!</Text>
                  </TouchableOpacity>
                )}
                {mission.locked && (
                  <Text className="text-center text-gray-600"> 🔒 Locked</Text>
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