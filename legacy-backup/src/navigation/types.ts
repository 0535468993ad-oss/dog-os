import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Training: undefined;
};

export type RootTabRouteName = keyof RootTabParamList;

export type RootTabScreenProps<T extends RootTabRouteName> = BottomTabScreenProps<
  RootTabParamList,
  T
>;

// Types useNavigation() and <Link> app-wide against our route list.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
