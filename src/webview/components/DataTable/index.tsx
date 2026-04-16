import React, { useEffect, useState } from 'react';
import { Table, Button, Space } from '@arco-design/web-react';
import { useVSCode } from '../../hooks/useVSCode';
import { DataItem, Commands } from '../../types';
import './styles.css';

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: string) => {
      const statusColor: Record<string, string> = {
        '活跃': 'green',
        '非活跃': 'red',
        '待审核': 'orange',
      };
      return <span className={`status-badge status-${statusColor[status] || 'default'}`}>{status}</span>;
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
  },
];

export const DataTable: React.FC = () => {
  const { request, send, on } = useVSCode();
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanup = on(Commands.LOAD_DATA, (payload) => {
      setData(payload as DataItem[]);
    });

    loadData();

    return cleanup;
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await request<DataItem[]>(Commands.REQUEST_DATA);
      setData(result);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    send(Commands.REFRESH_DATA);
  };

  return (
    <div className="data-table-container">
      <div className="toolbar">
        <Space>
          <Button type="primary" loading={loading} onClick={loadData}>
            刷新数据
          </Button>
          <Button onClick={handleRefresh}>推送数据</Button>
        </Space>
      </div>
      <Table columns={columns} data={data} loading={loading} stripe />
    </div>
  );
};
