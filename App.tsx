import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';
import AddReportScreen from './screens/AddReportScreen';
import ReportDetailsScreen from './screens/ReportDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Reports: { productId: string; productName: string };
  AddReport: { productId: string };
  ReportDetails: { report: any; productId: string }; // 👈 Add this
  Profile: undefined; // 👈 Add this
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
          options={({ route }) => ({ title: route.params.productName })}
        />
        <Stack.Screen
          name="AddReport"
          component={AddReportScreen}
          options={{ title: 'Add Report' }}
        />
        <Stack.Screen
          name="ReportDetails"
          component={ReportDetailsScreen}
          options={{ title: 'Report Details' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'My Profile' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
