import { View, Text, ImageBackground, TextInput, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "react-native";
import { Link } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Firebase_Auth, Firebase_Database } from "@/firebaseConfig";

const Signup = () => {
  // State variables for form inputs
  const [userEmail, setUserEmail] = useState("");
  const [userpass, setUserpass] = useState("");
  const [userfname, setUserfname] = useState("");
  const [userlname, setUserlname] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Select School Function
  const handleSelectSchool = (value: string) => {
    setSelectedSchool(value);
  };

  // 🔹 Select Grade Level
  const handleSelectGrade = (level: string) => {
    setGradeLevel(level);
  };

  // 🔹 Signup Function
  const handleSignUp = async () => {
    if (!userEmail || !userpass || !userfname || !userlname || !selectedSchool || !gradeLevel) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(Firebase_Auth, userEmail, userpass);
      const user = userCredential.user;

      // 🔹 Save user data in Firebase Realtime Database
      await set(ref(Firebase_Database, `users/${user.uid}`), {
        firstName: userfname,
        lastName: userlname,
        email: userEmail,
        gradeLevel: gradeLevel,
        school: selectedSchool,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <ImageBackground source={require("../../assets/images/Grass.png")} style={{ flex: 1 }}>
      <StatusBar backgroundColor="#fff" barStyle={"dark-content"} />
      <View className="flex-1 justify-center items-center">
        {/* Form */}
        <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
          <Text className="text-2xl font-bold text-center mb-4">Create Account</Text>

          {/* Email Input */}
          <Text className="text-sm mb-2">Email:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={userEmail}
            onChangeText={setUserEmail}
          />

          {/* First Name & Last Name */}
          <View className="items-center flex-row gap-2">
            <View className="flex-col">
              <Text className="text-sm mb-2">Firstname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter Firstname"
                value={userfname}
                onChangeText={setUserfname}
              />
            </View>
            <View className="flex-col">
              <Text className="text-sm mb-2">Lastname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter Lastname"
                value={userlname}
                onChangeText={setUserlname}
              />
            </View>
          </View>

          {/* Password Input */}
          <Text className="text-sm mb-2">Password:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            secureTextEntry={true}
            placeholder="Enter Password"
            value={userpass}
            onChangeText={setUserpass}
          />

          {/* Grade Level Selection */}
          <Text className="text-sm mb-2">Grade Level:</Text>
          <View className="flex-row gap-2">
            {["Grade 4", "Grade 5", "Grade 6"].map((grade) => (
              <TouchableOpacity
                key={grade}
                className={`border border-black p-2 rounded-lg ${
                  gradeLevel === grade ? "bg-yellow-500" : "bg-yellow-200"
                }`}
                onPress={() => handleSelectGrade(grade)}
              >
                <Text className="text-sm">{grade}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* School Selection */}
          <Text className="text-sm mb-2 mt-4">School:</Text>
          {[
            { label: "CCES - Calauan Central", value: "CCES" },
            { label: "BCES - Balayhangin Central", value: "BCES" },
          ].map((school) => (
            <TouchableOpacity
              key={school.value}
              className="flex-row items-center mb-4"
              onPress={() => handleSelectSchool(school.value)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 border-gray-600 mr-3 justify-center items-center ${
                  selectedSchool === school.value ? "bg-blue-500 border-blue-500" : ""
                }`}
              >
                {selectedSchool === school.value && <View className="w-3 h-3 rounded-full bg-white" />}
              </View>
              <Text className="text-lg">{school.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Signup Button */}
          <TouchableOpacity
            className="bg-yellow-400 rounded-lg border border-black py-3 items-center mt-4"
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text className="font-bold text-lg">{loading ? "Signing Up..." : "Sign Up"}</Text>
          </TouchableOpacity>

          {/* Already have an Account */}
          <TouchableOpacity className="flex-row mt-4 items-center justify-center">
            <Text className="text-sm text-center mr-1">Already have an account?</Text>
            <Link href={{ pathname: "/(auth)/Signin", params: { Signin: "SignIn" } }}>
              <Text className="text-sm text-center text-blue-500 underline">Login</Text>
            </Link>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Signup;