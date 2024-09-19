import { Link, Tabs } from 'expo-router';

import { HeaderButton } from '../../components/HeaderButton';
import { TabBarIcon } from '../../components/TabBarIcon';




export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'black',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color }) => <TabBarIcon name="graduation-cap" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <HeaderButton />
            </Link>
          ),
        }}
      />

      <Tabs.Screen
        name="downloads"
        options={{
          title: 'DOWNLOADS',
          tabBarIcon: ({ color }) => <TabBarIcon name="download" color={color} />,
        }}
      />

      <Tabs.Screen
        name="update"
        options={{
          title: 'UPDATE',
          tabBarIcon: ({ color }) => <TabBarIcon name="download" color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="edital"
        options={{
          title: 'EDITAL',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      /> */}

      {/* <Tabs.Screen
        name="account"
        options={{
          title: 'CONTA',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      /> */}
    </Tabs>


  );
}
