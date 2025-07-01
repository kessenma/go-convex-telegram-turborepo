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
            <Text>Your gateway to seamless communication</Text>
            
            <View style={{ marginTop: 20 }}>
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
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default LandingPage;