import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';




const AboutScreen = () => {

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>About Our App</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission</Text>
                <Text style={styles.description}>
                    We're building the future of seamless communication through innovative mobile technology.
                </Text>
            </View>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Features</Text>
                <Text style={styles.description}>
                    • Secure messaging{"\n"}
                    • Real-time notifications{"\n"}
                    • Cross-platform compatibility{"\n"}
                    • User-friendly interface
                </Text>
            </View>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <Text style={styles.description}>
                    Have questions or feedback? We'd love to hear from you!
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    contentContainer: {
        padding: 20,
    },
    header: {
        paddingTop: 60, // Account for status bar
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 25,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    featureList: {
        gap: 8,
    },
    featureItem: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    techList: {
        gap: 6,
    },
    techItem: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    version: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    copyright: {
        fontSize: 12,
        color: '#999',
    },
});

export default AboutScreen;