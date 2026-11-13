import { lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';

const MainMenu = lazy(() => import('@/features/main-menu/MainMenuScreen'));
const WorldMap = lazy(() => import('@/features/world-map/WorldMapScreen'));
const Dungeon = lazy(() => import('@/features/dungeon/DungeonScreen'));
const Combat = lazy(() => import('@/features/combat/CombatScreen'));
const Heroes = lazy(() => import('@/features/heroes/HeroesScreen'));
const Formation = lazy(() => import('@/features/heroes/FormationScreen'));
const Inventory = lazy(() => import('@/features/inventory/InventoryScreen'));
const Quests = lazy(() => import('@/features/quests/QuestsScreen'));
const Shop = lazy(() => import('@/features/shop/ShopScreen'));
const Arena = lazy(() => import('@/features/pvp/ArenaScreen'));
const Guild = lazy(() => import('@/features/guild/GuildScreen'));
const Settings = lazy(() => import('@/features/settings/SettingsScreen'));
const Profile = lazy(() => import('@/features/profile/ProfileScreen'));
const Mail = lazy(() => import('@/features/mail/MailScreen'));
const CombatTest = lazy(() => import('@/combat/demo/CombatTestScreen'));

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <MainMenu /> },
      { path: 'world', element: <WorldMap /> },
      { path: 'world/:regionId', element: <Dungeon /> },
      { path: 'combat', element: <Combat /> },
      { path: 'heroes', element: <Heroes /> },
      { path: 'heroes/:heroId', element: <Heroes /> },
      { path: 'formation', element: <Formation /> },
      { path: 'inventory', element: <Inventory /> },
      { path: 'quests', element: <Quests /> },
      { path: 'shop', element: <Shop /> },
      { path: 'arena', element: <Arena /> },
      { path: 'guild', element: <Guild /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
      { path: 'mail', element: <Mail /> },
      { path: 'debug/combat', element: <CombatTest /> },
      // Old address of the same test bench
      { path: 'debug/combat-anim', element: <CombatTest /> },
    ],
  },
]);
