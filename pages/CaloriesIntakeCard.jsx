import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


export default function CaloriesIntakeCard({ totalCalories, weekData, todayLabel }) {
  const maxCalories = 2000; // Adjust this as your target
  
  

  return (
    <View style={styles.card}>
      {/* Title and 3-dot (optional) */}
      <View style={styles.header}>
        <Text style={styles.title}>Calories Intake</Text>
        <Text style={styles.dots}>•••</Text>
      </View>

      <View style={styles.content}>
        {/* Circular Display */}
        <View style={styles.circleContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Text style={styles.circleText}>{totalCalories}</Text>
            </View>
          </View>
          <Text style={styles.totalCalories}>{totalCalories} cals</Text>
        </View>

         {/* Bar Chart with Labels */}
 <View style={styles.barChart}>
          {weekData.map((item, index) => {
            const isToday = item.day === todayLabel;

            return (
              <View key={index} style={styles.barItem}>
                <Text style={styles.barValue}>{item.value}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (item.value / maxCalories) * 100 || 10,
                      backgroundColor: isToday ? '#6C63FF' : '#ccc',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dots: { fontSize: 20, color: '#999' },
  content: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  circleContainer: { alignItems: 'center', marginRight: 16 },
  progressCircle: { height: 60, width: 60 },
  circleTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    width: 60,
  },
  circleText: { fontSize: 16, color: '#00BCD4', fontWeight: 'bold' },
  totalCalories: { fontSize: 12, color: '#333', marginTop: 4 },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'space-between',
  },
  barItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    width: 8,
   //backgroundColor: isToday ? '#6C63FF' : '#ccc', // ✅ purple if today
    borderRadius: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
});
