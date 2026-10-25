import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Switch, message, Space } from 'antd';
import { FiBell, FiPlus, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import communicationsApi from '../../api/communications.api';
import orgApi from '../../api/organization.api';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export const AnnouncementsPage = () => {
  const { role } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await communicationsApi.getAnnouncements();
      setAnnouncements(res?.data?.items || []);
    } catch (err) {
      message.error(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await orgApi.getDepartments();
      setDepartments(res?.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchAnnouncements();
    if (role === 'ADMIN' || role === 'HR') fetchDepts();
  }, []);

  const handleCreateFinish = async (values) => {
    setSubmitting(true);
    try {
      await communicationsApi.createAnnouncement(values);
      message.success('Announcement broadcasted successfully');
      setModalOpen(false);
      form.resetFields();
      fetchAnnouncements();
    } catch (err) {
      message.error(err.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = role === 'ADMIN' || role === 'HR';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FiBell className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Announcements</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official company news, policy updates, and executive notices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />} onClick={fetchAnnouncements} className="rounded-xl text-xs font-semibold">
            Refresh
          </Button>

          {isStaff && (
            <Button
              type="primary"
              icon={<FiPlus className="w-3.5 h-3.5" />}
              onClick={() => {
                form.resetFields();
                setModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-xl"
            >
              Post Announcement
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card
            key={item._id}
            className={`border rounded-xl shadow-xs ${
              item.isPinned ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-white'
            }`}
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {item.isPinned && <Tag color="gold" className="text-xs font-bold">PINNED</Tag>}
                <Tag
                  color={item.priority === 'URGENT' ? 'red' : item.priority === 'HIGH' ? 'orange' : 'blue'}
                  className="text-xs font-bold"
                >
                  {item.priority}
                </Tag>
                <h3 className="text-base font-bold text-slate-900 m-0">{item.title}</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono shrink-0">{formatDate(item.createdAt)}</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Author: <strong className="text-slate-700">{item.author?.email || 'HR Operations'}</strong></span>
              <span>Audience: <strong>{item.targetAudience === 'ALL' ? 'Entire Organization' : 'Selected Departments'}</strong></span>
            </div>
          </Card>
        ))}

        {announcements.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No company announcements posted yet.
          </div>
        )}
      </div>

      {/* Post Announcement Modal */}
      <Modal
        title={<span className="font-bold text-slate-900 text-base">Broadcast Announcement</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateFinish} initialValues={{ priority: 'NORMAL', targetAudience: 'ALL' }}>
          <Form.Item name="title" label="Announcement Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Eid Holidays Schedule & Working Hours" />
          </Form.Item>

          <Form.Item name="content" label="Notice Body" rules={[{ required: true, min: 5 }]}>
            <Input.TextArea rows={5} placeholder="Full content of the notice..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority Level">
                <Select
                  options={[
                    { label: 'Normal Priority', value: 'NORMAL' },
                    { label: 'High Priority', value: 'HIGH' },
                    { label: 'Urgent Priority', value: 'URGENT' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPinned" label="Pin to Top" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              Publish Notice
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
