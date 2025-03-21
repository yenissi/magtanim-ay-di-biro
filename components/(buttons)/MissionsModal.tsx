import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import type { Mission } from '@/types';
import { ref, update, get } from 'firebase/database';
import { Firebase_Database } from '@/firebaseConfig';

interface MissionsModalProps {
  visible: boolean;
  onClose: () => void;
  missions: Mission[];
  onMissionComplete: (missionId: number, answer: string) => void;
  userId?: string;
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
  const [answeredMissions, setAnsweredMissions] = useState<Set<number>>(new Set()); // Track answered missions

  useEffect(() => {
    if (!userId || !visible) return;

    const loadSavedMissions = async () => {
      try {
        const missionsRef = ref(Firebase_Database, `users/${userId}/missions`);
        const snapshot = await get(missionsRef);
        if (snapshot.exists()) {
          setLocalMissions(Array.isArray(snapshot.val()) ? snapshot.val() : Object.values(snapshot.val()));
        } else {
          setLocalMissions(propMissions);
          await update(missionsRef, propMissions);
        }

        // Load answered missions from Firebase
        const completedRef = ref(Firebase_Database, `users/${userId}/missionsCompleted`);
        const completedSnapshot = await get(completedRef);
        if (completedSnapshot.exists()) {
          const completedData = completedSnapshot.val();
          const answeredIds = new Set(Object.keys(completedData).map(id => parseInt(id, 10)));
          setAnsweredMissions(answeredIds);
        }
      } catch (error) {
        console.error("Error loading missions or completed data:", error);
        setLocalMissions(propMissions);
      }
    };
    loadSavedMissions();
  }, [userId, visible, propMissions]);

  useEffect(() => {
    if (selectedMission) setAnswer('');
  }, [selectedMission]);

  const handleCompleteMission = (mission: Mission) => {
    if (mission.completed && !answeredMissions.has(mission.id)) {
      setSelectedMission(mission);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedMission || !answer.trim() || !userId) return;

    try {
      const missionData = {
        answer,
        completedAt: new Date().toISOString(),
        missionId: selectedMission.id,
        questionEnglish: selectedMission.questions.english,
        questionTagalog: selectedMission.questions.tagalog,
      };

      const userMissionRef = ref(Firebase_Database, `users/${userId}/missionsCompleted/${selectedMission.id}`);
      await update(userMissionRef, missionData);

      // Mark mission as answered
      setAnsweredMissions(prev => new Set(prev).add(selectedMission.id));

      // Award reward
      onMissionComplete(selectedMission.id, answer);

      setSelectedMission(null);
      setAnswer('');
    } catch (error) {
      console.error("Error saving mission answer:", error);
    }
  };

  const handleViewAnswer = async (mission: Mission) => {
    if (!userId || !mission.completed) return;
    const missionRef = ref(Firebase_Database, `users/${userId}/missionsCompleted/${mission.id}`);
    const snapshot = await get(missionRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      alert(`Your answer: ${data.answer}`);
    } else {
      alert("No answer submitted yet.");
    }
  };

  const renderQuestionModal = () => {
    if (!selectedMission) return null;

    const { english, tagalog } = selectedMission.questions;

    return (
      <Modal visible={!!selectedMission} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-orange-300 p-6 rounded-lg w-full max-w-md">
            <Text className="text-black mb-1">English: {english}</Text>
            <Text className="text-black mb-1">Tagalog: {tagalog}</Text>
            <TextInput
              className="border border-black-300 p-2 rounded-lg h-[55px]"
              placeholder="Enter your answer..."
              multiline
              value={answer}
              onChangeText={setAnswer}
            />
            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${answer.trim() ? 'bg-green-500' : 'bg-gray-300'}`}
              onPress={handleSubmitAnswer}
              disabled={!answer.trim()}
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

  if (!userId && visible) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-red-100 p-5 rounded-lg w-10/12">
            <Text className="text-red-500 font-bold text-center">Error: User ID is missing</Text>
            <TouchableOpacity className="mt-4 p-3 bg-red-500 rounded-lg" onPress={onClose}>
              <Text className="text-white text-center font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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
            {localMissions.map((mission) => {
              const isAnswered = answeredMissions.has(mission.id);
              return (
                <View
                  key={mission.id}
                  className={`p-4 rounded-lg w-auto mr-2 ${
                    mission.completed ? 'bg-green-200' : 'bg-yellow-200'
                  }`}
                >
                  <Text className="font-bold mb-2">{mission.title}</Text>
                  <Text className="text-green-600 font-bold mb-4 text-sm">Reward: ₱{mission.reward}.00</Text>

                  <TouchableOpacity
                    className={`mt-2 p-2 rounded-lg items-center ${
                      mission.completed && !isAnswered
                        ? 'bg-green-500'
                        : mission.completed && isAnswered
                        ? 'bg-green-500 opacity-50'
                        : 'bg-gray-300 opacity-50'
                    }`}
                    onPress={() => handleCompleteMission(mission)}
                    disabled={!mission.completed || isAnswered} // Disable if not completed or already answered
                  >
                    <Text className="text-white font-bold">
                      {mission.completed ? '✅ Completed' : '🔒 In Progress'}
                    </Text>
                  </TouchableOpacity>

                  {mission.completed && (
                    <TouchableOpacity
                      className="mt-2 p-2 bg-purple-500 rounded-lg items-center"
                      onPress={() => handleViewAnswer(mission)}
                    >
                      <Text className="text-white font-bold">📖 View Answer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
      {renderQuestionModal()}
    </Modal>
  );
};