import { useState, useEffect } from 'react';
import { Table, Input, Popconfirm, Form, Space, InputNumber, Button } from 'antd';
import axios from 'axios';
import { IoSaveOutline } from 'react-icons/io5';
import { RiFileEditFill, RiDeleteBin5Line } from 'react-icons/ri';
import { GiCancel } from 'react-icons/gi';
import "./App.css"
const { Search } = Input;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'number' | 'text';
  record: User;
  index: number;
  children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  // record,
  // index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingKey, setEditingKey] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    axios
      .get('https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json')
      .then((response) => {
        console.log('Fetched Data:', response.data);
        setUsers(response.data);
        setFilteredUsers(response.data);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);
  

  const handleSearch = (value: string) => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(value.toLowerCase()) ||
        user.email.toLowerCase().includes(value.toLowerCase()) ||
        user.role.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const isEditing = (record: User) => record.id === editingKey;

  const edit = (record: User) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.id);
  };
  
  const cancel = () => {
    setEditingKey('');
  };
  

  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...filteredUsers];
      const index = newData.findIndex((item) => key === item.id);

      if (index > -1) {
        newData[index] = { ...newData[index], ...row };
        setFilteredUsers(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.error('Validate Failed:', errInfo);
    }
  };

  const handleDelete = (key: string) => {
    const newData = [...filteredUsers];
    const index = newData.findIndex((item) => key === item.id);
    if (index > -1) {
      newData.splice(index, 1);
      setFilteredUsers(newData);
    }
  };

  const onSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys.map((key) => Number(key)));
  };
  

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    type: 'checkbox' as const,
  };

  const handleDeleteSelected = () => {
    const newData = filteredUsers.filter((user) => !selectedRowKeys.includes(parseInt(user.id, 10)));
    setFilteredUsers(newData);
    setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '10%',
      editable: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      editable: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      editable: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      editable: true,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      render: (_:unknown, record: User) => {
        const editable = isEditing(record);
        return editable ? (
          <Space size="middle">
            <a onClick={() => save(record.id)}><IoSaveOutline/></a>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a><GiCancel style={{ color: 'Red' }} /></a>
            </Popconfirm>
          </Space>
        ) : (
          <Space size="middle">
         <button
  disabled={editingKey !== ''}
  onClick={() => edit(record)}
>
  <RiFileEditFill />
</button>
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.id)}>
              <a><RiDeleteBin5Line style={{ color: 'Red' }} /></a>
            </Popconfirm>
          </Space>
        );
      },
      
    },
  ];

  return (
    <div>
      <Search
        placeholder="Search by name, email, or role"
        onSearch={handleSearch}
        style={{ marginBottom: 16, width: '30%', textAlign: 'center', marginLeft: '35%' }}
      />
      <div style={{ marginBottom: 16 , display:"flex",flexDirection: "row-reverse",}}>
        <div style={{justifyContent:"flex-end"}}>

        
        <Button 
          type="primary"
          onClick={handleDeleteSelected}
          disabled={selectedRowKeys.length === 0}
          danger
        >
          Delete Selected
        </Button>
        </div>
      </div>
      <Form form={form} component={false}>
        <Table
          rowSelection={rowSelection}
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          dataSource={filteredUsers}
          columns={columns.map((col) => {
            if (!col.editable) {
              return col;
            }
            return {
              ...col,
              onCell: (record: User) => ({
                record,
                inputType: col.dataIndex === 'age' ? 'number' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
              }),
            };
          })}
          rowKey="id"
        />
      </Form>
    </div>
  );
};

export default App;
