import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { Firebase_Auth } from "@/firebaseConfig";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Email validation function
  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      setEmailError("Invalid email address.");
    } else {
      setEmailError("");
    }
  };

  // Password validation function
  const validatePassword = (text: string) => {
    setPassword(text);
    if (text.length < 6) {
      setPasswordError("Invalid password.");
    } else {
      setPasswordError("");
    }
  };

  const validateInputs = () => {
      let isValid = true;
  
      if (!email.trim()) {
        setEmailError("Email is required.");
        isValid = false;
      }
    
      if (!password.trim()) {
        setPasswordError("Password is required.");
        isValid = false;
      }
  
      return isValid;
    };

  const handleSignIn = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        Firebase_Auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        Alert.alert("Error Sign In", "User account not found. Please sign up first.");
        return;
      }

      const userData = snapshot.val();

      router.push({
        pathname: "/Main",
        params: {
          ...userData,
          uid: user.uid,
        },
      });
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address format";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/Grass.png")}
      style={{ flex: 1 }}
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View className="flex-1 justify-center items-center">
        <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
          <Text className="text-2xl font-bold text-center mb-4">
            Welcome Back!
          </Text>

          {/* Email Input */}
          <Text className="text-lg mb-2">Email:</Text>
          <TextInput
            className={`bg-yellow-200 rounded-lg p-4 mb-2 ${
              emailError ? "border-red-500 border-2" : ""
            }`}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={validateEmail}
          />
          {emailError ? (
            <Text className="text-red-500 text-sm mb-3">{emailError}</Text>
          ) : null}

          {/* Password Input */}
          <Text className="text-lg mb-2">Password:</Text>
          <View className="relative">
            <TextInput
              className={`bg-yellow-200 rounded-lg p-4 mb-2 pr-12 ${
                passwordError ? "border-red-500 border-2" : ""
              }`}
              placeholder="Enter your password"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={validatePassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-4 top-4"
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

          {/* Sign In Button */}
          <TouchableOpacity
            className="bg-yellow-400 rounded-lg border border-black py-3 items-center mb-4 mt-4"
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="font-bold text-lg">
              {loading ? "Logging In..." : "Log In"}
            </Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <View className="text-center items-center justify-center flex-row">
            <Text className="text-sm">Don't have an account? </Text>
            <Link href="/Signup">
              <Text className="text-blue-500 underline">Create account</Text>
            </Link>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Signin;