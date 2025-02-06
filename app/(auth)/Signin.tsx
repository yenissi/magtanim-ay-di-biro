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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

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
        Alert.alert("Error", "User account not found. Please sign up first.");
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

          <Text className="text-lg mb-2">Email:</Text>
          <TextInput
            className="bg-yellow-200 rounded-lg p-4 mb-4"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

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
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-4 top-7 transform -translate-y-1/2"
            >
              <Icon
                name={isPasswordVisible ? "eye-off" : "eye"}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-yellow-400 rounded-lg border border-black py-3 items-center mb-4"
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="font-bold text-lg">
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

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