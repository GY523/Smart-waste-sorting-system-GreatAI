import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="ecopoints-scanner"
        options={{
          title: 'EcoPoints',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => <MaterialIcons name="recycling" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
