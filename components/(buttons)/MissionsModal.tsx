import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
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

interface ApiResponse {
  mission_id: number;
  detailed_scores: {
    Knowledge_Agriculture_Score: number;
    Awareness_Local_Agriculture_Score: number;
    Use_of_Example_Data_Score: number;
    Average_Score: number;
  };
  qualitative_assessment?: string;
  predictions?: any;
  error?: string;
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
  const [answeredMissions, setAnsweredMissions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerModalVisible, setAnswerModalVisible] = useState(false); // New state for custom modal
  const [answerData, setAnswerData] = useState<{
    answer: string;
    scores?: {
      Knowledge_Agriculture_Score: number;
      Awareness_Local_Agriculture_Score: number;
      Use_of_Example_Data_Score: number;
      Average_Score: number;
    };
  } | null>(null); // New state for answer data

  const API_BASE_URL = 'https://magtanim-api-508922549344.us-central1.run.app';
  const API_TIMEOUT = 30000;

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
    if (selectedMission) {
      setAnswer('');
      setErrorMessage(null);
    }
  }, [selectedMission]);

  const validateAnswer = (text: string) => {
    if (!text.trim()) return "Please enter an answer";
    if (text.trim().length <= 1) return "Answer is too short";
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 5) return "Your answer must contain at least 5 words";
    return null;
  };

  const handleCompleteMission = (mission: Mission) => {
    if (answeredMissions.has(mission.id)) {
      return;
    }
    setSelectedMission(mission);
  };

  const checkConnectivity = async () => {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        return false;
      }
      const response = await fetch(API_BASE_URL, { method: 'GET', timeout: 5000 });
      return response.ok;
    } catch (error) {
      console.error("Connectivity check failed:", error);
      return false;
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedMission || !userId) return;

    const isOnline = await checkConnectivity();
    if (!isOnline) {
      Alert.alert(
        "Connection Error",
        "Cannot reach the server. Please check your internet connection and try again.",
        [
          { text: "OK", onPress: () => {} },
          { text: "Retry", onPress: () => handleSubmitAnswer() },
        ]
      );
      return;
    }

    const validationError = validateAnswer(answer);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      const response = await fetch(`${API_BASE_URL}/process-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission_id: selectedMission.id,
          answer: answer,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process answer');
      }

      const result = await response.json();

      const missionData = {
        answer,
        completedAt: new Date().toISOString(),
        missionId: selectedMission.id,
        questionEnglish: selectedMission.questions.english,
        questionTagalog: selectedMission.questions.tagalog,
        predictions: result.predictions,
        detailedScores: result.detailed_scores,
      };

      const userMissionRef = ref(Firebase_Database, `users/${userId}/missionsCompleted/${selectedMission.id}`);
      await update(userMissionRef, missionData);

      setAnsweredMissions(prev => new Set(prev).add(selectedMission.id));
      onMissionComplete(selectedMission.id, answer);

      setSelectedMission(null);
      setAnswer('');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setErrorMessage("Request timed out. Please try again.");
      } else {
        setErrorMessage(error.message || "Error submitting answer. Please try again.");
      }
      console.error("Error saving mission answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRemark = (score: any, category: string) => {
    const normalizedScore = Math.round(Number(score)); // Convert to number and round to nearest integer
    if (isNaN(normalizedScore) || normalizedScore < 1 || normalizedScore > 5) {
      return "Invalid score.";
    }
  
    switch (category) {
      case 'Knowledge':
        if (normalizedScore === 5) return "Demonstrated an in-depth understanding of agricultural concepts and provided detailed, accurate information.";
        if (normalizedScore === 4) return "Showed a good understanding of most basic agricultural concepts with minor inaccuracies.";
        if (normalizedScore === 3) return "Displayed a basic understanding with some relevant details but had some inaccuracies or gaps.";
        if (normalizedScore === 2) return "Showed limited understanding of basic concepts with several inaccuracies.";
        if (normalizedScore === 1) return "Lacked understanding of agricultural concepts, providing little to no relevant information.";
        return "No remark available for this score.";
      case 'Awareness':
        if (normalizedScore === 5) return "Clearly described local agricultural practices, including specific examples relevant to the Philippines.";
        if (normalizedScore === 4) return "Described most local agricultural practices accurately with a few specific examples.";
        if (normalizedScore === 3) return "Showed some awareness of local practices but lacked specific examples.";
        if (normalizedScore === 2) return "Had limited awareness of local agricultural practices.";
        if (normalizedScore === 1) return "Showed very little awareness of local practices.";
        return "No remark available for this score.";
      case 'Examples':
        if (normalizedScore === 5) return "Provided multiple, specific examples and rich details to support the response.";
        if (normalizedScore === 4) return "Included some specific examples and relevant details but lacked depth.";
        if (normalizedScore === 3) return "Used a few examples and details, which may have been vague or general.";
        if (normalizedScore === 2) return "Provided minimal examples or details, often irrelevant or superficial.";
        if (normalizedScore === 1) return "No examples or details provided.";
        return "No remark available for this score.";
      default:
        return "No remark available.";
    }
  };

  const handleViewAnswer = async (mission: Mission) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const missionRef = ref(Firebase_Database, `users/${userId}/missionsCompleted/${mission.id}`);
      const snapshot = await get(missionRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("Detailed Scores:", data.detailedScores);
        setAnswerData({
          answer: data.answer,
          scores: data.detailedScores,
        });
        setAnswerModalVisible(true);
      } else {
        Alert.alert("No Answer", "No answer submitted yet.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Error fetching answer:", error);
      Alert.alert("Error", "Error loading your answer.", [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderScoreStars = (score: number) => {
    const fullStars = Math.floor(score);
    const halfStar = score - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <Text>
        {'★'.repeat(fullStars)}
        {halfStar ? '½' : ''}
        {'☆'.repeat(emptyStars)}
      </Text>
    );
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
              className={`border ${errorMessage ? 'border-red-500' : 'border-black-300'} p-2 rounded-lg h-[120px]`}
              placeholder="Enter your answer... (minimum 5 words)"
              multiline
              textAlignVertical="top"
              value={answer}
              onChangeText={(text) => {
                setAnswer(text);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            {errorMessage ? (
              <Text className="text-red-500 text-sm mt-1">{errorMessage}</Text>
            ) : null}

            <Text className="text-gray-600 text-xs mt-1">
              Word count: {answer.trim().split(/\s+/).filter(Boolean).length}/5 minimum
            </Text>

            <TouchableOpacity
              className={`p-3 rounded-lg mt-2 ${isLoading ? 'bg-gray-400' : !errorMessage && answer.trim() ? 'bg-green-500' : 'bg-gray-300'}`}
              onPress={handleSubmitAnswer}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-bold">
                {isLoading ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-2 p-3 bg-red-500 rounded-lg"
              onPress={() => setSelectedMission(null)}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAnswerModal = () => {
    if (!answerModalVisible || !answerData) return null;

    return (
      <Modal visible={answerModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-orange-300 p-6 rounded-lg w-[500px] h-96">
            <Text className="text-lg font-bold mb-4">Your Answer</Text>
            <Text className="text-gray-800 mb-4">{answerData.answer}</Text>

            {answerData.scores ? (
              <ScrollView className="max-h-64">
                <View className="mb-4">
                  <Text className="font-bold ">Knowledge</Text>
                  <Text>Score: {answerData.scores.Knowledge_Agriculture_Score}/5</Text>
                  <Text className="text-sm text-gray-600">
                    Remark: {getRemark(answerData.scores.Knowledge_Agriculture_Score, 'Knowledge')}
                  </Text>
                </View>
                <View className="mb-4">
                  <Text className="font-bold ">Awareness</Text>
                  <Text>Score: {answerData.scores.Awareness_Local_Agriculture_Score}/5</Text>
                  <Text className="text-sm text-gray-600">
                    Remark: {getRemark(answerData.scores.Awareness_Local_Agriculture_Score, 'Awareness')}
                  </Text>
                </View>
                <View className="mb-4">
                  <Text className="font-bold ">Examples</Text>
                  <Text>Score: {answerData.scores.Use_of_Example_Data_Score}/5</Text>
                  <Text className="text-sm text-gray-600">
                    Remark: {getRemark(answerData.scores.Use_of_Example_Data_Score, 'Examples')}
                  </Text>
                </View>
                <View>
                  <Text className="font-bold ">Average</Text>
                  <Text>Score: {answerData.scores.Average_Score}/5</Text>
                </View>
              </ScrollView>
            ) : (
              <Text className="text-gray-600">No detailed scores available</Text>
            )}

            <TouchableOpacity
              className="mt-4 p-3 bg-purple-500 rounded-lg"
              onPress={() => setAnswerModalVisible(false)}
              disabled={isLoading}
            >
              <Text className="text-white text-center font-bold ">Close</Text>
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
              const isCompleted = mission.completed;
              return (
                <View
                  key={mission.id}
                  className={`p-4 rounded-lg w-auto mr-2 ${isAnswered ? 'bg-green-200' : isCompleted ? 'bg-yellow-300' : 'bg-yellow-200'}`}
                >
                  <Text className="font-bold mb-2">{mission.title}</Text>
                  <Text className="text-green-600 font-bold mb-4 text-sm">Reward: ₱{mission.reward}.00</Text>

                  <TouchableOpacity
                    className={`mt-2 p-2 rounded-lg items-center ${
                      isAnswered ? 'bg-gray-400' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    onPress={() => handleCompleteMission(mission)}
                    disabled={isAnswered || isLoading}
                  >
                    <Text className="text-white font-bold">
                      {isAnswered ? '✅ Answered' : isCompleted ? '✅ Completed' : '📝 Answer'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mt-2 p-2 bg-purple-500 rounded-lg items-center"
                    onPress={() => handleViewAnswer(mission)}
                    disabled={isLoading}
                  >
                    <Text className="text-white font-bold">📖 View Answer</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
      {renderQuestionModal()}
      {renderAnswerModal()} 
    </Modal>
  );
};