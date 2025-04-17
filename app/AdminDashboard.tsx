import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDatabase, ref, onValue } from "firebase/database";
import { signOut } from "firebase/auth";
import { Firebase_Auth,Firebase_Database } from "@/firebaseConfig";

const AdminDashboard = () => {
  const params = useLocalSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, "users");

    // Fetch all users
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersArray = Object.keys(usersData).map((uid) => ({
          uid,
          ...usersData[uid],
        }));
        setUsers(usersArray);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(Firebase_Auth);
    router.replace("/Signin");
  };

  const renderUser = ({ item }: { item: any }) => (
    <View className="p-4 border-b border-gray-300">
      <Text>Name: {item.firstName} {item.lastName}</Text>
      <Text>Email: {item.email}</Text>
      <Text>Money: ₱{item.money || 0}</Text>
      <Text>Role: {item.role}</Text>
    </View>
  );

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Admin Dashboard</Text>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
      />
      <TouchableOpacity
        className="bg-red-500 p-3 rounded-lg mt-4"
        onPress={handleLogout}
      >
        <Text className="text-white text-center">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AdminDashboard;