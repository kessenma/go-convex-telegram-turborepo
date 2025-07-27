import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

interface ConsoleLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source?: string;
}

const OpenConsoleScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [command, setCommand] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([
    {
      id: '1',
      timestamp: new Date(),
      level: 'info',
      message: 'Console initialized. Type "help" for available commands.',
      source: 'system',
    },
  ]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const addLog = (level: ConsoleLog['level'], message: string, source = 'system') => {
    const newLog: ConsoleLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      source,
    };
    setLogs(prev => [...prev, newLog]);
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    
    addLog('info', `> ${cmd}`, 'user');
    
    switch (trimmedCmd) {
      case 'help':
        addLog('info', 'Available commands:');
        addLog('info', '  connect - Connect to Telegram bot');
        addLog('info', '  disconnect - Disconnect from bot');
        addLog('info', '  status - Show connection status');
        addLog('info', '  clear - Clear console logs');
        addLog('info', '  test - Send test message');
        addLog('info', '  logs - Show recent activity');
        break;
      
      case 'connect':
        if (isConnected) {
          addLog('warning', 'Already connected to Telegram bot');
        } else {
          addLog('info', 'Connecting to Telegram bot...');
          setTimeout(() => {
            setIsConnected(true);
            addLog('success', 'Successfully connected to Telegram bot');
          }, 1500);
        }
        break;
      
      case 'disconnect':
        if (!isConnected) {
          addLog('warning', 'Not connected to any bot');
        } else {
          addLog('info', 'Disconnecting from Telegram bot...');
          setTimeout(() => {
            setIsConnected(false);
            addLog('info', 'Disconnected from Telegram bot');
          }, 1000);
        }
        break;
      
      case 'status':
        addLog('info', `Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
        if (isConnected) {
          addLog('info', 'Bot ID: @your_bot_name');
          addLog('info', 'Webhook: Active');
          addLog('info', 'Last activity: 2 minutes ago');
        }
        break;
      
      case 'clear':
        setLogs([{
          id: Date.now().toString(),
          timestamp: new Date(),
          level: 'info',
          message: 'Console cleared.',
          source: 'system',
        }]);
        break;
      
      case 'test':
        if (!isConnected) {
          addLog('error', 'Not connected. Use "connect" command first.');
        } else {
          addLog('info', 'Sending test message...');
          setTimeout(() => {
            addLog('success', 'Test message sent successfully');
            addLog('info', 'Message ID: 12345');
          }, 1000);
        }
        break;
      
      case 'logs':
        addLog('info', 'Recent activity:');
        addLog('info', '  [14:32] Message received from user @john');
        addLog('info', '  [14:30] Bot started successfully');
        addLog('info', '  [14:28] Webhook configured');
        break;
      
      default:
        addLog('error', `Unknown command: ${cmd}. Type "help" for available commands.`);
    }
  };

  const handleSendCommand = () => {
    if (!command.trim()) return;
    
    executeCommand(command);
    setCommand('');
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Console',
      'Are you sure you want to clear all console logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => executeCommand('clear') },
      ]
    );
  };

  const getLogColor = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'success': return '#28a745';
      default: return '#333';
    }
  };

  const getLogIcon = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      case 'success': return 'check-circle';
      default: return 'info';
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [logs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Console</Text>
        <View style={styles.headerActions}>
          <View style={[
            styles.statusIndicator,
            isConnected ? styles.statusConnected : styles.statusDisconnected
          ]} />
          <TouchableOpacity onPress={handleClearLogs} style={styles.clearButton}>
            <Icon name="trash-2" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.consoleContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.consoleContent}
      >
        {logs.map((log) => (
          <View key={log.id} style={styles.logEntry}>
            <View style={styles.logHeader}>
              <Icon
                name={getLogIcon(log.level)}
                size={14}
                color={getLogColor(log.level)}
                style={styles.logIcon}
              />
              <Text style={styles.logTimestamp}>
                {log.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </Text>
              {log.source && (
                <Text style={styles.logSource}>[{log.source}]</Text>
              )}
            </View>
            <Text style={[
              styles.logMessage,
              { color: getLogColor(log.level) }
            ]}>
              {log.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.prompt}>$</Text>
          <TextInput
            style={styles.commandInput}
            placeholder="Enter command..."
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={handleSendCommand}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !command.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendCommand}
            disabled={!command.trim()}
          >
            <Icon
              name="send"
              size={16}
              color={command.trim() ? '#007AFF' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickCommands}>
          {['help', 'status', 'connect', 'test'].map((cmd) => (
            <TouchableOpacity
              key={cmd}
              style={styles.quickCommand}
              onPress={() => {
                setCommand(cmd);
                executeCommand(cmd);
                setCommand('');
              }}
            >
              <Text style={styles.quickCommandText}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusConnected: {
    backgroundColor: '#28a745',
  },
  statusDisconnected: {
    backgroundColor: '#dc3545',
  },
  clearButton: {
    padding: 8,
  },
  consoleContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  consoleContent: {
    padding: 16,
  },
  logEntry: {
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logIcon: {
    marginRight: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Courier',
  },
  logSource: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Courier',
  },
  logMessage: {
    fontSize: 14,
    fontFamily: 'Courier',
    lineHeight: 20,
    paddingLeft: 22,
  },
  inputContainer: {
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  prompt: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    marginRight: 8,
  },
  commandInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Courier',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  quickCommands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCommand: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickCommandText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Courier',
  },
});

export default OpenConsoleScreen;