// components/MealImage.js
import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';

export default function MealImage({ uri, style }) {
  const [imgUri, setImgUri] = useState(uri?.trim() || fallbackUri);

  const fallbackUri = 'https://via.placeholder.com/80?text=Food';

  return (
    <Image
      source={{ uri: imgUri }}
      style={[styles.image, style]}
      onError={() => setImgUri(fallbackUri)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
});
