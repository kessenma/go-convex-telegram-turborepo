import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

// Define the navigation param list type
type RootStackParamList = {
    MainTabs: undefined
    LoginScreen: undefined
}

type LandingPageNavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>

const LandingPage = () => {
    const navigation = useNavigation<LandingPageNavigationProp>();

    const handleLoginPress = () => {
        navigation.navigate('LoginScreen')
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to mobile</Text>
            <Text style={styles.subtitle}>Your gateway to seamless communication</Text>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default LandingPage;