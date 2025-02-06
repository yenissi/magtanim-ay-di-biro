import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Firebase_Auth, Firebase_Database } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Feather";
import { Link } from "expo-router";
import { INITIAL_GAME_STATE } from "@/config/gameConfig";

const Signup = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [userfname, setUserfname] = useState<string>("");
  const [userlname, setUserlname] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleSelectGrade = (grade: string) => {
    setGradeLevel(grade);
  };

  const handleSelectSchool = (school: string) => {
    setSelectedSchool(school);
  };

  const validateInputs = () => {
    if (!userEmail.trim() || !password.trim() || !userfname.trim() || !userlname.trim() || !selectedSchool || !gradeLevel) {
      Alert.alert("Error", "Please fill out all fields.");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return false;
    }

    if (userfname.length < 2 || userlname.length < 2) {
      Alert.alert("Error", "Names must be at least 2 characters long.");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        Firebase_Auth,
        userEmail.trim(),
        password
      );
      const user = userCredential.user;

      await set(ref(Firebase_Database, `users/${user.uid}`), {
        firstName: userfname.trim(),
        lastName: userlname.trim(),
        email: userEmail.trim(),
        gradeLevel,
        school: selectedSchool,
        createdAt: new Date().toISOString(),
        ...INITIAL_GAME_STATE,
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.push("/Signin") },
      ]);
    } catch (error: any) {
      let errorMessage = "Failed to create account";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak";
          break;
        default:
          errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/Grass.png")}
      style={{ flex: 1 }}
    >
      <ScrollView>
        <View className="flex-1 justify-center items-center py-8">
          <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
            <Text className="text-2xl font-bold text-center mb-4">
              Create Account
            </Text>

            {/* First Name & Last Name */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm mb-2">First Name:</Text>
                <TextInput 
                  className="bg-yellow-200 rounded-lg p-4 mb-4" 
                  placeholder="Enter First Name" 
                  value={userfname} 
                  onChangeText={setUserfname}
                  autoCapitalize="words"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm mb-2">Last Name:</Text>
                <TextInput 
                  className="bg-yellow-200 rounded-lg p-4 mb-4" 
                  placeholder="Enter Last Name" 
                  value={userlname} 
                  onChangeText={setUserlname}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-sm mb-2">Email:</Text>
              <TextInput 
                className="bg-yellow-200 rounded-lg p-4 mb-4" 
                placeholder="Enter Email" 
                keyboardType="email-address" 
                autoCapitalize="none"
                value={userEmail} 
                onChangeText={setUserEmail}
              />
            </View>

            {/* Password Input */}
            <Text className="text-sm mb-2">Password:</Text>
            <View className="relative">
              <TextInput 
                className="bg-yellow-200 rounded-lg p-4 mb-4 pr-12"
                secureTextEntry={!isPasswordVisible}
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
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
            <View className="flex-row gap-2 mb-4">
              {["Grade 4", "Grade 5", "Grade 6"].map((grade) => (
                <TouchableOpacity
                  key={grade}
                  className={`flex-1 border border-black p-2 rounded-lg ${
                    gradeLevel === grade ? "bg-yellow-500" : "bg-yellow-200"
                  }`}
                  onPress={() => handleSelectGrade(grade)}
                >
                  <Text className="text-sm text-center">{grade}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* School Selection */} 
            <View className="mb-4">
              <Text className="text-sm mb-2">Select a School:</Text>
              {["Calauan", "Balayhangin"].map((school) => (
                <TouchableOpacity 
                  key={school} 
                  className="flex-row items-center mb-4" 
                  onPress={() => handleSelectSchool(school)}
                >
                  <View 
                    className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      selectedSchool === school ? "bg-yellow-500" : "border-yellow-200"
                    }`} 
                  />
                  <Text>{school}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              className={`bg-yellow-400 rounded-lg border border-black py-3 items-center mt-4 ${
                loading ? 'opacity-50' : ''
              }`}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text className="font-bold text-lg">
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row mt-4 items-center justify-center">
              <Text className="text-sm text-center mr-1">
                Already have an account?
              </Text>
              <Link href="/Signin">
                <Text className="text-blue-500 underline">Sign In</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Signup;