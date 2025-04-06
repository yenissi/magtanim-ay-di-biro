import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { AntDesign, SimpleLineIcons, MaterialIcons } from "@expo/vector-icons";
import { ref, onValue, get, set } from "firebase/database";
import { Firebase_Database } from "@/firebaseConfig";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userData: any;
  gradeLevel: string;
  school: string;
  onSignOut: () => void;
}

type LeaderboardUser = {
  id: string;
  firstName: string;
  lastName: string;
  statistics: {
    plantsGrown: number;
    moneyEarned: number;
  };
};

export const ProfileModal = ({
  visible,
  onClose,
  userData,
  gradeLevel,
  school,
  onSignOut,
}: ProfileModalProps) => {
  const [leaderboardTab, setLeaderboardTab] = useState<'plants' | 'money'>('plants');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateLeaderboard = async () => {
    try {
      const usersSnapshot = await get(ref(Firebase_Database, 'users'));
      
      if (!usersSnapshot.exists()) {
        console.log("No users data found");
        return;
      }
      
      const users = usersSnapshot.val();
      const leaderboardData = {};
      
      Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (user.firstName && user.lastName) {
          leaderboardData[userId] = {
            firstName: user.firstName,
            lastName: user.lastName,
            statistics: {
              plantsGrown: user.statistics?.plantsGrown || 0,
              moneyEarned: user.statistics?.moneyEarned || 0
            }
          };
        }
      });
      
      await set(ref(Firebase_Database, 'leaderboard'), leaderboardData);
      console.log("Leaderboard updated successfully");
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  useEffect(() => {
    updateLeaderboard();
  }, []);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setError(null);
      fetchLeaderboardData();
    }
  }, [visible, leaderboardTab]);

  const fetchLeaderboardData = async () => {
    try {
      console.log("Fetching user data for leaderboard...");
      const dataRef = ref(Firebase_Database, 'users');
  
      onValue(dataRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const users: LeaderboardUser[] = [];
  
            Object.keys(data).forEach((userId) => {
              const user = data[userId];
              if (user.firstName && user.lastName) {
                const stats = {
                  plantsGrown: user.statistics?.plantsGrown || 0,
                  moneyEarned: user.statistics?.moneyEarned || 0,
                };
  
                users.push({
                  id: userId,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  statistics: stats,
                });
              }
            });
  
            setLeaderboardData(users);
          } else {
            setLeaderboardData([]);
          }
  
          setLoading(false);
        } catch (innerError) {
          console.error("Error processing snapshot data:", innerError);
          setError("Error processing data");
          setLoading(false);
        }
      }, (dbError) => {
        console.error("Firebase onValue error:", dbError);
        setError(`Database error: ${dbError.message}`);
        setLoading(false);
      });
    } catch (outerError) {
      console.error("Unexpected error in fetchLeaderboardData:", outerError);
      setError("Unexpected error occurred");
      setLoading(false);
    }
  };

  const renderLeaderboard = () => {
    if (loading) {
      return (
        <View className="h-36 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-2 text-xs">Loading leaderboard data...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="h-36 items-center justify-center">
          <MaterialIcons name="error-outline" size={24} color="red" />
          <Text className="mt-2">{error}</Text>
          <TouchableOpacity 
            className="mt-2 bg-orange-400 px-3 py-1 rounded-md"
            onPress={fetchLeaderboardData}
          >
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (leaderboardData.length === 0) {
      return (
        <View className="h-36 items-center justify-center">
          <Text>No leaderboard data available</Text>
        </View>
      );
    }

    // Sort users based on selected tab and take only top 5
    const sortedUsers = [...leaderboardData]
      .sort((a, b) => {
        if (leaderboardTab === 'plants') {
          return b.statistics.plantsGrown - a.statistics.plantsGrown;
        } else {
          return b.statistics.moneyEarned - a.statistics.moneyEarned;
        }
      })
      .slice(0, 5);

    // Find current user's rank (even if not in top 5)
    const allSortedUsers = [...leaderboardData].sort((a, b) => {
      if (leaderboardTab === 'plants') {
        return b.statistics.plantsGrown - a.statistics.plantsGrown;
      } else {
        return b.statistics.moneyEarned - a.statistics.moneyEarned;
      }
    });
    const currentUserRank = allSortedUsers.findIndex(user => user.id === userData?.uid) + 1;

    return (
      <View className="mt-2">
        <View className="flex-row mb-2 px-2 py-1 bg-orange-400 rounded-md">
          <Text className="font-bold text-xs">Rank</Text>
          <Text className="flex-1 font-bold text-xs">Name</Text>
          <Text className="font-bold text-xs text-right">
            {leaderboardTab === 'plants' ? 'Plants Grown' : 'Money Earned'}
          </Text>
        </View>
        
        <ScrollView className="h-36 border border-black-400 rounded-md">
          {sortedUsers.map((user, index) => {
            const isCurrentUser = user.id === userData?.uid;
            const value = leaderboardTab === 'plants' 
              ? user.statistics.plantsGrown 
              : `₱${user.statistics.moneyEarned}`;
            
            return (
              <View 
                key={user.id} 
                className={`flex-row items-center px-2 py-1 border-b border-black-200 ${isCurrentUser ? 'bg-black-100' : ''}`}
              >
                <View className="w-10">
                  <Text className="font-bold text-xs">#{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-xs ${isCurrentUser ? 'font-bold' : ''}`}>
                    {user.firstName} {user.lastName} {isCurrentUser ? '(You)' : ''}
                  </Text>
                </View>
                <View className="w-20 items-end">
                  <Text className="text-xs">{value}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
        
        {userData?.uid && (
          <View className="mt-1 bg-orange-50 p-1 rounded-md border border-orange-300">
            <Text className="text-xs text-center">
              Your Rank: {currentUserRank > 0 ? `#${currentUserRank}` : 'Not ranked'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderUserStats = () => {
    const plantsGrown = userData?.statistics?.plantsGrown || 0;
    const moneyEarned = userData?.statistics?.moneyEarned || 0;
    
    return (
      <View className="border-2 border-black mt-1 rounded-lg p-2">
        <Text className="text-base font-bold text-center">Your Statistics</Text>
        <View className="flex-row justify-around mt-1">
          <View className="items-center">
            <MaterialIcons name="eco" size={20} color="green" />
            <Text className="text-xs">Plants Grown</Text>
            <Text className="font-bold">{plantsGrown}</Text>
          </View>
          <View className="items-center">
            <MaterialIcons name="monetization-on" size={20} color="gold" />
            <Text className="text-xs">Money Earned</Text>
            <Text className="font-bold">{moneyEarned}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-orange-300 p-5 rounded-lg w-[80%] border border-black max-h-[80%]">
          <ScrollView>
            <Text className="text-lg font-bold text-center">User Profile</Text>
            <Pressable className="absolute right-1 top-5 p-2" onPress={onClose}>
              <AntDesign name="close" size={20} color="black" />
            </Pressable>
            <View>
              <View className="flex-row gap-4 mb-3">
                <View className="items-center justify-center rounded-lg p-3 border-2 border-black">
                  <SimpleLineIcons name="user" size={44} color="black" />
                </View>
                <View>
                  <Text className="text-base text-black-600 font-light">FullName: {userData?.firstName} {userData?.lastName}</Text>
                  <Text className="text-base text-black-600 font-light">Grade Level: {gradeLevel}</Text>
                  <Text className="text-base text-black-600 font-light">School: {school}</Text>
                </View>
              </View>
            </View>

            {renderUserStats()}

            <View className="border-2 border-black mt-3 rounded-lg p-2">
              <Text className="text-base font-bold text-center">Leaderboard</Text>
              <View className="flex-row mt-2">
                <TouchableOpacity 
                  className={`flex-1 p-2 rounded-tl-md rounded-tr-md ${leaderboardTab === 'plants' ? 'bg-orange-400' : 'bg-orange-200'}`}
                  onPress={() => setLeaderboardTab('plants')}
                >
                  <Text className="text-center text-xs font-medium">Plants Grown</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`flex-1 p-2 rounded-tl-md rounded-tr-md ${leaderboardTab === 'money' ? 'bg-orange-400' : 'bg-orange-200'}`}
                  onPress={() => setLeaderboardTab('money')}
                >
                  <Text className="text-center text-xs font-medium">Money Earned</Text>
                </TouchableOpacity>
              </View>
              {renderLeaderboard()}
            </View>

            <TouchableOpacity
              className="bg-red-500 p-3 mt-4 rounded-md"
              onPress={onSignOut}
            >
              <Text className="text-black text-center font-bold">Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};