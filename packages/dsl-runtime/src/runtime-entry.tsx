/**
 * DSL Runtime 入口模板
 * 
 * 🎯 这是运行时的核心入口，负责：
 * 1. 加载和渲染 DSL 应用
 * 2. 提供布局和路由
 * 3. 初始化数据库
 * 
 * 这个文件在 dsl-runtime 包中，可以直接使用运行时依赖（react、antd）
 * DSL 项目只需要提供纯 DSL 代码
 */

import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, Layout, Menu, Spin, Alert, Avatar, Dropdown, Space } from 'antd';
import { 
  OrderedListOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';

import { 
  createDSLRouter,
  registerComponents,
  initDatabase,
  getMenuRoutes,
  useNavigate,
  getMergedAppConfig,
  vnodeToReactElement,
} from '@ai-builder/jsx-runtime';

import { 
  getAntdComponentMapping,
} from '@ai-builder/runtime-renderer';

// 🎯 数据库配置从全局变量获取（由虚拟入口模块设置）
declare global {
  interface Window {
    __DATABASE_CONFIG__?: {
      persistKey?: string;
      checkTable?: string;
    };
  }
}

// 注册 Antd 组件
registerComponents(getAntdComponentMapping());

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  OrderedListOutlined: <OrderedListOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  SettingOutlined: <SettingOutlined />,
  HomeOutlined: <HomeOutlined />,
};

// 渲染 DSL 插槽组件
function renderSlot(slotComponent: any, props: any = {}): React.ReactNode {
  if (!slotComponent) return null;
  
  if (slotComponent.setup && typeof slotComponent.setup === 'function') {
    try {
      const result = slotComponent.setup(props);
      
      if (typeof result === 'function') {
        const vnode = result();
        if (vnode && typeof vnode === 'object' && 'type' in vnode) {
          return vnodeToReactElement(vnode);
        }
        return vnode;
      }
      
      if (result && typeof result === 'object' && 'type' in result) {
        return vnodeToReactElement(result);
      }
      
      return result;
    } catch (e) {
      console.error('[Slot] Failed to render:', slotComponent.meta?.name || slotComponent.name, e);
      return null;
    }
  }
  
  return null;
}

// 应用布局组件
function AppLayout({ children, routes }: { children: React.ReactNode; routes: any[] }) {
  const appConfig = getMergedAppConfig();
  const slots = (appConfig as any).slots || {};

  const [currentPath, setCurrentPath] = React.useState(() => {
    return typeof window !== 'undefined' ? window.location.hash.replace('#', '') || '/orders' : '/orders';
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const newPath = window.location.hash.replace('#', '') || '/orders';
      setCurrentPath(newPath);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const menuRoutes = getMenuRoutes(routes);
  const navigate = useNavigate();
  
  const menuItems = menuRoutes.map(route => ({
    key: route.path,
    icon: route.icon ? iconMap[route.icon] || <HomeOutlined /> : <HomeOutlined />,
    label: route.title,
  }));

  const getPageTitle = () => {
    const route = menuRoutes.find(r => r.path === currentPath);
    return route?.title || appConfig.name || 'DSL App';
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider 
        width={appConfig.menu?.width || 220}
        style={{ 
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ 
          height: appConfig.header?.height || 56, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          fontSize: 18,
          fontWeight: 'bold',
          color: appConfig.theme?.primaryColor || '#1890ff',
        }}>
          <span style={{ marginRight: 8 }}>{appConfig.logo || '📦'}</span>
          {appConfig.name || 'DSL App'}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, borderRight: 0 }}
        />
        
        {slots.sidebarFooter && renderSlot(slots.sidebarFooter)}
      </Layout.Sider>
      
      <Layout>
        <Layout.Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          height: appConfig.header?.height || 56,
          lineHeight: `${appConfig.header?.height || 56}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {getPageTitle()}
          </div>
          
          <Space>
            {slots.headerRight && renderSlot(slots.headerRight)}
            
            {appConfig.header?.showUser && (
              <Dropdown menu={{ items: userMenuItems }}>
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                </Space>
              </Dropdown>
            )}
          </Space>
        </Layout.Header>
        
        <Layout.Content style={{ background: '#fff' }}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

// 应用组件
export function App({ routes, initSqlContent }: { 
  routes: any[]; 
  initSqlContent?: string;
}) {
  const [dbReady, setDbReady] = React.useState(false);
  const [dbError, setDbError] = React.useState<string | null>(null);
  
  // 创建路由
  const { Provider: AppRouter } = React.useMemo(() => createDSLRouter(routes, {
    fallback: (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    ),
    notFound: (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert type="warning" message="404 - 页面不存在" />
      </div>
    ),
  }), [routes]);

  React.useEffect(() => {
    const init = async () => {
      try {
        const dbConfig = window.__DATABASE_CONFIG__;
        
        await initDatabase({
          type: 'sqlite',
          sqlJsModule: (window as any).initSqlJs,
          persistKey: dbConfig?.persistKey || 'dsl-app',
          mockDataSQL: initSqlContent,
          loadMockData: !!initSqlContent,
          checkTable: dbConfig?.checkTable,
          debug: true,
        });
        
        setDbReady(true);
      } catch (error) {
        console.error('Failed to init database:', error);
        setDbError(String(error));
      }
    };
    
    init();
  }, [initSqlContent]);

  if (dbError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="数据库初始化失败" description={dbError} />
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AppLayout routes={routes}>
        <AppRouter />
      </AppLayout>
    </ConfigProvider>
  );
}

// 渲染函数
export function render(routes: any[], initSqlContent?: string) {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(<App routes={routes} initSqlContent={initSqlContent} />);
}
