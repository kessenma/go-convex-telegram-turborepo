import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

interface Step {
  id: number;
  title: string;
  description: string;
  code?: string;
  isCompleted: boolean;
}

const ConnectionGuideScreen = () => {
  const navigation = useNavigation();
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Install Dependencies',
      description: 'Install the required packages for Telegram bot integration',
      code: 'npm install telegraf dotenv',
      isCompleted: false,
    },
    {
      id: 2,
      title: 'Create Bot Token',
      description: 'Create a new bot with @BotFather on Telegram and get your bot token',
      isCompleted: false,
    },
    {
      id: 3,
      title: 'Set Environment Variables',
      description: 'Add your bot token to your environment configuration',
      code: 'TELEGRAM_BOT_TOKEN=your_bot_token_here\nCONVEX_DEPLOYMENT_URL=your_convex_url',
      isCompleted: false,
    },
    {
      id: 4,
      title: 'Configure Webhook',
      description: 'Set up webhook URL for receiving Telegram updates',
      code: 'https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WEBHOOK_URL>',
      isCompleted: false,
    },
    {
      id: 5,
      title: 'Test Connection',
      description: 'Send a test message to verify the connection is working',
      isCompleted: false,
    },
  ]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleStepCompletion = (stepId: number) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
      )
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Code copied to clipboard!');
  };

  const renderStep = (step: Step) => (
    <View key={step.id} style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            step.isCompleted && styles.checkboxCompleted,
          ]}
          onPress={() => toggleStepCompletion(step.id)}
        >
          {step.isCompleted && (
            <Icon name="check" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
        <Text style={styles.stepNumber}>Step {step.id}</Text>
      </View>
      
      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepDescription}>{step.description}</Text>
      
      {step.code && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{step.code}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(step.code!)}
          >
            <Icon name="copy" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connection Guide</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progress: {completedSteps}/{steps.length} steps completed
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introContainer}>
          <Icon name="zap" size={32} color="#007AFF" />
          <Text style={styles.introTitle}>Telegram Bot Setup</Text>
          <Text style={styles.introDescription}>
            Follow these steps to connect your Telegram bot to the application.
            Each step is essential for proper functionality.
          </Text>
        </View>

        {steps.map(renderStep)}

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpDescription}>
            If you encounter any issues during setup, check the documentation
            or contact support for assistance.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Icon name="help-circle" size={20} color="#007AFF" />
            <Text style={styles.helpButtonText}>View Documentation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  introContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  introDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  helpContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  helpButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ConnectionGuideScreen;