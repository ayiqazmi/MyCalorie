import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { findMealImagePexels } from './askMealAI';

export default function MealImage({ mealName, style }) {
  const [imgUri, setImgUri] = useState('https://via.placeholder.com/80?text=Food');

  useEffect(() => {
    findMealImagePexels(mealName,"Your key here").then(setImgUri);
  }, [mealName]);

  return (
    <Image
      source={{ uri: imgUri }}
      style={style}
    />
  );
}
