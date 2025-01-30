import { View, Text, ImageBackground, TextInput, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import { StatusBar } from "react-native";
import Icon from "react-native-vector-icons/Feather";
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

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
      Alert.alert("Error!", "Please fill out all fields.");
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

      Alert.alert("Success!", "Account created successfully!");
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

          {/* First Name & Last Name */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-sm mb-2">Firstname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter First Name"
                value={userfname}
                onChangeText={setUserfname}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm mb-2">Lastname:</Text>
              <TextInput
                className="bg-yellow-200 rounded-lg p-4 mb-4"
                placeholder="Enter Last Name"
                value={userlname}
                onChangeText={setUserlname}
              />
            </View>
          </View>

          {/* Email Input */}
          <Text className="text-sm mb-2">Email:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            placeholder="Enter Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={userEmail}
            onChangeText={setUserEmail}
          />

          {/* Password Input */}
          <Text className="text-sm mb-2">Password:</Text>
          <View className="relative">
            <TextInput
              className="bg-yellow-200 rounded-lg p-4 mb-4 pr-12"
              secureTextEntry={!isPasswordVisible}
              placeholder="Enter Password"
              value={userpass}
              onChangeText={setUserpass}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              className="absolute right-4 top-7 -translate-y-1/2"
            >
              <Icon
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>


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
            { label: "CCES - Calauan Central Elementary School", value: "CCES" },
            { label: "BES - Balayhangin Elementary School", value: "BCES" },
          ].map((school) => (
            <TouchableOpacity
              key={school.value}
              className="flex-row items-center mb-4"
              onPress={() => handleSelectSchool(school.value)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  selectedSchool === school.value ? "bg-green-500 border-gray-600" : "border-gray-600"
                }`}
              />
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
              <Text className="text-sm text-center text-blue-500 underline">Log In</Text>
            </Link>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Signup;