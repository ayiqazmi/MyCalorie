import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function CustomSplashScreen({ onFinish }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof onFinish === 'function') onFinish();
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/background.png')} style={styles.background} />
      <View style={styles.content}>
        <Image source={require('../assets/MyCalorie.png')} style={styles.logo} />
        <Text style={styles.title}>MyCalorie</Text>
        <Text style={styles.subtitle}>A calorie tracking application{'\n'}that cater all your needs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    width,
    height,
    position: 'absolute',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C2DC7', // Purple, you can adjust if needed
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
});
