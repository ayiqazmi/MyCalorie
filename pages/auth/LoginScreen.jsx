import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, Dimensions, ImageBackground
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase-config';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
const [isLockedOut, setIsLockedOut] = useState(false);
const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
const [serverLockedOut, setServerLockedOut] = useState(false);


useEffect(() => {
  if (isLockedOut && lockoutTimeLeft > 0) {
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setIsLockedOut(false);
          //setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [isLockedOut, lockoutTimeLeft]);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified && user.email !== 'admin@gmail.com') {
        await auth.signOut();
        Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
        return;
      }

      const token = await user.getIdTokenResult();
      const isAdminClaim = token?.claims?.isAdmin;
      setFailedAttempts(0); // ✅ Reset only on successful login


      let isAdmin = false;
      if (typeof isAdminClaim === 'boolean') {
        isAdmin = isAdminClaim;
      } else {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../../config/firebase-config');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        isAdmin = userDoc.exists() && userDoc.data().isAdmin === true;
      }

      navigation.replace(isAdmin ? 'AdminDashboard' : 'Home');
} catch (error) {
  console.log("Login error:", error);

  const credentialErrors = [
    'auth/user-not-found',
    'auth/wrong-password',
    'auth/invalid-credential',
  ];

  if (credentialErrors.includes(error.code)) {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);

    if (newCount === 10) {
      Alert.alert(
        'Having Trouble?',
        'Too many failed attempts.\nWould you like to reset your password?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Password',
            onPress: () => {
              if (!email) {
                Alert.alert('Missing Email', 'Please enter your email first.');
              } else {
                handleForgotPassword();
              }
            },
          },
        ]
      );
    } else if (newCount >= 5) {
      setIsLockedOut(true);
      setLockoutTimeLeft(30);
      Alert.alert('Too Many Attempts', 'Please wait 30 seconds before trying again.');
    } else {
      Alert.alert('Login Failed', 'Incorrect username or password.');
    }
} else if (error.code === 'auth/too-many-requests') {
  setServerLockedOut(true); // ⬅️ add this

  Alert.alert(
    'Account Temporarily Locked',
    'Too many attempts. Your account has been temporarily locked by the server. Would you like to reset your password?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Password',
        onPress: () => {
          if (!email) {
            Alert.alert('Missing Email', 'Please enter your email first.');
          } else {
            handleForgotPassword();
          }
        },
      },
    ]
  );
}
 else {
  Alert.alert('Login Error', 'Something went wrong. Please try again later.');
}

}




  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'https://my-calorie-fyp.web.app/reset',
        handleCodeInApp: true,
        iOS: { bundleId: 'com.myfyp.mycalorie' },
        android: { packageName: 'com.myfyp.mycalorie', installApp: true, minimumVersion: '1' },
      });
      Alert.alert('Reset Link Sent', 'Check your email for the reset link.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
<ImageBackground
  source={require('../../assets/background.png')}
  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
  resizeMode="cover"
>

      <View style={styles.card}>
        <Image source={require('../../assets/MyCalorie.png')} style={styles.logo} />
        <Text style={styles.brandText}>MyCalorie</Text>

        {/* Email Input */}
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#fff"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputBox}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#fff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#fff"
                style={{ paddingHorizontal: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={handleLogin}
  style={[
    styles.loginButton,
    (isLockedOut || serverLockedOut) && { backgroundColor: '#ccc' },
  ]}
  disabled={isLockedOut || serverLockedOut}
>
  <Text style={styles.loginText}>
    {serverLockedOut
      ? 'Login disabled. Try again in 5 mins'
      : isLockedOut
      ? `Wait ${lockoutTimeLeft}s`
      : 'LOGIN'}
  </Text>
</TouchableOpacity>



        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signupText}>
            Don’t have an account? <Text style={{ fontWeight: 'bold' }}>SIGN UP</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: 'white',
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 24,
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#B388FF',
    borderRadius: 30,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    height: 50,
    color: '#fff',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotText: {
    color: '#6A1B9A',
    marginBottom: 16,
    fontSize: 13,
    alignSelf: 'flex-end',
  },
  loginButton: {
    backgroundColor: '#8E24AA',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 10,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signupText: {
    marginTop: 20,
    color: '#6A1B9A',
    fontSize: 14,
  },
});