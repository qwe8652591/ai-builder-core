/**
 * 应用主组件（简单路由实现）
 */

import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import PurchaseOrderList from './views/PurchaseOrderList.view';
import PurchaseOrderForm from './views/PurchaseOrderForm.view';

type Route = 'list' | 'create' | 'edit' | 'detail';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<Route>('list');
  const [orderId, setOrderId] = useState<string | undefined>(undefined);

  // 简单的路由实现
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (path === '/purchase-order/create') {
        setCurrentRoute('create');
      } else if (path === '/purchase-order/edit') {
        setCurrentRoute('edit');
        setOrderId(searchParams.get('id') || undefined);
      } else if (path.startsWith('/purchase-order/detail/')) {
        setCurrentRoute('detail');
        const id = path.split('/').pop();
        setOrderId(id);
      } else {
        setCurrentRoute('list');
      }
    };

    handleRouteChange();

    // 监听路由变化
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const renderView = () => {
    switch (currentRoute) {
      case 'create':
        return <PurchaseOrderForm />;
      case 'edit':
        return <PurchaseOrderForm />;
      case 'detail':
        return <PurchaseOrderForm />; // 实际应该有单独的详情页
      case 'list':
      default:
        return <PurchaseOrderList />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {renderView()}
      </div>
    </ConfigProvider>
  );
};

export default App;




