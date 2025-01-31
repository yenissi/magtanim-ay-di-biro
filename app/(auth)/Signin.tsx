import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { Link } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Firebase_Auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { getDatabase, ref, get } from "firebase/database"; 

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // 🔹 Sign-In Function
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
    const userCredential = await signInWithEmailAndPassword(Firebase_Auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;

    // 🔹 Fetch all user details from Firebase Realtime Database
    const db = getDatabase();
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val(); // ✅ Get full user data object

      // 🔹 Navigate to Main.tsx and pass all user data
      router.push({
        pathname: "/Main",
        params: { ...userData, uid }, // Pass all user data as params
      });

    } else {
      Alert.alert("Error", "User data not found.");
    }
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/Grass.png")}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-gray-100 rounded-2xl p-6 w-11/12 max-w-xl shadow-lg">
          <Text className="text-2xl font-bold text-center mb-4">
            Welcome Back!
          </Text>

          {/* Email Input */}
          <Text className="text-lg mb-2">Email:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password Input */}
          <Text className="text-lg mb-2">Password:</Text>
          <View className="relative">
            <TextInput
              className="bg-yellow-200 rounded-lg p-4 mb-7 pr-12"
              placeholder="Enter your password"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              className="absolute right-4 top-7 transform -translate-y-1/2"
            >
              <Icon
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          {/* Sign-In Button */}
          <TouchableOpacity
            className="bg-yellow-400 rounded-lg border border-black py-3 items-center mb-4"
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="font-bold text-lg">
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="text-center items-center justify-center flex-row">
            <Text className="text-sm">Don’t have an account?{" "}</Text>
            <TouchableOpacity>
              <Link
                href={{
                  pathname: "/(auth)/Signup",
                  params: { Signun: "SignUp" },
                }}
              >
                <Text className="text-blue-500 underline">Create account</Text>
              </Link>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Signin;
