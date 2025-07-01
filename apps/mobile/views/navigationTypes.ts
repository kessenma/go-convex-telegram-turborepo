import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
    LandingPage: undefined;
    LoginScreen: undefined;
};

export type LandingPageNavigationProp = StackNavigationProp<RootStackParamList, 'LandingPage'>;