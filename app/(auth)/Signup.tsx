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
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [userfname, setUserfname] = useState<string>("");
  const [userlname, setUserlname] = useState<string>("");
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedGender, setGender] = useState<string | null>(null);
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

  const handleSelectGender = (gender: string) => {
    setGender(gender);
  };

  // Email validation function
  const validateEmail = (text: string) => {
    setUserEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      setEmailError("Enter valid email address.");
    } else {
      setEmailError("");
    }
  };

  // Password validation function
  const validatePassword = (text: string) => {
    setPassword(text);
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{6,}$/;
    
    if (!passwordRegex.test(text)) {
      setPasswordError("Must be at least 6 characters. Include an uppercase letter [A-Z], a number [0-9], and a special character [@$!%*?&_].");
    } else {
      setPasswordError("");
    }
  };

  const validateInputs = () => {
    let isValid = true;

    if (!userfname.trim() || userfname.length < 2) {
      setFirstNameError("First name is required.");
      isValid = false;
    } else {
      setFirstNameError("");
    }

    if (!userlname.trim() || userlname.length < 2) {
      setLastNameError("Last name is required.");
      isValid = false;
    } else {
      setLastNameError("");
    }

    if (!userEmail.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    }
  
    if (!password.trim()) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    if (!selectedSchool) {
      Alert.alert("Error", "Please select a school.");
      isValid = false;
    }

    if (!gradeLevel) {
      Alert.alert("Error", "Please select a grade level.");
      isValid = false;
    }

    return isValid;
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
        <View className="flex-1 justify-center items-center py-36">
          <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
            <Text className="text-2xl font-bold text-center mb-4">
              Create Account
            </Text>

            {/* First Name & Last Name */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-sm mb-2">First Name:</Text>
                <TextInput 
                  className={`bg-yellow-200 rounded-lg p-4 mb-1 ${
                    firstNameError ? "border-red-500 border-2" : ""
                  }`} 
                  placeholder="Enter First Name" 
                  value={userfname} 
                  onChangeText={(text) => {
                    setUserfname(text);
                    if (text.trim().length > 1) setFirstNameError("");
                  }}
                  autoCapitalize="words"
                />
                {firstNameError ? (
                  <Text className="text-red-500 text-sm mb-3">{firstNameError}</Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text className="text-sm mb-2">Last Name:</Text>
                <TextInput 
                  className={`bg-yellow-200 rounded-lg p-4 mb-1 ${
                    lastNameError ? "border-red-500 border-2" : ""
                  }`} 
                  placeholder="Enter Last Name" 
                  value={userlname} 
                  onChangeText={(text) => {
                    setUserlname(text);
                    if (text.trim().length > 1) setLastNameError("");
                  }}
                  autoCapitalize="words"
                />
                {lastNameError ? (
                  <Text className="text-red-500 text-sm mb-3">{lastNameError}</Text>
                ) : null}
              </View>
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-sm mb-2">Email:</Text>
              <TextInput 
                className={`bg-yellow-200 rounded-lg p-4 mb-2 ${
                  emailError ? "border-red-500 border-2" : ""
                }`}
                placeholder="Enter Email" 
                keyboardType="email-address" 
                autoCapitalize="none"
                value={userEmail} 
                onChangeText={validateEmail}
              />
              {emailError ? (
                <Text className="text-red-500 text-sm mb-3">{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <Text className="text-sm mb-2">Password:</Text>
            <View className="relative">
              <TextInput 
                className={`bg-yellow-200 rounded-lg p-4 mb-2 pr-12 ${
                  passwordError ? "border-red-500 border-2" : ""
                }`}
                placeholder="Enter Password"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={validatePassword}

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
            {passwordError ? (
              <Text className="text-red-500 text-sm mb-3">{passwordError}</Text>
            ) : null}

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
            {/* Gender */}
            <Text className="text-sm mb-2">Sex:</Text>
            <View className="flex-row gap-2">
              {["Male", "Female"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  className={`flex-1 border border-black p-2 rounded-lg ${
                    gender === selectedGender? "bg-yellow-500" : "bg-yellow-200"
                  }`}
                  onPress={() => handleSelectGender(gender)}
                >
                  <Text className="text-sm text-center">{gender}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* School Selection */} 
            <View className="mb-4">
              <Text className="text-sm mb-3">Select a School:</Text>
              {["Calauan Central Elementary School", "Balayhangin Elementary School"].map((school) => (
                <TouchableOpacity 
                  key={school} 
                  className="flex-row items-center mb-2" 
                  onPress={() => handleSelectSchool(school)}
                >
                  <View 
                    className={`w-5 h-5 rounded-full border-2 mr-3 ${
                      selectedSchool === school ? "bg-yellow-500" : "border-black"
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
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row mt-4 items-center justify-center">
              <Text className="text-sm text-center mr-1">
                Already have an account?
              </Text>
              <Link href="/Signin">
                <Text className="text-blue-500 underline">Log In</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Signup;