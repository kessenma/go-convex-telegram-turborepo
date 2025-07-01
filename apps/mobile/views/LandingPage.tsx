import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { LandingPageNavigationProp } from './navigationTypes';

const LandingPage = () => {
    const navigation = useNavigation<LandingPageNavigationProp>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to mobile</Text>
            <CustomButton title="About" onPress={() => {}} />
            <CustomButton
                title="Login"
                onPress={() => navigation.navigate('LoginScreen')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default LandingPage;